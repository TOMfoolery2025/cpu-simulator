# backend/simulator.py
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict


def clamp(x: float, lo: float, hi: float) -> float:
  return max(lo, min(hi, x))


@dataclass
class ArchConfig:
  # L1 cache (basic)
  cache_size_kb: float = 32.0
  cache_block_size_b: int = 64
  cache_associativity: int = 4
  cache_replacement_policy: str = "lru"
  cache_hit_time_ns: float = 1.0

  # Multi-level cache (advanced)
  l2_cache_size_kb: float = 0.0          # 0 => disabled
  l2_cache_hit_time_ns: float = 4.0
  l3_cache_size_kb: float = 0.0          # 0 => disabled
  l3_cache_hit_time_ns: float = 12.0

  # Memory subsystem
  mem_size_gb: float = 8.0
  mem_bandwidth_gbs: float = 25.0
  mem_latency_ns: float = 80.0

  # Registers / bus / ALU
  reg_count: int = 32
  reg_width_bits: int = 64
  bus_width_bits: int = 64
  bus_freq_ghz: float = 2.4
  alu_width_bits: int = 64

  # Core
  clock_freq_ghz: float = 3.0
  pipeline_depth: int = 14
  issue_width: int = 4

  # Branch prediction
  branch_predictor: str = "bimodal"
  mispredict_penalty_cycles: int = 15

  # Power model
  static_power_per_kb: float = 0.02          # W per KB
  dynamic_power_per_access: float = 0.005    # W per access
  cache_leakage_power: float = 0.1           # W
  miss_penalty_power: float = 0.05           # W per miss
  operating_voltage: float = 1.0             # V (not fully used, but kept for future)

  # Workload
  num_instructions: int = 1_000_000


# ---------- BASIC SUBMODELS ----------


def estimate_memory_latency(cfg: ArchConfig) -> float:
  """
  Very rough memory latency based on DRAM latency and bandwidth.
  Lower bandwidth or higher base latency -> higher effective latency.
  """
  base = cfg.mem_latency_ns
  bw_factor = clamp(25.0 / max(cfg.mem_bandwidth_gbs, 1e-3), 0.7, 2.0)
  return base * bw_factor


def _estimate_level_hit_rate(size_kb: float, assoc: int, block_b: int) -> float:
  """
  Analytical hit-rate model for a single cache level.
  Bigger size, higher associativity, and reasonable block size improve hit rate.
  """
  if size_kb <= 0:
    return 0.0

  base_hit = 0.90
  size_factor = min(size_kb / 32.0, 4.0)
  assoc_factor = min(assoc / 4.0, 4.0)
  block_factor = min(block_b / 64.0, 2.0)

  hit = (
      base_hit
      + 0.03 * (size_factor - 1.0)
      + 0.02 * (assoc_factor - 1.0)
      + 0.01 * (block_factor - 1.0)
  )
  return clamp(hit, 0.3, 0.995)


def estimate_multi_level_cache(cfg: ArchConfig) -> Dict[str, float]:
  """
  Compute L1/L2/L3 hit rates and AMAT for a simple inclusive hierarchy.
  """
  # L1
  l1_hit = _estimate_level_hit_rate(
      cfg.cache_size_kb, cfg.cache_associativity, cfg.cache_block_size_b
  )
  l1_time = cfg.cache_hit_time_ns

  # L2
  l2_present = cfg.l2_cache_size_kb > 0
  l2_hit = _estimate_level_hit_rate(
      cfg.l2_cache_size_kb, cfg.cache_associativity, cfg.cache_block_size_b
  ) if l2_present else 0.0
  l2_time = cfg.l2_cache_hit_time_ns if l2_present else 0.0

  # L3
  l3_present = cfg.l3_cache_size_kb > 0
  l3_hit = _estimate_level_hit_rate(
      cfg.l3_cache_size_kb, cfg.cache_associativity, cfg.cache_block_size_b
  ) if l3_present else 0.0
  l3_time = cfg.l3_cache_hit_time_ns if l3_present else 0.0

  # Memory penalty
  mem_lat = estimate_memory_latency(cfg)
  transfer_penalty = 10.0  # simple extra cost from bus / controller
  mem_penalty = mem_lat + transfer_penalty

  l1_miss = 1.0 - l1_hit
  l2_miss = 1.0 - l2_hit
  l3_miss = 1.0 - l3_hit

  # AMAT = L1 + miss chain
  amat = (
      l1_time
      + l1_miss * (
          (l2_time if l2_present else 0.0)
          + (l2_miss if l2_present else 1.0)
          * (
              (l3_time if l3_present else 0.0)
              + (l3_miss if l3_present else 1.0) * mem_penalty
          )
      )
  )

  # Probability of hitting in any cache level
  any_hit = l1_hit + l1_miss * (l2_hit + (1.0 - l2_hit) * l3_hit)
  any_miss = 1.0 - any_hit

  return {
      "l1_hit_rate": l1_hit,
      "l2_hit_rate": l2_hit,
      "l3_hit_rate": l3_hit,
      "overall_hit_rate": any_hit,
      "overall_miss_rate": any_miss,
      "amat_ns": amat,
  }


