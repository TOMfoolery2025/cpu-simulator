import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => (
  <section className="page">
    <h1>CPU Architecture Simulator</h1>
    <p>
      Explore how cache, memory, registers, bus, and CPU core parameters
      impact hit/miss rates, latency, power consumption, and efficiency.
    </p>
    <p>
      Use the <strong>Simulator</strong> page to tweak parameters, visualize
      results, and compare different designs.
    </p>
    <Link className="primary-btn" to="/simulator">
      Go to Simulator
    </Link>
  </section>
);

export default HomePage;
