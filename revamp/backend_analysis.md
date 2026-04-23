# Backend Revamp: Full Dependency Analysis & Migration Strategy

## Your Concerns, Answered Directly

---

## 1. "What backend components should we NOT touch because they could break the frontend?"

### The Single Chokepoint: The Frontend-Backend Contract

Your frontend and backend are connected through **exactly 3 touchpoints**. This is surprisingly clean:

| Touchpoint | Frontend Caller | Backend Handler | What It Carries |
|:---|:---|:---|:---|
| `POST /simulate` | [simulationService.js](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/services/simulationService.js#L213) | [simulation.py → pipeline.simulate()](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/routes/simulation.py#L10-L18) | Full simulation payload (7 top-level keys) |
| `GET /policy/templates` | [simulationService.js](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/services/simulationService.js#L188-L205) | [simulation.py → rule_registry](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/routes/simulation.py#L21-L30) | Policy template list |
| `POST /api/persona/query` | [PersonaChat.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/PersonaChat.jsx#L138) | [persona.py → persona_service](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/routes/persona.py#L7-L20) | LLM-powered persona Q&A |

### What CAN'T break (internal-only backend modules)

These backend files are **never directly referenced by any frontend code**. You can rewrite, replace, or delete them freely:

| Backend Module | Why It's Safe |
|:---|:---|
| [cge_core.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/cge_core.py) | Internal solver — only consumed by pipeline.py |
| [sam_adapter.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/sam_adapter.py) | Internal SAM normalizer — only consumed by cge_core.py |
| [macro_engine.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/macro_engine.py) | Produces `macro` section — pipeline internal |
| [distribution_engine.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/distribution_engine.py) | Produces `distribution` section — pipeline internal |
| [persona_engine.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/persona_engine.py) | Produces `personas` section — pipeline internal |
| [causal_engine.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/causal_engine.py) | Produces `causal` section — pipeline internal |
| [policy_lab_engine.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/policy_lab_engine.py) | Produces `policyLab` section — pipeline internal |
| [scenario_engine.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/scenario_engine.py) | Produces `scenarios` section — pipeline internal |
| [narrative_engine.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/narrative_engine.py) | Produces narrative text — pipeline internal |
| [analysis_summary_engine.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/analysis_summary_engine.py) | Produces `analysisSummary` — pipeline internal |
| [policy_ingestion.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/policy_ingestion.py) | Parses incoming policy — pipeline internal |
| [response_assembler.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/response_assembler.py) | Assembles final response — pipeline internal |
| [stage_validation.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/stage_validation.py) | Internal validation checks |
| [parity_harness.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/parity_harness.py) | Test/comparison harness |
| [formatters.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/formatters.py) | Utility functions |
| [persona_mapper.py](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend/app/services/persona_mapper.py) | Maps raw persona data |

> [!IMPORTANT]
> **You can rewrite the ENTIRE backend internals** without breaking a single frontend component, as long as you preserve these 3 response shapes:
> 1. `/simulate` returns the 7-key payload shape (`analysisSummary`, `macro`, `distribution`, `personas`, `causal`, `policyLab`, `scenarios`)
> 2. `/policy/templates` returns `{ templates: [...] }`
> 3. `/api/persona/query` returns `{ response: { summary, opinions, regional_comparison } }`

---

## 2. "What if I replace something and another thing breaks?"

### The Firewall: Your Frontend is Already Defensive

Your frontend has **two safety layers** that protect it from backend changes:

**Layer 1: `normalizeSimulationResults()`** in [simulationService.js](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/services/simulationService.js#L151-L184)
- Merges backend response with `createDefaultResults()` defaults
- If the backend returns `null`, empty, or partial data → frontend fills in empty defaults
- Missing keys are tracked in `meta.missingKeys`

**Layer 2: `createDefaultResults()`** in [simulationService.js](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/services/simulationService.js#L38-L124)
- Every page-level data structure has a default shape (empty strings, empty arrays)
- Pages already null-check everything: `const macro = results?.macro || {}`

### This means:

> [!TIP]
> **You can ship a new backend that initially returns FEWER fields than before, and the frontend will NOT crash.** It will show empty/default values for the missing parts. This enables incremental migration — build one section at a time, and the rest gracefully degrade.

### The ONLY thing that would break the frontend:

1. **Returning a completely malformed response** (not JSON, or wrapping things in unexpected nesting)
2. **Changing the 7 top-level key names** (`analysisSummary`, `macro`, `distribution`, `personas`, `causal`, `policyLab`, `scenarios`)
3. **Removing `/simulate` or `/policy/templates` endpoints entirely**
4. **Changing CORS config** (currently allows `localhost:5173` and `localhost:3000`)

---

## 3. "What data is shown on what specific page?"

Here's the **exact field-by-field consumption map** — what each frontend page reads from `results`:

### Page 1: Policy Studio (`/policy`)
[PolicyStudio.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/PolicyStudio.jsx)

| Data Source | Fields Used | What It Shows |
|:---|:---|:---|
| Store `policies` (local) | `name`, `status`, `policyType`, `sliderValue`, `primaryParam`, `secondaryParams`, `tags` | Policy module cards with sliders |
| Store `policyArtifactDraft` (local) | `shocks[]`, `metadata` | Shock preview panel |
| `GET /policy/templates` | `templates[].id`, `.label`, `.description`, `.type`, `.tags` | Template selector to add policies |
| `results.analysisSummary` | `netFiscalImpact`, `confidenceInterval` | Top status bar after simulation |

> **Key:** Policy Studio is 95% local state. Backend only provides templates and post-run summary metrics.

---

### Page 2: Macro Impact (`/macro`)
[MacroImpact.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/MacroImpact.jsx)

| Data Source | Fields Used | What It Shows |
|:---|:---|:---|
| `results.macro` | `currentMacroTarget` | GDP growth target (main number) |
| `results.macro` | `sectors[].name`, `.value`, `.delta` | Sector performance table + bar chart |
| `results.macro` | `sideMetrics[].label`, `.value`, `.unit`, `.note` | CPI, Employment Index cards |
| `results.macro` | `insightTitle`, `insightImplication`, `contextBridge`, `userIntent` | Headline text, narrative bridge |
| `results.macro.narrative` | `summary`, `driverSentences[]`, `sourceSnippets[]` | Growth driver explanations |
| `results.analysisSummary` | `confidenceInterval`, `netFiscalImpact` | Confidence badge, fiscal impact |
| `results.distribution` | `insightImplication` | Causal pathway preview |

---

### Page 3: Distribution Impact (`/distribution`)
[DistributionImpact.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/DistributionImpact.jsx)

| Data Source | Fields Used | What It Shows |
|:---|:---|:---|
| `results.distribution` | `segments[].id`, `.segmentLabel`, `.name`, `.delta`, `.description`, `.netImpact` | Income group cards (lower/middle/upper) |
| `results.distribution` | `ledger[].name`, `.delta` | Tax/transfer channel contribution |
| `results.distribution` | `giniDelta` | Gini coefficient change badge |
| `results.distribution` | `methodologyNote` | Fine print methodology note |
| `results.distribution` | `insightTitle`, `insightImplication`, `contextBridge`, `userIntent` | Page headline |
| `results.distribution.narrative` | `summary`, `driverSentences[]` | Narrative explanations |

---

### Page 4: Persona Experience (`/personas`)
[PersonaExperience.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/PersonaExperience.jsx)

| Data Source | Fields Used | What It Shows |
|:---|:---|:---|
| `results.personas` | `personas[].id`, `.name`, `.sector`, `.description`, `.netImpact`, `.tag`, `.tagType`, `.metadata`, `.breakdown` | Persona cards grid |
| `results.personas` | `breakdown.taxAdjustments`, `.costOfLiving`, `.rebateCredit` | Per-persona impact breakdown |
| `results.personas` | `insightTitle`, `insightImplication`, `contextBridge`, `description` | Page headline and framing |
| `results.personas.narrative` | `summary` | Narrative summary text |

---

### Page 5: Persona Chat (`/persona-chat`)
[PersonaChat.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/PersonaChat.jsx)

| Data Source | Fields Used | What It Shows |
|:---|:---|:---|
| `results.personas.personas` | `.metadata.state`, `.netImpact`, `.name`, `.sector` | Map choropleth + agent roster |
| `results.macro`, `.distribution`, `.personas`, `.causal`, `.policyLab` | `narrative.sourceSnippets[]` | Citation grounding bar |
| `POST /api/persona/query` | `response.summary`, `.opinions[]`, `.regional_comparison` | AI chat responses + map overlay |

---

### Page 6: Causal Explorer (`/causality`)
[CausalExplorer.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/CausalExplorer.jsx)

| Data Source | Fields Used | What It Shows |
|:---|:---|:---|
| `results.causal` | `nodes[].id`, `.type`, `.position`, `.data.label`, `.data.sublabel` | Interactive causal graph nodes |
| `results.causal` | `edges[].id`, `.source`, `.target`, `.type`, `.label`, `.magnitude`, `.confidence`, `.animated` | Graph edges with flow animation |
| `results.causal` | `diagnostic.selectedVariable`, `.primaryDriver`, `.downstreamOutcome`, `.explanation` | Diagnostic detail panel |
| `results.causal` | `insightTitle`, `insightImplication`, `contextBridge` | Page headline |
| `results.causal.narrative` | `summary`, `driverSentences[]` | Narrative sidebar |

---

### Page 7: Policy Lab (`/policy-lab`)
[PolicyLab.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/PolicyLab.jsx)

| Data Source | Fields Used | What It Shows |
|:---|:---|:---|
| `results.policyLab` | `deltaMetrics[].label`, `.value`, `.unit`, `.note`, `.trend`, `.type` | GDP/Inflation/Employment delta cards |
| `results.policyLab` | `refinements[].name`, `.priority`, `.progress` | Refinement recommendation bars |
| `results.policyLab` | `comparisonMatrix[].metric`, `.statusQuo`, `.simX`, `.simY`, `.variance`, `.varType` | Comparison table |
| `results.policyLab` | `confidence`, `stochasticDrift`, `simulationStatus` | Confidence and status badges |
| `results.policyLab` | `insightTitle`, `insightImplication`, `contextBridge` | Page headline |
| `results.policyLab.narrative` | `summary`, `driverSentences[]` | Narrative text |
| Local `analyticsEngine.js` | `optimize → decomposition`, `interactions`, `suggestions`, `scorecard` | Policy optimization panel (client-side) |

---

### Page 8: Scenario Comparison (`/compare`)
[ScenarioComparison.jsx](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/frontend/src/pages/ScenarioComparison.jsx)

| Data Source | Fields Used | What It Shows |
|:---|:---|:---|
| `results.scenarios` | `metrics[].name`, `.baseline`, `.reformA`, `.reformB`, `.reformADelta`, `.reformBDelta`, `.reformAType`, `.reformBType` | Comparison metrics table |
| `results.scenarios` | `tradeoffData[].name`, `.growth`, `.debt` | Tradeoff scatter chart |
| `results.scenarios` | `verdict.summary`, `.detail` | Recommendation verdict |
| `results.scenarios` | `reformALabel`, `reformBLabel` | Reform scenario labels |
| `results.scenarios` | `title`, `insightImplication`, `contextBridge`, `description`, `step`, `stepLabel` | Page framing |
| Store `savedScenarios` | Array of `{ results, policies, policyArtifact }` | Multi-scenario comparison |

---

## 4. The Migration Strategy: Build New, Don't Tear Down Old

Here's the key insight from all this analysis:

### Architecture: V2 Endpoint Alongside V1

```
                  ┌─────────────────────────────┐
                  │         Frontend             │
                  │   simulationService.js       │
                  │   (change BASE_URL or        │
                  │    endpoint path once)        │
                  └──────────┬──────────────────┘
                             │
                    POST /simulate/v2  ← new endpoint
                             │
                  ┌──────────▼──────────────────┐
                  │    NEW Pipeline (V2)         │
                  │   ┌───────────────────┐      │
                  │   │ contract_layer    │      │
                  │   │ calibration_layer │      │
                  │   │ shock_compiler    │      │
                  │   │ cge_solver_core   │ ← keep & improve existing cge_core.py
                  │   │ postsolve_analytics│     │
                  │   │ hybrid_overlay    │      │
                  │   │ response_assembler│      │
                  │   └───────────────────┘      │
                  │                              │
                  │   Returns SAME 7-key shape:  │
                  │   {analysisSummary, macro,    │
                  │    distribution, personas,    │
                  │    causal, policyLab,         │
                  │    scenarios}                 │
                  └──────────────────────────────┘
                  
     POST /simulate  ← old endpoint STAYS until V2 is proven
```

### Step-by-Step Plan:

1. **Keep `/simulate` (V1) running** — do not delete or modify
2. **Build `/simulate/v2` as a NEW route** with the new pipeline
3. **V2 returns the SAME 7-key response shape** — `{analysisSummary, macro, distribution, personas, causal, policyLab, scenarios}`
4. **When V2 is working**, change ONE line in the frontend:
   ```javascript
   // In simulationService.js, line 213:
   // FROM:
   const res = await fetch(`${BASE_URL}/simulate`, ...
   // TO:
   const res = await fetch(`${BASE_URL}/simulate/v2`, ...
   ```
5. **Delete V1 when confident**

> [!CAUTION]
> **The critical invariant**: V2 must produce a response that passes `normalizeSimulationResults()` without `isPartial: true` for all 7 keys. If even one key is missing, the frontend will show empty state for that page — functional but ugly.

### What You Can Reuse From the Old Backend:

| Old Module | Keep / Replace | Reason |
|:---|:---|:---|
| `cge_core.py` (Cobb-Douglas solver) | **KEEP & enhance** | Real economic model, works correctly, just needs more sectors/factors |
| `sam_adapter.py` | **KEEP & extend** | SAM parsing logic is sound, needs more sectors |
| `schemas.py` (Pydantic models) | **KEEP & evolve** | Good foundation, add V2 schemas alongside |
| `pipeline.py` (orchestrator) | **REPLACE** | Too coupled, hardcoded config, no separation of concerns |
| `macro_engine.py` | **REPLACE** | Too many hardcoded coefficients mixed with CGE data |
| `distribution_engine.py` | **REPLACE** | Same issue — hardcoded mixed with computed |
| `persona_engine.py` | **REPLACE** | Maps personas but doesn't use CGE state properly |
| `causal_engine.py` | **REPLACE** | Mostly template-driven, not derived from CGE |
| `policy_lab_engine.py` | **REPLACE** | Hardcoded optimization, not connected to CGE welfare |
| `scenario_engine.py` | **REPLACE** | Fixed reform A/B comparison, not from actual re-runs |
| `narrative_engine.py` | **REPLACE** | Template strings, needs CGE-grounded narratives |
| `rule_registry.py` | **KEEP** | Policy template system works, just extend |
| `persona_service.py` (LLM chat) | **KEEP** | Independent LLM integration, orthogonal to pipeline |
| `policy_ingestion.py` | **PARTIALLY KEEP** | Input parsing is solid, shock compilation needs upgrading |

---

## 5. New Data That Will Need New UI Components

Based on the V2 output contract in your [backend-revamp.md](file:///d:/Projects/CURRENT/algoquest/CGE_Algo/backend-revamp.md), here's what's **new** and will need frontend work:

### New Data → New/Updated UI Needed

| New V2 Data | Which Page | UI Component Needed |
|:---|:---|:---|
| `prices.producer_prices`, `prices.consumer_prices` | Macro Impact | **New**: Price decomposition table/chart |
| `prices.factor_prices` (wages by skill, rentals, land rents) | Macro Impact, Distribution | **New**: Factor price cards or waterfall chart |
| `prices.exchange_rate` | Macro Impact | **New**: Exchange rate indicator |
| `quantities_volumes.sectoral_output` | Macro Impact | **Update**: Enhance existing sector bar chart |
| `quantities_volumes.factor_demand` | Macro Impact | **New**: Factor demand breakdown |
| `quantities_volumes.trade_volumes` | Macro Impact | **New**: Trade balance visualization |
| `quantities_volumes.household_consumption` | Distribution | **New**: Consumption by household group chart |
| `quantities_volumes.investment_savings` | Macro Impact | **New**: Investment/savings balance card |
| `welfare_macro_indicators.equivalent_variation` | Distribution, Personas | **New**: EV welfare metric per household |
| `welfare_macro_indicators.compensating_variation` | Distribution | **New**: CV metric display |
| `decomposition.channel_contributions` | Causal Explorer | **Update**: Enhance causal graph with magnitudes |
| `decomposition.sector_contributions` | Macro Impact | **New**: Sector contribution waterfall |
| `decomposition.group_contributions` | Distribution | **New**: Group welfare waterfall |
| `diagnostics.solver_status` | All pages (badge) | **New**: Solver status indicator component |
| `diagnostics.market_clearing_checks` | Causal Explorer | **New**: Market clearing diagnostic panel |
| `provenance.source_type` per metric | All pages | **New**: Provenance tooltip/badge per metric |

### But: These are ADDITIVE changes

None of these new fields conflict with existing UI. The new V2 data adds fields; it doesn't remove the old ones. Your existing pages will continue working with their current fields, and you add new components in parallel.

---

## Summary: Your Safe Migration Path

```
 Phase 1: Build V2 pipeline → new endpoint, old stays alive
 Phase 2: V2 returns same 7-key shape → frontend works immediately
 Phase 3: Switch frontend from /simulate to /simulate/v2 (ONE line)
 Phase 4: Add new UI components for new V2 data (additive, no breakage)
 Phase 5: Delete V1 endpoint and old engines
```

> [!TIP]
> **The principle**: Your frontend is already defensive. Your backend is modular behind a single `/simulate` endpoint. You can rebuild the entire engine room without touching the cockpit — just make sure the output cable carries the same signal shape.
