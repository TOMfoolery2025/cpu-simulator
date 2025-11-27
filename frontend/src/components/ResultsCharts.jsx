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
    ipc_index
  } = results;

  const bars = {
    labels: ["IPC", "Perf", "Power", "Efficiency"],
    datasets: [
      {
        label: "Indices (normalized)",
        data: [ipc_index, performance_index, power_index, efficiency_index]
      }
    ]
  };

  const latencyBars = {
    labels: ["Cache Hit Time (ns)", "AMAT (ns)"],
    datasets: [
      {
        label: "Latency",
        data: [cache_hit_time_ns, amat_ns]
      }
    ]
  };

  const ratesBars = {
    labels: ["Hit rate (%)", "Miss rate (%)", "Branch mispredict (%)"],
    datasets: [
      {
        label: "Rates",
        data: [
          cache_hit_rate * 100,
          cache_miss_rate * 100,
          branch_mispredict_rate * 100
        ]
      }
    ]
  };

  return (
    <div className="results-panel">
      <h2>Simulation Results</h2>
      <div className="results-grid">
        <div>
          <h3>Cache & Branch Rates</h3>
          <Bar data={ratesBars} />
        </div>
        <div>
          <h3>Latency</h3>
          <Bar data={latencyBars} />
        </div>
        <div>
          <h3>Performance / Power / Efficiency</h3>
          <Bar data={bars} />
        </div>
      </div>

      <div className="raw-results">
        <h3>Raw Values</h3>
        <ul>
          <li>Cache hit rate: {(cache_hit_rate * 100).toFixed(2)}%</li>
          <li>Cache miss rate: {(cache_miss_rate * 100).toFixed(2)}%</li>
          <li>Cache hit time: {cache_hit_time_ns.toFixed(2)} ns</li>
          <li>AMAT: {amat_ns.toFixed(2)} ns</li>
          <li>Branch mispredict: {(branch_mispredict_rate * 100).toFixed(2)}%</li>
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
