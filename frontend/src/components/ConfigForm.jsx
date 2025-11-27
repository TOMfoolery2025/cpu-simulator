// frontend/src/components/ConfigForm.jsx
import React from "react";

const SliderField = ({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step,
  tooltip,
  unit = ""
}) => (
  <div className="form-group slider-field">
    <div className="label-row">
      <label title={tooltip}>{label}</label>
      <span className="value-pill">
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(name, Number(e.target.value))}
    />
    <div className="range-minmax">
      <span>
        {min}
        {unit}
      </span>
      <span>
        {max}
        {unit}
      </span>
    </div>
  </div>
);

const NumberField = ({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step,
  tooltip,
  unit = ""
}) => (
  <div className="form-group">
    <label title={tooltip}>{label}</label>
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(name, Number(e.target.value))}
    />
    {unit && <span className="unit-label">{unit}</span>}
  </div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  tooltip
}) => (
  <div className="form-group">
    <label title={tooltip}>{label}</label>
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const ConfigForm = ({
  config,
  onChange,
  onSimulate,
  predefinedConfigs,
  onLoadPredefined,
  isSimulating
}) => {
  return (
    <div className="config-panel">
      <div className="config-header">
        <h2>Configuration</h2>
        <p className="config-help">
          Use the sliders to explore how architecture parameters change hit
          rate, latency, power, and efficiency.
        </p>
      </div>

      <div className="predefined">
        <label>Pre-defined examples</label>
        <div className="predefined-buttons">
          {predefinedConfigs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onLoadPredefined(c.config)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="config-grid">
        {/* Cache */}
        <SliderField
          label="Cache size"
          name="cache_size_kb"
          value={config.cache_size_kb}
          onChange={onChange}
          min={8}
          max={1024}
          step={4}
          unit="KB"
          tooltip="L1 cache size; higher → higher hit rate but more latency & power"
        />
        <SliderField
          label="Block size"
          name="cache_block_size_b"
          value={config.cache_block_size_b}
          onChange={onChange}
          min={16}
          max={256}
          step={16}
          unit="B"
          tooltip="Cache line size; larger → better spatial locality but higher miss penalty"
        />
        <SliderField
          label="Associativity"
          name="cache_associativity"
          value={config.cache_associativity}
          onChange={onChange}
          min={1}
          max={16}
          step={1}
          unit="-way"
          tooltip="Higher associativity reduces conflict misses, but increases hit time"
        />

        {/* Memory */}
        <SliderField
          label="Memory size"
          name="mem_size_gb"
          value={config.mem_size_gb}
          onChange={onChange}
          min={1}
          max={128}
          step={1}
          unit="GB"
          tooltip="Total DRAM size; more reduces paging"
        />
        <SliderField
          label="Memory bandwidth"
          name="mem_bandwidth_gbs"
          value={config.mem_bandwidth_gbs}
          onChange={onChange}
          min={5}
          max={200}
          step={5}
          unit="GB/s"
          tooltip="Higher bandwidth reduces effective memory latency"
        />
        <SliderField
          label="Base memory latency"
          name="mem_latency_ns"
          value={config.mem_latency_ns}
          onChange={onChange}
          min={30}
          max={200}
          step={5}
          unit="ns"
          tooltip="DRAM base access latency"
        />

        {/* Registers */}
        <SliderField
          label="Register count"
          name="reg_count"
          value={config.reg_count}
          onChange={onChange}
          min={8}
          max={256}
          step={8}
          unit=""
          tooltip="More registers → fewer spills → higher IPC"
        />
        <SliderField
          label="Register width"
          name="reg_width_bits"
          value={config.reg_width_bits}
          onChange={onChange}
          min={8}
          max={512}
          step={8}
          unit="bits"
          tooltip="Wider registers & ALUs cost more power"
        />

        {/* Bus */}
        <SliderField
          label="Bus width"
          name="bus_width_bits"
          value={config.bus_width_bits}
          onChange={onChange}
          min={8}
          max={512}
          step={8}
          unit="bits"
          tooltip="More bits per transfer; higher throughput & power"
        />
        <SliderField
          label="Bus frequency"
          name="bus_freq_ghz"
          value={config.bus_freq_ghz}
          onChange={onChange}
          min={0.5}
          max={5}
          step={0.1}
          unit="GHz"
          tooltip="Faster bus → higher bandwidth & power"
        />

        {/* Core */}
        <SliderField
          label="CPU clock"
          name="clock_freq_ghz"
          value={config.clock_freq_ghz}
          onChange={onChange}
          min={0.5}
          max={6}
          step={0.1}
          unit="GHz"
          tooltip="Higher clock → higher performance & power"
        />
        <SliderField
          label="Pipeline depth"
          name="pipeline_depth"
          value={config.pipeline_depth}
          onChange={onChange}
          min={5}
          max={40}
          step={1}
          unit="stages"
          tooltip="Deeper pipelines → higher clock, higher mispredict penalty"
        />
        <SliderField
          label="Issue width"
          name="issue_width"
          value={config.issue_width}
          onChange={onChange}
          min={1}
          max={8}
          step={1}
          unit="inst/cyc"
          tooltip="More instructions per cycle → more performance & power"
        />
        <SliderField
          label="ALU width"
          name="alu_width_bits"
          value={config.alu_width_bits}
          onChange={onChange}
          min={8}
          max={512}
          step={8}
          unit="bits"
          tooltip="Wider ALU → handle bigger ints per op, higher power"
        />

        {/* Branch predictor */}
        <SelectField
          label="Branch predictor"
          name="branch_predictor"
          value={config.branch_predictor}
          onChange={onChange}
          tooltip="Better predictors reduce branch mispredict stalls"
          options={[
            { value: "static", label: "Static" },
            { value: "bimodal", label: "Bimodal (2-bit)" },
            { value: "tournament", label: "Tournament" }
          ]}
        />
      </div>

      <div className="config-actions">
        <button
          className="simulate-btn"
          type="button"
          onClick={onSimulate}
          disabled={isSimulating}
        >
          {isSimulating ? "Simulating..." : "Run Simulation"}
        </button>
      </div>
    </div>
  );
};

export default ConfigForm;