def estimate_branch_mispredict_rate(cfg: ArchConfig) -> float:
  """
  Very coarse mapping from branch predictor style to mispredict rate.
  """
  predictor = cfg.branch_predictor.lower()
  base = {
      "off": 0.50,       # basically no prediction
      "static": 0.15,
      "bimodal": 0.08,
      "tournament": 0.04,
  }.get(predictor, 0.08)
  return base


def estimate_IPC(cfg: ArchConfig, amat_ns: float, mispredict_rate: float) -> float:
  """
  Analytical IPC model: base IPC from issue width & pipeline,
  penalized by memory latency and branch mispredicts.
  """
  # Base IPC from width and pipeline
  base_ipc = min(cfg.issue_width * 0.9, 4.0)

  # Deeper pipeline can increase poss. IPC but more sensitive to hazards
  depth_penalty = clamp((cfg.pipeline_depth - 8) / 32.0, -0.3, 0.3)
  base_ipc *= (1.0 - max(depth_penalty, 0.0))

  # Memory and branch influence
  mem_factor = clamp(1.0 - (amat_ns / 200.0), 0.4, 1.0)
  branch_factor = clamp(1.0 - mispredict_rate * 0.8, 0.3, 1.0)

  ipc = base_ipc * mem_factor * branch_factor
  return clamp(ipc, 0.1, 5.0)


def estimate_performance_index(cfg: ArchConfig, ipc: float) -> float:
  """
  A normalized performance index combining IPC and clock frequency.
  """
  return ipc * cfg.clock_freq_ghz / 3.0


def estimate_power_index(cfg: ArchConfig) -> float:
  """
  Simple power index based on frequency, voltage, and widths.
  """
  freq_factor = cfg.clock_freq_ghz / 3.0
  width_factor = (cfg.reg_width_bits / 64.0 + cfg.alu_width_bits / 64.0) / 2.0
  cache_factor = (cfg.cache_size_kb / 32.0)
  voltage_factor = cfg.operating_voltage / 1.0

  idx = freq_factor * (0.5 + 0.5 * width_factor) * (0.6 + 0.4 * cache_factor) * voltage_factor
  return clamp(idx, 0.1, 10.0)


def estimate_efficiency_index(perf_index: float, power_index: float) -> float:
  if power_index <= 0:
    return 0.0
  return perf_index / power_index


# ---------- POWER ANALYSIS ----------


def estimate_power_consumption(cfg: ArchConfig, hit_rate: float, miss_rate: float) -> Dict[str, float]:
  """
  Estimate power & energy using the analytical cache model plus workload size.
  """
  total_accesses = max(cfg.num_instructions, 1)
  hits = total_accesses * hit_rate
  misses = total_accesses * miss_rate

  static_power = cfg.static_power_per_kb * cfg.cache_size_kb
  dynamic_power = cfg.dynamic_power_per_access * hits
  leakage_power = cfg.cache_leakage_power
  miss_penalty_power = cfg.miss_penalty_power * misses

  average_power = static_power + dynamic_power + leakage_power + miss_penalty_power
  total_energy = average_power * 1.0  # assume 1s window for normalization
  energy_per_access = total_energy / total_accesses

  # Simple area approximation
  area_cm2 = max(cfg.cache_size_kb * 0.001, 0.001)
  power_density = average_power / area_cm2

  return {
      "total_energy_consumption": total_energy,
      "average_power_consumption": average_power,
      "energy_per_access": energy_per_access,
      "power_density": power_density,
  }


# ---------- BRANCH & EXECUTION ANALYSIS ----------


