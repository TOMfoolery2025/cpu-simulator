import React from "react";

const DocsPage = () => (
  <section className="page">
    <h1>Documentation</h1>
    <h2>Overview</h2>
    <p>
      This simulator uses simple rule-of-thumb models to estimate how
      architecture parameters affect:
      <ul>
        <li>Cache hit/miss rates</li>
        <li>Average memory access time (AMAT)</li>
        <li>IPC (instructions per cycle)</li>
        <li>Performance, power, and efficiency indices</li>
      </ul>
    </p>
    <h2>Key Intuitions</h2>
    <ul>
      <li>Bigger caches → higher hit rate, but higher power and hit latency.</li>
      <li>Higher associativity → fewer conflict misses, but slower access.</li>
      <li>Higher memory bandwidth → lower effective latency but higher power.</li>
      <li>More registers → fewer spills, higher IPC.</li>
      <li>Wider bus → more throughput, higher power.</li>
      <li>Higher clock → higher performance and power.</li>
      <li>Better branch predictors → fewer pipeline flushes.</li>
    </ul>
    <p>
      All metrics are <strong>normalized</strong> and intended for learning, not
      hardware design.
    </p>
  </section>
);

export default DocsPage;
