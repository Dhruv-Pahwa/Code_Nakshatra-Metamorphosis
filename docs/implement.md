**Reality Check (Vision vs Current)**
1. Vision in vision.md: policy-first, causal, auditable, LLM narrative-only, export-ready decision assistant.
2. Current state in whatwehave.md: polished insight shell with partial/weak provenance and weak practical actionability.
3. Important new fact: rules exist in carbon_tax_india_v1.json and carbon_plus_transfer_v1.json, but the main simulation pipeline is still primarily driven by static config and existing stage engines in pipeline.py, policy_ingestion.py, and macro_engine.py.

**What “Best Execution” Looks Like**
1. Do not redesign UI.
2. Refactor the data flow first, then attach UX hooks.
3. Ship in small vertical slices that each produce an end-to-end improvement.
4. Keep deterministic numbers in rules/engines; keep LLM strictly narrative.
5. Add explicit acceptance gates after each slice so demo quality increases continuously.

**Master Implementation Plan (Sequenced, no stone unturned)**

**Phase 0: Contract Lock (Day 0)**
1. Freeze the target response contract for all sections: analysisSummary, macro, distribution, personas, causal, policyLab, scenarios.
2. Define mandatory provenance fields at section and metric level.
3. Lock terminology for India-focused labels and policy names.
4. Done gate: One agreed response schema document and example payloads for the two existing rules.

**Phase 1: Policy Artifact as Source of Truth (Day 1)**
1. Extend policy ingestion so every run starts from a structured PolicyBlock artifact, not raw slider values.
2. Include id, name, version, shocks, metadata, assumptions, createdAt/runId in canonical state.
3. Add JSON export endpoint/flow from Policy Studio state.
4. Core touchpoints: policy_ingestion.py, PolicyStudio.jsx, PolicyBlockCard.jsx, useSimulationStore.js.
5. Done gate: User can run and export the exact policy artifact used in simulation.

**Phase 2: Rule Registry Integration (Day 1-2)**
1. Implement runtime rule loading/validation from the rules folder.
2. Add rule matcher that maps policy artifact to one or more applicable rules.
3. Standardize current rule schema with strict validation and defaults.
4. Persist rule lineage into output so every metric can point to rule origin.
5. Core touchpoints: carbon_tax_india_v1.json, carbon_plus_transfer_v1.json, rule_registry.py, pipeline.py.
6. Done gate: Simulation output names matched rule(s), with lineage IDs in every section.

**Phase 3: Deterministic Propagation Backbone (Day 2-3)**
1. Wire rule outputs through macro → distribution → personas → causal → policyLab → scenarios.
2. Remove any remaining frontend-generated core numbers.
3. Keep CGE solver path available as baseline reference, but ensure the rule-propagation path is coherent and auditable for demo mode.
4. Core touchpoints: pipeline.py, distribution_engine.py, persona_engine.py, causal_engine.py, policy_lab_engine.py, scenario_engine.py, response_assembler.py.
5. Done gate: One selected rule produces internally consistent end-to-end outputs with explicit causal continuity.

**Phase 4: Narrative Layer with Hard Guardrails (Day 3-4)**
1. Build narrative prompt utility with “numbers are frozen” contracts.
2. Add narrative generation for macro, distribution, persona, causal, policyLab.
3. Add fallback deterministic narratives when LLM unavailable.
4. Include source snippets in the output payload for auditability.
5. Core touchpoints: MacroImpact.jsx, DistributionImpact.jsx, PersonaExperience.jsx, CausalExplorer.jsx, PolicyLab.jsx, PersonaChat.jsx.
6. Done gate: No narrative can render unless it references provided computed values.

**Phase 5: Page-Level UX Hooks (Day 4-5)**
1. Policy Studio: metadata panel + artifact preview + export action.
2. Macro Impact: driver sentence under each KPI + top-contributor tooltip.
3. Distribution Impact: “Why this group?” panel + percentage/rupee toggle.
4. Persona Experience: computed impact badge + 2-sentence grounded narrative.
5. Causal Explorer: edge magnitude + confidence badge + mocked node removal what-if preview.
6. Policy Lab: “Why this variant?” accountability panel + apply-to-PolicyStudio action.
7. Scenario Comparison: ranked verdict and recommended decision statement.
8. Persona Chat: strict grounding disclaimer and citation snippets.
9. Done gate: each page answers one decision question clearly and references provenance.

