---

---

## **🔹 Product Definition**

We are building a professional-grade policy simulation platform.

This is NOT a dashboard.

This is a guided decision-support system that helps users:  
1\. Define economic policies  
2\. Simulate macroeconomic impact  
3\. Understand distributional consequences  
4\. See individual-level effects  
5\. Understand causal relationships  
6\. Improve policies through optimization  
7\. Compare multiple scenarios

The UI must follow a storytelling flow:  
Policy → Macro → Distribution → Personas → Causality → Optimization → Compare

Each screen answers ONE question and leads to the next.

The system must feel analytical, structured, and trustworthy.  
No flashy UI, no gimmicks. 

NOTE : THE IMAGES FOLDER CONTAINS SNAPSHOTS OF ALL THE PAGES AND THEIR UI. REFER TO THAT.

---

# **⚙️ SYSTEM FLOW (CRITICAL — THIS DRIVES EVERYTHING)**

1\. Policy Studio (Define policies)  
2\. Run Simulation  
3\. Macro Impact (What happened to the economy?)  
4\. Distribution Impact (Who gained/lost?)  
5\. Persona Experience (How individuals are affected)  
6\. Causal Explorer (Why did this happen?)  
7\. Policy Lab (How to improve it?)  
8\. Scenario Comparison (Which is best?)

👉 Every page \= one step  
👉 No skipping, no mixing

---

# **🧱 ARCHITECTURE (STRICT)**

You said separate frontend/backend — good call.

---

## **📁 Root Structure**

/project-root  
  /frontend  
  /backend

---

## **📁 Frontend (React)**

/frontend  
  /src  
    /components  
      /ui  
      /policy  
      /macro  
      /distribution  
      /persona  
      /causal  
      /optimization  
      /comparison

    /pages  
      PolicyStudio.jsx  
      MacroImpact.jsx  
      DistributionImpact.jsx  
      PersonaExperience.jsx  
      CausalExplorer.jsx  
      PolicyLab.jsx  
      ScenarioComparison.jsx

    /layouts  
      MainLayout.jsx

    /store  
      useSimulationStore.js

    /services  
      simulationService.js

    /data  
      mockData.js

    /styles  
      globals.css

    App.jsx  
    main.jsx

---

## **📁 Backend (Python placeholder)**

/backend  
  /app  
    main.py  
    routes/  
    models/  
    services/

👉 Keep it minimal for now  
👉 Just structure, no heavy logic yet

---

# **⚛️ FRONTEND TECH STACK**

Tell it explicitly:

Use:  
\- React (Vite)  
\- TailwindCSS  
\- Zustand (state management)  
\- Recharts (or similar for charts)  
\- No heavy UI libraries unless necessary

---

# **🧠 STATE MANAGEMENT (IMPORTANT)**

You need ONE central store:

---

## **🔹 Simulation Store**

simulationState:  
\- policies (array)  
\- results:  
    \- macro  
    \- distribution  
    \- personas  
    \- causal  
\- optimizedPolicy  
\- scenarios (array)  
\- currentStep

---

👉 This avoids prop drilling hell

---

# **🧩 CORE COMPONENT SYSTEM**

Tell it to generate these FIRST:

---

## **🔹 UI Components**

\- Card  
\- SectionContainer  
\- StepperNavigation  
\- Button (minimal)  
\- Toggle

---

## **🔹 Domain Components**

\- PolicyBlockCard  
\- MetricCard  
\- DistributionCard  
\- PersonaCard  
\- CausalGraphContainer  
\- ComparisonTable  
\- InsightHeader (IMPORTANT)

---

# **🔥 SPECIAL COMPONENT (THIS IS YOUR EDGE)**

## **🔹 InsightHeader**

Every page MUST have this:

Props:  
\- title  
\- description

Example:  
"Economic output increases moderately, driven by manufacturing gains."

👉 This is what makes your product feel smart

---

# **📄 PAGE-BY-PAGE IMPLEMENTATION**

Now we get surgical.

---

## **🧩 1\. Policy Studio**

Goal: Define policies

Components:  
\- PolicyBlockCard  
\- SummaryPanel

Features:  
\- Add/remove policies  
\- Structured inputs (NO sliders)  
\- Show affected sectors

Output:  
updates simulationState.policies

---

## **⚙️ 2\. Macro Impact**

Goal: Show economy-level outcome

Components:  
\- InsightHeader  
\- MetricCard (GDP)  
\- SectorCards

Rules:  
\- GDP is dominant  
\- others secondary

---

## **💸 3\. Distribution**

Goal: Show inequality impact

Components:  
\- InsightHeader  
\- DistributionCard (3 types)

Features:  
\- Nominal vs Real toggle

---

## **👤 4\. Persona**

Goal: Show individual effects

Components:  
\- InsightHeader  
\- PersonaCard list

Features:  
\- Expandable cards  
\- Sorting (most affected)

---

## **🔗 5\. Causal Explorer**

Goal: Explain cause-effect

Components:  
\- CausalGraphContainer  
\- SidePanel

Features:  
\- Highlight paths  
\- Node explanations

---

## **⚔️ 6\. Policy Lab**

Goal: Improve policy

Components:  
\- Policy comparison cards

Layout:  
\- Current vs Suggested

---

## **📊 7\. Scenario Comparison**

Goal: Compare results

Components:  
\- ComparisonTable  
\- Chart

Focus:  
\- trade-offs

---

# **🔗 NAVIGATION SYSTEM**

Use a top stepper navigation:

Policy → Macro → Distribution → Personas → Causality → Policy Lab → Compare

\- Highlight current step  
\- Allow forward/back navigation

---

# **🎨 DESIGN RULES (ENFORCE HARD)**

\- No gradients  
\- No neon colors  
\- No heavy shadows  
\- Clean spacing  
\- One primary focus per screen  
\- Secondary info subdued

---

# **🔄 DATA FLOW (SUPER IMPORTANT)**

User defines policy  
→ stored in Zustand  
→ simulate (mock for now)  
→ populate results  
→ all pages read from same state

---

# **🧪 MOCK DATA (FOR NOW)**

Tell it:

Use mock data for:  
\- GDP  
\- sector outputs  
\- income distribution  
\- persona results

---

# **🧠 FINAL INSTRUCTION (VERY IMPORTANT)**

Paste this at the end:

Do NOT generate everything at once.

First:  
1\. Setup project structure  
2\. Create design system  
3\. Create core components

Then wait for next instructions before building pages.

---

