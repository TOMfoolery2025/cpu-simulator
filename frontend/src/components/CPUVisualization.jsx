// frontend/src/components/CPUVisualization.jsx
import React, { useEffect, useRef, useState } from "react";

const INFLOW_DOTS = 10;
const OUTFLOW_DOTS = 10;

const CPUVisualization = ({ results }) => {
  // Use performance/AMAT to modulate animation speed a bit (higher perf → faster animation)
  const perf = results?.performance_index ?? 1;
  const amat = results?.amat_ns ?? 80;

  // Map to simple speed factors (used as multipliers in the animation)
  const inflowSpeed = Math.max(
    0.12,
    Math.min(0.35, 0.20 / Math.max(1.0, amat / 40.0))
  );
  const outflowSpeed = Math.max(
    0.12,
    Math.min(0.45, 0.35 / Math.max(0.6, 2.5 - perf * 0.4))
  );

  // Multiple dots for smoother flow
  const inflowDotsRef = useRef([]);
  const outflowDotsRef = useRef([]);

  const [hoverInfo, setHoverInfo] = useState(null);

  // Layout helpers (SVG viewBox is 0..100 x 0..40)
  const inflowPath = [
    { x: 64, y: 12 }, // main memory
    { x: 47.8, y: 12 }, // bus (right side)
    { x: 47.8, y: 23 }, // CPU container entry
    { x: 34, y: 23 },
  ];

  const outflowPath = [
    { x: 34, y: 26 }, // CPU container exit
    { x: 52.2, y: 26 }, // bus (left/lower)
    { x: 52.2, y: 15 }, // back into main memory
    { x: 64, y: 15 },
  ];

  const interpolateOnSegments = (segments, t) => {
    const n = segments.length - 1;
    const scaled = t * n;
    const idx = Math.floor(scaled);
    const localT = scaled - idx;

    const a = segments[idx];
    const b = segments[Math.min(idx + 1, segments.length - 1)];

    return {
      x: a.x + (b.x - a.x) * localT,
      y: a.y + (b.y - a.y) * localT,
    };
  };

  // Animation loop for inflow (blue) and outflow (red) dots
  useEffect(() => {
    let frameId;
    const start = performance.now();

    const animate = (time) => {
      const elapsed = (time - start) / 1000; // seconds

      // Smooth looping base values in [0,1]
      const inflowBase = (elapsed * inflowSpeed) % 1;
      const outflowBase = ((elapsed * outflowSpeed) + 0.5) % 1; // phase-shifted

      // Inflow dots: Memory -> Bus -> CPU
      inflowDotsRef.current.forEach((dot, index) => {
        if (!dot) return;
        const t = (inflowBase + index / INFLOW_DOTS) % 1;
        const { x, y } = interpolateOnSegments(inflowPath, t);
        dot.setAttribute("cx", x.toString());
        dot.setAttribute("cy", y.toString());
      });

      // Outflow dots: CPU -> Bus -> Memory
      outflowDotsRef.current.forEach((dot, index) => {
        if (!dot) return;
        const t = (outflowBase + index / OUTFLOW_DOTS) % 1;
        const { x, y } = interpolateOnSegments(outflowPath, t);
        dot.setAttribute("cx", x.toString());
        dot.setAttribute("cy", y.toString());
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [inflowSpeed, outflowSpeed]);

  const showHover = (label, description, x, y) => {
    // x,y are in viewBox coordinates; tooltip is positioned relative to the SVG
    setHoverInfo({
      label,
      description,
      x,
      y,
    });
  };

  const hideHover = () => setHoverInfo(null);

  return (
    <div className="cpu-viz-card">
      <h2 className="cpu-viz-title">Computer Architecture</h2>
      <p className="cpu-viz-subtitle">
        Visualizing: <strong>Memory → Bus → CPU</strong>
      </p>

      <div
        className="cpu-flow-container"
        style={{
          width: "100%",
          minHeight: 260,
          position: "relative",
        }}
      >
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
        >
          {/* Background to keep layout airy */}
          <rect x="0" y="0" width="100" height="40" fill="transparent" />

          {/* === CPU GROUP (LEFT, ~30%) === */}
          <g
            onMouseEnter={() =>
              showHover(
                "CPU",
                "Central Processing Unit containing ALU, Registers, Control Unit, and Cache.",
                20,
                6
              )
            }
            onMouseLeave={hideHover}
          >
            {/* CPU outer container */}
            <rect
              x="5"
              y="5"
              width="30"
              height="30"
              rx="3"
              ry="3"
              fill="rgba(37, 99, 235, 0.06)"
              stroke="rgba(148, 163, 184, 0.9)"
              strokeWidth="0.5"
            />
            <text
              x="7"
              y="9"
              fontSize="2.5"
              fontWeight="600"
              className="cpu-viz-text-main"
            >
              CPU
            </text>

            {/* ALU */}
            <g
              onMouseEnter={() =>
                showHover(
                  "ALU (Arithmetic Logic Unit)",
                  "Performs arithmetic and logical operations on data.",
                  12,
                  13
                )
              }
              onMouseLeave={hideHover}
            >
              <rect
                x="7"
                y="11"
                width="12"
                height="7"
                rx="1"
                ry="1"
                fill="rgba(37, 99, 235, 0.08)"
                stroke="rgba(148, 163, 184, 0.9)"
                strokeWidth="0.4"
              />
              <text
                x="8"
                y="15"
                fontSize="2"
                className="cpu-viz-text-main"
              >
                ALU
              </text>
            </g>

            {/* Registers */}
            <g
              onMouseEnter={() =>
                showHover(
                  "Registers",
                  "Small, fast storage locations directly inside the CPU.",
                  12,
                  24
                )
              }
              onMouseLeave={hideHover}
            >
              <rect
                x="7"
                y="21"
                width="12"
                height="7"
                rx="1"
                ry="1"
                fill="rgba(37, 99, 235, 0.08)"
                stroke="rgba(148, 163, 184, 0.9)"
                strokeWidth="0.4"
              />
              <text
                x="8"
                y="25"
                fontSize="2"
                className="cpu-viz-text-main"
              >
                Registers
              </text>
            </g>

            {/* Control Unit */}
            <g
              onMouseEnter={() =>
                showHover(
                  "Control Unit",
                  "Directs CPU operations and orchestrates data flow between components.",
                  26,
                  13
                )
              }
              onMouseLeave={hideHover}
            >
              <rect
                x="21"
                y="11"
                width="12"
                height="7"
                rx="1"
                ry="1"
                fill="rgba(37, 99, 235, 0.08)"
                stroke="rgba(148, 163, 184, 0.9)"
                strokeWidth="0.4"
              />
              <text
                x="22"
                y="15"
                fontSize="2"
                className="cpu-viz-text-main"
              >
                Control
              </text>
              <text
                x="22"
                y="17"
                fontSize="2"
                className="cpu-viz-text-main"
              >
                Unit
              </text>
            </g>

            {/* Cache */}
            <g
              onMouseEnter={() =>
                showHover(
                  "Cache",
                  "Small, fast memory storing frequently accessed data close to the CPU.",
                  26,
                  24
                )
              }
              onMouseLeave={hideHover}
            >
              <rect
                x="21"
                y="21"
                width="12"
                height="7"
                rx="1"
                ry="1"
                fill="rgba(37, 99, 235, 0.08)"
                stroke="rgba(148, 163, 184, 0.9)"
                strokeWidth="0.4"
              />
              <text
                x="22"
                y="25"
                fontSize="2"
                className="cpu-viz-text-main"
              >
                Cache
              </text>
            </g>
          </g>

          {/* === BUS (MIDDLE, ~10%) === */}
          <g
            onMouseEnter={() =>
              showHover(
                "System Bus",
                "Parallel communication channel between CPU and memory.",
                50,
                6
              )
            }
            onMouseLeave={hideHover}
          >
            <text
              x="47"
              y="7"
              fontSize="2.3"
              fontWeight="600"
              className="cpu-viz-text-main"
            >
              Bus
            </text>

            {/* 4 vertical lines to resemble narrow bus channels */}
            {[47, 49, 51, 53].map((x, idx) => (
              <line
                key={idx}
                x1={x}
                y1="9"
                x2={x}
                y2="35"
                stroke="rgba(148, 163, 184, 0.95)"
                strokeWidth="0.6"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* === MEMORY (RIGHT, ~20%) === */}
          {/* Main memory */}
          <g
            onMouseEnter={() =>
              showHover(
                "Main Memory",
                "Primary system memory (RAM) storing active programs and data.",
                75,
                11
              )
            }
            onMouseLeave={hideHover}
          >
            <rect
              x="65"
              y="6"
              width="20"
              height="13"
              rx="1.5"
              ry="1.5"
              fill="rgba(37, 99, 235, 0.04)"
              stroke="rgba(148, 163, 184, 0.9)"
              strokeWidth="0.5"
            />
            <text
              x="67"
              y="11"
              fontSize="2.3"
              fontWeight="600"
              className="cpu-viz-text-main"
            >
              Memory
            </text>
            <text
              x="67"
              y="13.5"
              fontSize="1.8"
              className="cpu-viz-text-muted"
            >
              (RAM)
            </text>
          </g>

          {/* External memory below main memory */}
          <g
            onMouseEnter={() =>
              showHover(
                "External Storage",
                "Slower, larger storage such as SSDs, HDDs, or external devices.",
                75,
                27
              )
            }
            onMouseLeave={hideHover}
          >
            <rect
              x="65"
              y="22"
              width="20"
              height="13"
              rx="1.5"
              ry="1.5"
              fill="rgba(37, 99, 235, 0.04)"
              stroke="rgba(148, 163, 184, 0.9)"
              strokeWidth="0.5"
            />
            <text
              x="67"
              y="27"
              fontSize="2.3"
              fontWeight="600"
              className="cpu-viz-text-main"
            >
              External
            </text>
            <text
              x="67"
              y="29.5"
              fontSize="1.8"
              className="cpu-viz-text-muted"
            >
              Storage
            </text>
          </g>

          {/* === CONNECTION LINES (REMOVED: only dots remain) === */}
          {/* (blue/red polylines were here; they are now removed) */}

          {/* === FLOWING BYTES (dots only) === */}
          {/* Inflow: Memory -> Bus -> CPU (blue dots) */}
          {Array.from({ length: INFLOW_DOTS }).map((_, i) => (
            <circle
              key={`inflow-dot-${i}`}
              ref={(el) => {
                inflowDotsRef.current[i] = el;
              }}
              r="0.4"
              fill="#3925ebe0"
              stroke="#1d4ed8"
              strokeWidth="0.25"
            />
          ))}

          {/* Outflow: CPU -> Bus -> Memory (red dots) */}
          {Array.from({ length: OUTFLOW_DOTS }).map((_, i) => (
            <circle
              key={`outflow-dot-${i}`}
              ref={(el) => {
                outflowDotsRef.current[i] = el;
              }}
              r="0.4"
              fill="#ef4444dd"
              stroke="#b91c1c"
              strokeWidth="0.25"
            />
          ))}
        </svg>

        {/* Tooltip positioned relative to logical coordinates */}
        {hoverInfo && (
          <div
            className="cpu-flow-tooltip"
            style={{
              position: "absolute",
              left: `${(hoverInfo.x / 100) * 100}%`,
              top: `${(hoverInfo.y / 40) * 100}%`,
              transform: "translate(-50%, -110%)",
              background: "rgba(15, 23, 42, 0.97)",
              color: "#f9fafb",
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
              maxWidth: 220,
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.55)",
              pointerEvents: "none",
              zIndex: 10,
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 4,
                letterSpacing: 0.02,
              }}
            >
              {hoverInfo.label}
            </div>
            <div style={{ opacity: 0.95 }}>{hoverInfo.description}</div>
          </div>
        )}
      </div>

      <div className="cpu-viz-legend">
        <span className="legend-dot" />
        <span className="cpu-viz-legend-text">
          Follow the{" "}
          <span style={{ color: "#2563eb", fontWeight: 600 }}>blue</span> bytes
          from Memory → Bus → CPU and{" "}
          <span style={{ color: "#ef4444", fontWeight: 600 }}>red</span> bytes
          from CPU → Bus → Memory.
        </span>
      </div>
    </div>
  );
};

export default CPUVisualization;