**Phase 6: Component-Level Upgrade Pack (parallel with Phase 5)**
1. Policy card upgrade in PolicyBlockCard.jsx.
2. Metric narrative hooks in MetricCard.jsx.
3. Distribution rationale panel in DistributionCard.jsx.
4. Persona computed badge + narrative slot in PersonaCard.jsx.
5. Causal edge semantics in CausalGraphContainer.jsx.
6. Scenario ranking enhancements in ComparisonTable.jsx and ScenarioList.jsx.
7. Run/progress feedback in StepperNavigation.jsx, InsightHeader.jsx, MainLayout.jsx.
8. Done gate: components expose data hooks from vision doc, not just presentational shells.

**Phase 7: Global Practicality Features (Day 5)**
1. Two-step run animation: calibrating linkages, computing impacts.
2. Confidence badge with scenario status and baseline source.
3. One-click policy brief export (JSON first, PDF second).
4. Include top 3 impacts, causal chain, persona story, and recommendation in export.
5. Done gate: non-technical stakeholder can consume one exported brief without opening the app.

**Phase 8: India Calibration Layer (Day 5-6)**
1. Add source metadata and footnotes to outputs.
2. Normalize terminology to India policy context.
3. Add optional state variation overlay rule (industrial vs agrarian adjustment).
4. Done gate: demo scenario references India-specific assumptions explicitly.

**Phase 9: Demo and Reliability Hardening (Day 6-7)**
1. Preload two canonical demo scenarios from current rules.
2. Add deterministic smoke tests for end-to-end payload integrity.
3. Rehearse 90-second narrative path and freeze wording.
4. Validate runtime behaviors for backend unavailable, partial payload, and restored scenario.
5. Done gate: repeatable demo run with zero narrative-data mismatch.

---

**Per-Page Execution Checklist (Implementation Order)**
1. PolicyStudio.jsx: Policy artifact panel, preview, export, apply-variant intake.
2. MacroImpact.jsx: driver sentence and contributor hooks.
3. DistributionImpact.jsx: causal channels and %/₹ toggle.
4. PersonaExperience.jsx: computed impact badges + grounded narrative.
5. CausalExplorer.jsx: auditable edge labels and what-if pane.
6. PolicyLab.jsx: accountable variant cards + apply flow.
7. ScenarioComparison.jsx: ranked recommendation and final verdict.
8. PersonaChat.jsx: citation-first chat behavior.

**Per-Component Execution Checklist**
1. PolicyBlockCard.jsx: metadata, versioning UI, artifact refs.
2. MetricCard.jsx: driver sentence + contributor tooltip.
3. DistributionCard.jsx: why-panel per group.
4. PersonaCard.jsx: computed impact chips + grounded snippet.
5. CausalGraphContainer.jsx: edge magnitude/confidence rendering.
6. ComparisonTable.jsx: ranked decision rows and recommendation badges.
7. ScenarioList.jsx: scenario score and selection rationale.
8. InsightHeader.jsx: provenance and confidence display.
9. Toast.jsx: run-stage messaging and confidence warning text.

---

**Dependency Logic (Critical Sequencing)**
1. Policy artifact must ship before rule matching.
2. Rule matching must ship before narrative hooks.
3. Narrative hooks must ship before persona chat grounding.
4. Causal labels must ship before policy-lab accountability text.
5. Export brief should ship only after provenance fields are present end-to-end.

**Acceptance Criteria (Program-Level)**
1. Every visible number has a driver sentence and provenance reference.
2. Every persona metric can be traced to distribution outputs.
3. Every causal edge has magnitude plus confidence.
4. Every policy variant has explicit policy delta and measurable tradeoff.
5. Exported brief is stakeholder-ready and consistent with on-screen data.
6. LLM output never introduces numeric values not present in computed payload.

**Best Immediate Next Move (First 3 Execution Tickets)**
1. Implement PolicyBlock artifact creation/export and ingestion end-to-end.
2. Wire rules folder runtime loader/matcher using the two existing JSON rules.
3. Add macro/distribution/persona narrative hooks with frozen-number guardrails.

If you want, I can now turn this into a concrete sprint board with ticket-level breakdown (owner, estimate, dependencies, file touchpoints, and definition of done per ticket).