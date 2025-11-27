// frontend/src/pages/SimulatorPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import ConfigForm from "../components/ConfigForm";
import ResultsCharts from "../components/ResultsCharts";
import CPUVisualization from "../components/CPUVisualization";

const defaultConfig = {
  cache_size_kb: 32,
  cache_block_size_b: 64,
  cache_associativity: 4,
  mem_size_gb: 8,
  mem_bandwidth_gbs: 25,
  mem_latency_ns: 80,
  reg_count: 32,
  reg_width_bits: 64,
  bus_width_bits: 64,
  bus_freq_ghz: 2.4,
  clock_freq_ghz: 3.0,
  pipeline_depth: 14,
  issue_width: 4,
  alu_width_bits: 64,
  branch_predictor: "bimodal"
};

const SimulatorPage = () => {
  const [config, setConfig] = useState(defaultConfig);
  const [results, setResults] = useState(null);
  const [predefined, setPredefined] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    api.get("/predefined-configs").then((res) => setPredefined(res.data));
  }, []);

  const handleChange = (name, value) => {
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await api.post("/simulate", config);
      setResults(res.data);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLoadPredefined = (cfg) => {
    setConfig(cfg);
  };

  return (
    <section className="page simulator-page">
      <div className="simulator-layout">
        <div className="sim-left">
          <CPUVisualization results={results} />
          <ConfigForm
            config={config}
            onChange={handleChange}
            onSimulate={handleSimulate}
            predefinedConfigs={predefined}
            onLoadPredefined={handleLoadPredefined}
            isSimulating={isSimulating}
          />
        </div>
        <div className="sim-right">
          <ResultsCharts results={results} />
        </div>
      </div>
    </section>
  );
};

export default SimulatorPage;
