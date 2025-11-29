# CPU Architecture Simulator

A lightweight, interactive CPU simulation web app designed to help **students**, **educators**, and **tech enthusiasts** understand how hardware design choices influence performance, power, and efficiency.  
The goal is to make complex CPU architecture concepts **visual**, **intuitive**, and **fun to explore**.

## 🎯 Target Audience
- **Computer architecture students** learning cache, pipeline, and branch prediction basics  
- **Educators** who need a visual tool for lectures and labs  
- **Developers & hobbyists** curious about how real CPUs behave internally  
- **Anyone** who wants a simplified yet meaningful view of CPU performance trade-offs

## 🧠 What It Does
Users can customize CPU components such as:
- Cache levels (L1, L2, L3), size, associativity, replacement policy  
- Core settings: pipeline depth, issue width, ALU width  
- Branch predictor (Off, Static, Bimodal, Tournament)  
- Memory bandwidth & latency  
- Bus configuration  
- Power consumption parameters  
- Number of instructions  

Then, the simulator computes:
- IPC (effective + before stalls)  
- Performance & efficiency  
- Multi-level cache hit rates  
- AMAT & latency  
- Branch mispredict stalls  
- Execution time  
- Power & energy analysis  

## 🎨 UI Highlights
- Elegant, theme-adaptive (light/dark) modern interface  
- Animated CPU dataflow visualization (CPU ↔ Bus ↔ Memory)  
- Clear result panels with KPIs, charts, and analysis tables  

## 🛠️ Tech Stack
- **Frontend:** React.js + Chart.js  
- **Backend:** Python (Flask)  
- **Data:** Analytical performance model + configurable CPU parameters  

## 🤝 Purpose
This project aims to bridge the gap between **theory** and **intuition**, letting users *experiment with processor design* and instantly see how changes affect real performance metrics.

Perfect for coursework, demos, self-learning, or hardware design curiosity.  
Feel free to customize and extend it!
