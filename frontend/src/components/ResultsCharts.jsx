// frontend/src/components/ResultsCharts.jsx
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Helper to derive chart colors from the current theme
const getChartTheme = () => {
  if (typeof document === "undefined") {
    // Fallback (SSR/tests) – assume light mode
    return {
      mode: "light",
      textMain: "#111827",
      textMuted: "#4b5563",
      barMain: "#111827",
      barAlt: "#374151",
      grid: "rgba(148,163,184,0.5)",
      tooltipBg: "#f9fafb",
      tooltipText: "#111827",
      borderAccent: "#2563eb"
    };
  }

  const root = document.documentElement;
  const modeAttr = root.getAttribute("data-theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const mode = modeAttr || (prefersDark ? "dark" : "light");

  const styles = getComputedStyle(root);
  const accentVar = styles.getPropertyValue("--accent").trim();
  const textVar = styles.getPropertyValue("--text").trim();
  const textMutedVar = styles.getPropertyValue("--text-muted").trim();
  const accentFallback = mode === "dark" ? "#38bdf8" : "#2563eb";

  if (mode === "dark") {
    // Dark theme: light bars & text on dark background
    return {
      mode: "dark",
      textMain: textVar || "#e5e7eb",
      textMuted: textMutedVar || "#9ca3af",
      barMain: "#e3e3e4e3",
      barAlt: "#a4a8aed4",
      grid: "rgba(148,163,184,0.28)",
      tooltipBg: "rgba(15,23,42,0.96)",
      tooltipText: "#f9fafb",
      borderAccent: accentVar || accentFallback
    };
  }

  // Light theme: dark bars & text on light background
  return {
    mode: "light",
    textMain: textVar || "#111827",
    textMuted: textMutedVar || "#4b5563",
    barMain: "#111827e2",
    barAlt: "#374151ec",
    grid: "rgba(148,163,184,0.55)",
    tooltipBg: "#f9fafb",
    tooltipText: "#111827",
    borderAccent: accentVar || accentFallback
  };
};

const ResultsCharts = ({ results }) => {
  if (!results) return null;

  const {
    cache_hit_rate,
    cache_miss_rate,
    cache_hit_time_ns,
    amat_ns,
    branch_mispredict_rate,
    performance_index,
    power_index,
    efficiency_index,
    ipc_index,
    total_energy_consumption,
    average_power_consumption,
    energy_per_access,
    power_density,
    branch_total_branches,
    branch_mispredict_count,
    branch_stall_cycles,
    branch_ipc_before,
    branch_ipc_after,
    branch_ipc_loss_percent,
    branch_predictor_efficiency
  } = results;

  const chartTheme = getChartTheme();

  const commonBarStyles = {
    borderWidth: 1,
    borderColor: chartTheme.borderAccent,
    borderRadius: 4,
    borderSkipped: false
  };

  // Performance / Power / Efficiency / IPC
  const bars = {
    labels: ["IPC", "Perf", "Power", "Efficiency"],
    datasets: [
      {
        label: "Indices (normalized)",
        data: [ipc_index, performance_index, power_index, efficiency_index],
        // Alternating grayscale for subtle variety
        backgroundColor: [
          chartTheme.barMain,
          chartTheme.barAlt,
          chartTheme.barMain,
          chartTheme.barAlt
        ],
        ...commonBarStyles
      }
    ]
  };

  // Latency (ns)
  const latencyBars = {
    labels: ["Cache Hit Time (ns)", "AMAT (ns)"],
    datasets: [
      {
        label: "Latency",
        data: [cache_hit_time_ns, amat_ns],
        backgroundColor: [chartTheme.barMain, chartTheme.barAlt],
        ...commonBarStyles
      }
    ]
  };

  // Hit/Miss/Branch rates (%)
  const ratesBars = {
    labels: ["Hit rate (%)", "Miss rate (%)", "Branch mispredict (%)"],
    datasets: [
      {
        label: "Rates",
        data: [
          cache_hit_rate * 100,
          cache_miss_rate * 100,
          branch_mispredict_rate * 100
        ],
        backgroundColor: [
          chartTheme.barMain,
          chartTheme.barAlt,
          chartTheme.barMain
        ],
        ...commonBarStyles
      }
    ]
  };

  // Shared chart options: only change colors, keep sizing behavior
  const chartOptions = {
    responsive: true, // keep default aspect ratio to avoid "growing indefinitely"
    plugins: {
      legend: {
        labels: {
          color: chartTheme.textMain,
          font: {
            size: 11,
            family:
              'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif'
          },
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBg,
        titleColor: chartTheme.tooltipText,
        bodyColor: chartTheme.tooltipText,
        borderColor: chartTheme.borderAccent,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        ticks: {
          color: chartTheme.textMuted,
          font: { size: 10 },
          maxRotation: 0
        },
        grid: {
          color: chartTheme.grid
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: chartTheme.textMuted,
          font: { size: 10 }
        },
        grid: {
          color: chartTheme.grid
        }
      }
    }
  };

  return (
    <div className="results-panel">
      <h2>Simulation Results</h2>

      {/* === TOP KPI ROW: Performance, IPC, Efficiency === */}
      <div className="results-kpi-row">
        <div className="results-kpi-card">
          <div className="results-kpi-label">Performance</div>
          <div className="results-kpi-value">
            {performance_index != null ? performance_index.toFixed(2) : "--"}
          </div>
          <div className="results-kpi-sub">relative units</div>
        </div>

        <div className="results-kpi-card">
          <div className="results-kpi-label">IPC</div>
          <div className="results-kpi-value">
            {ipc_index != null ? ipc_index.toFixed(2) : "--"}
          </div>
          <div className="results-kpi-sub">instructions / cycle</div>
        </div>

        <div className="results-kpi-card">
          <div className="results-kpi-label">Efficiency</div>
          <div className="results-kpi-value">
            {efficiency_index != null ? efficiency_index.toFixed(2) : "--"}
          </div>
          <div className="results-kpi-sub">perf / power</div>
        </div>
      </div>

      {/* === CHART GRID === */}
      <div className="results-grid">
        <div>
          <h3>Cache &amp; Branch Rates</h3>
          <Bar data={ratesBars} options={chartOptions} />
        </div>
        <div>
          <h3>Latency</h3>
          <Bar data={latencyBars} options={chartOptions} />
        </div>
        {/* NOTE: removed the "Performance / Power / Efficiency" chart as requested */}
      </div>

      {/* === POWER CONSUMPTION ANALYSIS (TABLE) === */}
      <div className="results-analysis-section">
        <h3>Power Consumption Analysis</h3>

        <div className="results-analysis-table">
          <div className="results-analysis-row">
            <span className="results-analysis-label">
              Total energy consumption
            </span>
            <span className="results-analysis-value">
              {total_energy_consumption != null
                ? `${total_energy_consumption.toFixed(4)} J`
                : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">
              Average power consumption
            </span>
            <span className="results-analysis-value">
              {average_power_consumption != null
                ? `${average_power_consumption.toFixed(4)} W`
                : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">Energy per access</span>
            <span className="results-analysis-value">
              {energy_per_access != null
                ? `${energy_per_access.toExponential(3)} J/access`
                : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">Power density</span>
            <span className="results-analysis-value">
              {power_density != null
                ? `${power_density.toFixed(3)} W/cm²`
                : "--"}
            </span>
          </div>
        </div>
      </div>

      {/* === BRANCH PREDICTION ANALYSIS (TABLE) === */}
      <div className="results-analysis-section">
        <h3>Branch Prediction Analysis</h3>

        <div className="results-analysis-table">
          <div className="results-analysis-row">
            <span className="results-analysis-label">Total branches</span>
            <span className="results-analysis-value">
              {branch_total_branches != null
                ? branch_total_branches.toLocaleString()
                : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">
              Mispredicted branches
            </span>
            <span className="results-analysis-value">
              {branch_mispredict_count != null
                ? branch_mispredict_count.toLocaleString()
                : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">Stall cycles</span>
            <span className="results-analysis-value">
              {branch_stall_cycles != null
                ? branch_stall_cycles.toLocaleString()
                : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">IPC before stalls</span>
            <span className="results-analysis-value">
              {branch_ipc_before != null
                ? branch_ipc_before.toFixed(2)
                : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">IPC after stalls</span>
            <span className="results-analysis-value">
              {branch_ipc_after != null ? branch_ipc_after.toFixed(2) : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">IPC loss</span>
            <span className="results-analysis-value">
              {branch_ipc_loss_percent != null
                ? `${branch_ipc_loss_percent.toFixed(1)}%`
                : "--"}
            </span>
          </div>

          <div className="results-analysis-row">
            <span className="results-analysis-label">Predictor efficiency</span>
            <span className="results-analysis-value">
              {branch_predictor_efficiency != null
                ? `${(branch_predictor_efficiency * 100).toFixed(1)}%`
                : "--"}
            </span>
          </div>
        </div>
      </div>

      {/* === RAW VALUES (unchanged) === */}
      <div className="raw-results">
        <h3>Raw Values</h3>
        <ul>
          <li>Cache hit rate: {(cache_hit_rate * 100).toFixed(2)}%</li>
          <li>Cache miss rate: {(cache_miss_rate * 100).toFixed(2)}%</li>
          <li>Cache hit time: {cache_hit_time_ns.toFixed(2)} ns</li>
          <li>AMAT: {amat_ns.toFixed(2)} ns</li>
          <li>
            Branch mispredict: {(branch_mispredict_rate * 100).toFixed(2)}%
          </li>
          <li>IPC index: {ipc_index.toFixed(3)}</li>
          <li>Performance index: {performance_index.toFixed(3)}</li>
          <li>Power index: {power_index.toFixed(3)}</li>
          <li>Efficiency index: {efficiency_index.toFixed(3)}</li>
        </ul>
      </div>
    </div>
  );
};

export default ResultsCharts;
