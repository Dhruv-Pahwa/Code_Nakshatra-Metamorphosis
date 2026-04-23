# CGE Policy Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://cge-bitplease.vercel.app/)

Welcome to the **CGE Policy Platform**, a powerful, interactive web application for simulating and visualizing Computable General Equilibrium (CGE) models. This platform transforms dense economic data into a comprehensible, guided narrative that helps policymakers and analysts understand the full-economy impact of various policy interventions.

🔗 **Live Demo:** [https://cge-bitplease.vercel.app/](https://cge-bitplease.vercel.app/)

## 📖 Overview

A CGE model solves for a full economy in equilibrium. When you shock it with a policy, it produces interconnected prices, quantities, incomes, welfare measures, government accounts, and trade outcomes. The CGE Policy Platform takes this rich output and presents it across an intuitive narrative arc:

1. **Policy Studio:** "Here is what I'm doing to the economy"
2. **Macro Impact:** "Here is what happened to the WHOLE economy"
3. **Distribution:** "Here is WHO won and WHO lost"
4. **Personas:** "Here is what it FEELS LIKE for real people"
5. **Causal Explorer:** "Here is WHY these outcomes occurred"
6. **Policy Lab:** "Here is how we can do BETTER"
7. **Comparison:** "Here is the DECISION"

## ✨ Key Features

- **Policy Simulation Engine:** Configure complex economic shocks (taxes, subsidies, labor/capital shifts) and see the ripple effects across the entire economy.
- **Macro & Distributional Impact:** Visualize real GDP change, CPI, Equivalent Variation (EV), Gini coefficients, and sectoral shifts through intuitive dashboards.
- **Persona Engine:** Humanize the data with a database of 1,080 distinct personas (e.g., agricultural workers, tech professionals) showing the hyper-local impact of policies.
- **LLM-Powered Persona Chat:** Ask personas direct questions about how policies affect them, grounded entirely in real CGE outputs via integration with Groq API.
- **Causal DAG Explorer:** Understand the exact transmission mechanisms behind economic shifts with interactive directed acyclic graphs.
- **Scenario Comparison:** Make data-driven decisions by comparing multiple policy scenarios side-by-side using Pareto frontiers and tradeoff matrices.

## 🛠️ Technology Stack

**Frontend:**
- React 19
- Vite
- TailwindCSS
- Zustand (State Management)
- Recharts (Data Visualization)
- React Flow / React Force Graph (Causal DAGs)
- React Leaflet (Geospatial Mapping)

**Backend:**
- Python 3.10+
- FastAPI
- Pandas & NumPy (Economic computations)
- Groq API (LLM for Persona Chat)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Create a `.env` file in the backend directory and add your Groq API key:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

## 🤝 Contributing

Contributions are welcome! Please follow the existing project structure and design systems when making updates.