def analyze_branch_prediction(cfg: ArchConfig, mispredict_rate: float, ipc_raw: float) -> Dict[str, float]:
  """
  Quantify branch behavior: mispredicts, stall cycles, IPC before/after.
  """
  total_instructions = max(cfg.num_instructions, 1)

  # Roughly 20% of instructions are branches
  branch_density = 0.20
  total_branches = total_instructions * branch_density
  mispredict_count = total_branches * mispredict_rate

  stall_cycles = mispredict_count * cfg.mispredict_penalty_cycles

  ipc_before = max(ipc_raw, 1e-6)

  # Convert IPC to CPI
  cpi_before = 1.0 / ipc_before
  cpi_after = cpi_before + (stall_cycles / total_instructions)
  ipc_after = 1.0 / cpi_after

  ipc_loss_percent = (
      ((ipc_before - ipc_after) / ipc_before) * 100.0
      if ipc_before > 0 else 0.0
  )

  predictor_efficiency = 1.0 - mispredict_rate

  return {
      "branch_total_branches": total_branches,
      "branch_mispredict_count": mispredict_count,
      "branch_stall_cycles": stall_cycles,
      "branch_ipc_before": ipc_before,
      "branch_ipc_after": ipc_after,
      "branch_ipc_loss_percent": ipc_loss_percent,
      "branch_predictor_efficiency": predictor_efficiency,
  }


def analyze_execution_time(
    cfg: ArchConfig,
    ipc_before: float,
    ipc_after: float,
) -> Dict[str, float]:
  """
  Estimate ideal vs actual cycles and total execution time in seconds.
  """
  total_instructions = max(cfg.num_instructions, 1)
  ipc_before = max(ipc_before, 1e-6)
  ipc_after = max(ipc_after, 1e-6)

  ideal_cycles = total_instructions / ipc_before
  actual_cycles = total_instructions / ipc_after
  stall_cycles = max(0.0, actual_cycles - ideal_cycles)

  cycles_per_sec = max(cfg.clock_freq_ghz * 1e9, 1.0)
  execution_time_sec = actual_cycles / cycles_per_sec

  return {
      "execution_time_sec": execution_time_sec,
      "stall_cycles_total": stall_cycles,
      "ideal_cycles": ideal_cycles,
      "actual_cycles": actual_cycles,
  }


# ---------- MAIN SIMULATION ENTRYPOINT ----------


def simulate(cfg: ArchConfig) -> Dict[str, float]:
  """
  Top-level simulation function. Returns a dict of metrics consumed by the frontend.
  """
  # Cache + memory
  mlc = estimate_multi_level_cache(cfg)
  hit_rate = mlc["overall_hit_rate"]
  miss_rate = mlc["overall_miss_rate"]
  amat = mlc["amat_ns"]

  # Branch & IPC
  mispredict_rate = estimate_branch_mispredict_rate(cfg)
  ipc = estimate_IPC(cfg, amat, mispredict_rate)
  perf = estimate_performance_index(cfg, ipc)
  power_idx = estimate_power_index(cfg)
  efficiency = estimate_efficiency_index(perf, power_idx)

  branch_analysis = analyze_branch_prediction(cfg, mispredict_rate, ipc)
  exec_analysis = analyze_execution_time(
      cfg,
      branch_analysis["branch_ipc_before"],
      branch_analysis["branch_ipc_after"],
  )

  power_analysis = estimate_power_consumption(cfg, hit_rate, miss_rate)

  return {
      "config": asdict(cfg),

      # Cache & memory summary
      "cache_hit_rate": hit_rate,
      "cache_miss_rate": miss_rate,
      "cache_hit_time_ns": cfg.cache_hit_time_ns,
      "amat_ns": mlc["amat_ns"],
      "l1_cache_hit_rate": mlc["l1_hit_rate"],
      "l2_cache_hit_rate": mlc["l2_hit_rate"],
      "l3_cache_hit_rate": mlc["l3_hit_rate"],

      # Branch & IPC summary
      "branch_mispredict_rate": mispredict_rate,
      "ipc_index": ipc,
      "performance_index": perf,
      "power_index": power_idx,
      "efficiency_index": efficiency,

      # Detailed analyses
      **power_analysis,
      **branch_analysis,
      **exec_analysis,
  }


if __name__ == "__main__":
  # Simple manual test
  cfg = ArchConfig()
  out = simulate(cfg)
  for k, v in out.items():
    if k == "config":
      continue
    print(f"{k}: {v}")
