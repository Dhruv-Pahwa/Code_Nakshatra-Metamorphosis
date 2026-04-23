I'll update the audit TODO list to track this comprehensive comparison.

Starting: *Compare goal.md to repo (full audit)* (1/6)

Progress: I compared the goal.md master workflow to the codebase and produced a complete missing-items list and prioritized fixes below. Next I can implement the top-priority patch (backend response parity + wire runSimulation -> API) if you want — say “fix backend+run” to start. 

**Audit — Master Workflow vs Repo**

- **Master flow (goal.md)**: 1) Policy → 2) Run Simulation → 3) Macro → 4) Distribution → 5) Personas → 6) Causal Explanation → 7) Policy Interaction / Improve (Optimization) → 8) Scenario Comparison.

- **Repo mapping**: core pages/components exist for almost every visual step, but the data/engine, analytics, interaction, and optimization plumbing are mostly mocked or missing.

**Step-by-step mapping (what exists, what’s missing, where)**

- **1) Policy Definition Layer**
  - Exists:
    - Page/UI: PolicyStudio.jsx
    - Policy block UI: PolicyBlockCard.jsx
    - State: `policies` + add/remove/update: useSimulationStore.js
    - Mock data: `mockPolicies`: mockData.js
  - Missing / Partial:
    - Rich policy-type registry (tax, subsidy, transfer types, metadata) — no central policy schema or typed inputs.
    - Policy composition UX (drag/drop, templating, presets) — only "APPEND MODULE" adds a blank module.
    - Client-side validation & constraints for parameters (no type/units enforcement).
    - Scenario naming/saving UI (store.saveScenario exists: useSimulationStore.js but limited UI to manage saved scenarios, no picker/restore).
    - Undo/versions/diff for policy edits — missing.

- **2) Simulation Engine (CGE Core)**
  - Exists (stub):
    - API route: simulation.py
    - Mock engine: mock_engine.py
    - Frontend service that calls backend with fallback to frontend mock: simulationService.js
  - Missing / Critical:
    - Real CGE solver / equilibrium solver (GAMS, GEMPACK, Python solver, or external service).
    - Long-running job handling, async job queue, progress updates or streaming results.
    - Backend currently returns a very small subset (only `analysisSummary` + `macro` + status/policies_received) — not the full shape frontend expects.
      - Backend mock: mock_engine.py
      - Frontend expects full payload: `analysisSummary`, `macro`, `distribution`, `personas`, `causal`, `policyLab`, `scenarios` — see fallback in simulationService.js and store defaults in useSimulationStore.js
    - No server-side validation, no reproducibility controls (seeds), no compute scaling.

- **3) Macro Impact Layer**
  - Exists (UI): MacroImpact.jsx
  - Missing / Partial:
    - Macro computation is mocked; no linkage from policies → macro outcomes (front-end shows `macro` from mockData).
    - Analytics like confidence intervals, sector decomposition exist in UI but are static/placeholder charts.
    - No time-series charts for trajectory preview (placeholders like "FORECAST MODEL").

- **4) Distribution Engine**
  - Exists (UI): DistributionImpact.jsx and DistributionCard.jsx
  - Missing:
    - Actual mapping from macro results → income deciles (consumption baskets, price pass-through, real income calc).
    - Prospectively important features: basket-based inflation pass-through, behavioral responses — none implemented.
    - No detailed calibration/parameters for distribution engine.

- **5) Persona Layer**
  - Exists (UI): PersonaExperience.jsx and `PersonaCard`: PersonaCard.jsx
  - Missing:
    - Mapping pipeline: distribution → personas (the mapping is mocked in `mockData`).
    - AI explanations or narrative text generator (goal.md recommends AI explanation).
    - Persona scenario toggles (e.g., alternate baskets, sensitivity sliders).

- **6) Causal Explanation Layer**
  - Exists (UI & graph): CausalExplorer.jsx, graph component: CausalGraphContainer.jsx
  - Missing / Partial:
    - The graph renders nodes/edges and shows a diagnostic summary, but there is no:
      - Propagation tracing (step-through causal propagation for a policy shock).
      - Counterfactual or marginal contribution computation from nodes/edges.
      - Automated explanation linking macro → distribution → persona paths.
    - Causal diagnostics are static in `mockData` rather than computed.

- **7) Policy Interaction Layer (multi-policy effects)**
  - Exists (UI support for multiple modules): `policies` array can hold multiple entries.
  - Missing:
    - Interaction detection (synergy/conflict detection) is not implemented.
    - Bottleneck detection, marginal effect decomposition when multiple policies interact — missing.

- **8) Optimization Layer (scoring & suggestions)**
  - Missing entirely:
    - No scoring engine, no automatic parameter tuning, no policy-suggestion generator.
    - No local optimizer or genetic/search loop, nor integration point to attach one.

- **9) Scenario Comparison Layer**
  - Exists (UI): ScenarioComparison.jsx and `ComparisonTable` component imported at ScenarioComparison.jsx
  - Partial:
    - Saving a scenario: `saveScenario` in store exists: useSimulationStore.js
    - UI-level compare is present, but there is no robust multi-scenario picker/diff UI or historical scenario list (store has `savedScenarios` but no management UI).
    - Commit flow uses `alert()` (placeholder) instead of persistent feedback or server-side save.

**Cross-cutting technical gaps & risks**

- **Backend ↔ Frontend data-shape mismatch** (critical)
  - Frontend expects a rich payload; backend mock route returns only a minimal subset.
    - Frontend service: simulationService.js
    - Backend mock: mock_engine.py
  - Risk: If the backend returns partial data the app components will see undefined keys and may break.

