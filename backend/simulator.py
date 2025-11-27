# backend/simulator.py
from dataclasses import dataclass, asdict

def clamp(x, x_min, x_max):
    return max(x_min, min(x, x_max))

@dataclass
class ArchConfig:
    cache_size_kb: float = 32.0
    cache_block_size_b: int = 64
    cache_associativity: int = 4
    cache_hit_time_ns: float = 1.0

    mem_size_gb: float = 8.0
    mem_bandwidth_gbs: float = 25.0
    mem_latency_ns: float = 80.0

    reg_count: int = 32
    reg_width_bits: int = 64

    bus_width_bits: int = 64
    bus_freq_ghz: float = 2.4

    clock_freq_ghz: float = 3.0
    pipeline_depth: int = 14
    issue_width: int = 4
    alu_width_bits: int = 64

    branch_predictor: str = "bimodal"  # "static", "bimodal", "tournament"

def estimate_branch_mispredict_rate(cfg: ArchConfig) -> float:
    base = {
        "static": 0.15,
        "bimodal": 0.08,
        "tournament": 0.04
    }.get(cfg.branch_predictor.lower(), 0.08)
    return base

def estimate_cache_hit_rate(cfg: ArchConfig) -> float:
    size_factor = clamp(cfg.cache_size_kb / 32.0, 0.25, 4.0)
    assoc_factor = clamp(cfg.cache_associativity / 4.0, 0.25, 4.0)
    block_factor = clamp(cfg.cache_block_size_b / 64.0, 0.5, 2.0)

    base_hit = 0.90
    hit = (base_hit
           + 0.03 * (size_factor - 1.0)
           + 0.02 * (assoc_factor - 1.0)
           + 0.01 * (block_factor - 1.0))

    return clamp(hit, 0.5, 0.995)

def estimate_cache_access_time(cfg: ArchConfig) -> float:
    size_factor = clamp(cfg.cache_size_kb / 32.0, 0.25, 4.0)
    assoc_factor = clamp(cfg.cache_associativity / 4.0, 0.25, 4.0)
    latency_factor = 1.0 + 0.15 * (size_factor - 1.0) + 0.10 * (assoc_factor - 1.0)
    return cfg.cache_hit_time_ns * latency_factor

def estimate_memory_latency(cfg: ArchConfig) -> float:
    bw_factor = clamp(cfg.mem_bandwidth_gbs / 25.0, 0.25, 4.0)
    latency = cfg.mem_latency_ns / (0.7 + 0.3 * bw_factor)
    return latency

def estimate_AMAT(cfg: ArchConfig) -> float:
    hit_rate = estimate_cache_hit_rate(cfg)
    hit_time = estimate_cache_access_time(cfg)
    mem_lat = estimate_memory_latency(cfg)
    transfer_penalty = 10.0
    miss_penalty = mem_lat + transfer_penalty
    amat = hit_time + (1.0 - hit_rate) * miss_penalty
    return amat

def estimate_cache_power_index(cfg: ArchConfig) -> float:
    size_factor = cfg.cache_size_kb / 32.0
    assoc_factor = cfg.cache_associativity / 4.0
    block_factor = (cfg.cache_block_size_b / 64.0) ** 0.5
    return clamp(size_factor * assoc_factor * block_factor, 0.1, 10.0)

def estimate_memory_power_index(cfg: ArchConfig) -> float:
    size_factor = cfg.mem_size_gb / 8.0
    bw_factor = cfg.mem_bandwidth_gbs / 25.0
    return clamp(0.5 * size_factor + 0.5 * bw_factor, 0.1, 10.0)

def estimate_bus_power_index(cfg: ArchConfig) -> float:
    width_factor = cfg.bus_width_bits / 64.0
    freq_factor = cfg.bus_freq_ghz / 2.4
    return clamp(width_factor * freq_factor, 0.1, 10.0)

def estimate_core_power_index(cfg: ArchConfig) -> float:
    freq_factor = cfg.clock_freq_ghz / 3.0
    issue_factor = cfg.issue_width / 4.0
    alu_factor = cfg.alu_width_bits / 64.0
    return clamp(freq_factor * (0.5 * issue_factor + 0.5 * alu_factor), 0.1, 10.0)

def estimate_IPC(cfg: ArchConfig) -> float:
    issue_factor = clamp(cfg.issue_width / 4.0, 0.5, 2.0)
    reg_factor = clamp(cfg.reg_count / 32.0, 0.5, 2.0)
    base_ipc = 1.0 * issue_factor * (0.5 + 0.5 * reg_factor)

    hit_rate = estimate_cache_hit_rate(cfg)
    miss_rate = 1.0 - hit_rate
    mispredict_rate = estimate_branch_mispredict_rate(cfg)

    mem_stall_factor = 1.0 + 4.0 * miss_rate
    branch_penalty_cycles = cfg.pipeline_depth
    branch_stall_factor = 1.0 + mispredict_rate * branch_penalty_cycles / 10.0

    ipc = base_ipc / (mem_stall_factor * branch_stall_factor)
    return clamp(ipc, 0.05, 4.0)

def estimate_performance_index(cfg: ArchConfig) -> float:
    ipc = estimate_IPC(cfg)
    freq_factor = cfg.clock_freq_ghz / 3.0
    perf_index = ipc * freq_factor
    return perf_index

def estimate_total_power_index(cfg: ArchConfig) -> float:
    core_p = estimate_core_power_index(cfg)
    cache_p = estimate_cache_power_index(cfg)
    mem_p = estimate_memory_power_index(cfg)
    bus_p = estimate_bus_power_index(cfg)
    total = 0.4 * core_p + 0.3 * cache_p + 0.2 * mem_p + 0.1 * bus_p
    return total

def simulate(cfg: ArchConfig) -> dict:
    hit_rate = estimate_cache_hit_rate(cfg)
    miss_rate = 1.0 - hit_rate
    cache_hit_time = estimate_cache_access_time(cfg)
    amat = estimate_AMAT(cfg)
    ipc = estimate_IPC(cfg)
    perf = estimate_performance_index(cfg)
    power = estimate_total_power_index(cfg)
    efficiency = perf / power if power > 0 else 0.0
    mispredict_rate = estimate_branch_mispredict_rate(cfg)

    return {
        "config": asdict(cfg),
        "cache_hit_rate": hit_rate,
        "cache_miss_rate": miss_rate,
        "cache_hit_time_ns": cache_hit_time,
        "amat_ns": amat,
        "branch_mispredict_rate": mispredict_rate,
        "ipc_index": ipc,
        "performance_index": perf,
        "power_index": power,
        "efficiency_index": efficiency,
    }
