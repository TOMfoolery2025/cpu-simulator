// frontend/src/components/CPUVisualization.jsx
import React from "react";

const CPUVisualization = ({ results }) => {
  // Use performance/AMAT to modulate animation speed a bit
  const perf = results?.performance_index ?? 1;
  const amat = results?.amat_ns ?? 80;

  // Faster perf → shorter duration; clamp for sanity
  const perfSpeed = Math.max(0.6, 2.5 - perf * 0.4);
  const memSpeed = Math.max(1.0, Math.min(4.0, amat / 40.0));

  return (
    <div className="cpu-viz-card">
      <h2 className="cpu-viz-title">CPU Dataflow Visualization</h2>
      <p className="cpu-viz-subtitle">
        Watch bytes flow from Memory → Bus → Cache → Registers → ALU
      </p>

      <div className="cpu-viz">
        {/* Memory block */}
        <div className="cpu-block memory-block" title="Main Memory">
          <div className="cpu-block-title">Memory</div>
          <div className="cpu-block-label">DRAM</div>
        </div>

        {/* Bus */}
        <div className="cpu-block bus-block" title="System Bus">
          <div className="cpu-block-title">Bus</div>
          <div className="cpu-block-label">Data &amp; Addr</div>
        </div>

        {/* Cache */}
        <div className="cpu-block cache-block" title="Cache">
          <div className="cpu-block-title">Cache</div>
          <div className="cpu-block-label">L1 / L2</div>
        </div>

        {/* Registers */}
        <div className="cpu-block regs-block" title="Registers">
          <div className="cpu-block-title">Registers</div>
          <div className="cpu-block-label">Architected &amp; Physical</div>
        </div>

        {/* ALU */}
        <div className="cpu-block alu-block" title="ALU">
          <div className="cpu-block-title">ALU</div>
          <div className="cpu-block-label">Execution Units</div>
        </div>

        {/* Flow dots: memory -> bus -> cache -> regs -> ALU */}
        <div
          className="flow-dot dot-mem-bus"
          style={{ animationDuration: `${memSpeed}s` }}
        />
        <div
          className="flow-dot dot-bus-cache"
          style={{ animationDuration: `${memSpeed * 0.9}s` }}
        />
        <div
          className="flow-dot dot-cache-regs"
          style={{ animationDuration: `${perfSpeed}s` }}
        />
        <div
          className="flow-dot dot-regs-alu"
          style={{ animationDuration: `${perfSpeed * 0.8}s` }}
        />

        {/* Return path (writeback) dots */}
        <div
          className="flow-dot dot-alu-regs"
          style={{ animationDuration: `${perfSpeed * 1.2}s` }}
        />
      </div>

      <div className="cpu-viz-legend">
        <span className="legend-dot" /> Bytes flowing through the pipeline
      </div>
    </div>
  );
};

export default CPUVisualization;