- **Run-integration missing**
  - `simulationService.simulate()` exists, but `useSimulationStore.runSimulation()` **does not call** it — it uses local mock data and a timeout. See comment in store: useSimulationStore.js
  - Fix needed: wire `runSimulation()` to call `simulationService.simulate(get().policies)` and update `results` on success/failure (with fallback).

- **Progress & streaming**
  - Long-running simulations need progress events; there is no job ID, polling or SSE in place.

- **Defensive checks**
  - Many components assume `results.*` exists (store preloads mock data so safe in dev), but with real backend responses missing keys components will break. Add guards or validation.

- **UI storytelling / layered reveal**
  - The app surface has many panels (some placeholders). There’s no guided “narrative mode” that reveals macro → distribution → persona → causal stepwise as goal.md recommends.

- **UX placeholders & charts**
  - Several visualizations are placeholders (e.g., Real-time curve preview, Yield surface projection). Those charts must be implemented and fed real data.

- **Sanitization**
  - PersonaExperience.jsx uses `dangerouslySetInnerHTML` to highlight text — unsafe if sources are untrusted: PersonaExperience.jsx

- **Tests & CI**
  - No tests found; add unit tests for store and critical helpers.

- **Docs**
  - goal.md is present (good). Add a small README or design doc that maps data contract for `/simulate` (required).

**Every missing component/feature (exhaustive checklist)**

- Backend
  - Full CGE engine (or integration to remote solver)
  - Simulation job API improvements:
    - Accept policy object schema
    - Validate inputs
    - Return canonical full payload: `analysisSummary, macro, distribution, personas, causal, policyLab, scenarios`
    - Job queue / job id / status endpoint
    - Streaming/progress (SSE / WebSocket)
  - Endpoint to list saved scenarios and restore them
  - Endpoint for optimization/suggestions (future)
  - More comprehensive mock that matches frontend shape (short-term)

- Frontend — core features to implement
  - Wire `runSimulation()` to call `simulationService.simulate()` and handle server response & errors
    - File: useSimulationStore.js
    - Service: simulationService.js
  - Response validation + graceful fallback if keys missing
  - Implement progress UI / busy state across pages
  - Replace blocking `alert()` with toast/modal in ScenarioComparison.jsx (ScenarioComparison.jsx)
  - Replace `dangerouslySetInnerHTML` with safe renderer or sanitized HTML in PersonaExperience.jsx (PersonaExperience.jsx)
  - Implement actual charts & time-series visualizations where placeholders exist
  - Implement policy registry / typed policy forms (tax, subsidy, transfer)
  - Add policy presets, scenario naming, scenario management UI for `savedScenarios`
  - Implement policy-interaction analytics (marginal decomposition, synergy/conflict detection)
  - Implement optimization engine UI & backend hook (suggestions & local tuning)
  - Add multi-scenario comparison picker (choose which saved scenarios to compare)
  - Add route ↔ store sync on initial load (ensure stepper reflects current URL)
    - File: MainLayout.jsx
  - Add defensive rendering guards across pages to avoid crashes if fields missing

- Data / modeling
  - Distribution engine: implement macro→decile mapping, basket inflation, behavioral response models
  - Persona generator: mapping rules or small AI pipeline for explaining persona outcomes
  - Causal propagation: ability to simulate propagation and quantify node/edge contributions

- Product experience / storytelling
  - Guided narrative mode (layered reveal)
  - Stepwise CTA & microcopy improvements (to guide user through the loop in goal.md)
  - Inline explanations & “Why this matters” overlays on each major metric
  - Lightweight tutorial / tour for judge/demo mode

- Operational / engineering
  - Add tests for store + critical components
  - Add build/test scripts & CI
  - Add health & metrics integration for the compute engine

**Prioritized fixes (P0/P1/P2) with rough estimates**

- P0 (blockers — do these first)
  1. Backend response parity: return the full canonical payload from `/simulate` (or have service validate and fallback). Estimate: 1–3h for a mock parity fix; 1–3 days to wire real model.
     - Files: mock_engine.py, simulationService.js
  2. Wire `runSimulation()` to call backend and update store + add response validation & error handling. Estimate: 1–4h.
     - Files: useSimulationStore.js
  3. Add defensive guards to prevent crashes when response keys missing. Estimate: 1–2h.

- P1 (high-value UX & narrative)
  4. Implement progress/job-status handling and non-blocking toasts instead of `alert()`. Estimate: 3–8h.
  5. Replace `dangerouslySetInnerHTML` with a safe renderer or sanitized markup. Estimate: 30–90m.
  6. Implement scenario management UI (list, restore, compare). Estimate: 1–2 days.

- P2 (analytics & modeling)
  7. Implement policy-interaction detection and marginal decomposition. Estimate: 2–5 days (modeling + UI).
  8. Basic optimizer/suggestion engine (heuristic) + UI. Estimate: 4–10 days depending on scope.
  9. Full CGE integration (real solver) — depends heavily on model choice: Estimate: weeks to months.

**Concrete quick wins I can implement now (choose one)**
- A: Quick backend parity patch — expand `mock_engine.get_mock_results()` to return the full `mockData` shape so frontend sees complete payload. (30–90 minutes)
- B: Wire `runSimulation()` in store to call `simulationService.simulate()` and fallback to mock on failure; add basic response validation. (1–3 hours)
- C: Replace `alert()` with a toast and sanitize `dangerouslySetInnerHTML`. (1–2 hours)

Which quick win should I do first? If you want me to proceed I can:

- implement A+B together (recommended) — get backend mock parity and wire frontend to call backend (I can make a patch and run or test). Say “fix backend+run” and I’ll implement the small PR for those two changes.