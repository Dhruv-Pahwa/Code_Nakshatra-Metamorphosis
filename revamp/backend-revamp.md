**Backend Revamp Spec (CGE + Deterministic Hybrid)**
**Objective**
Build a practical, economically credible, and presentation-safe simulation backend where:
1. Exogenous inputs are explicit, validated, and policy-driven.
2. Endogenous outputs are model-computed and traceable.
3. Hardcoded logic supports flow quality without replacing core economics.
4. Frontend pages consume one canonical run payload with zero ambiguity.

---

**1) Product Goals**
1. Deliver a policy simulation system that is economically impressive and practically operable under hackathon and post-hackathon constraints.
2. Maintain the existing page flow while upgrading data integrity end-to-end.
3. Prevent future pipeline drift by enforcing strict contracts, strict ownership, and strict provenance.
4. Keep deterministic reproducibility for demos and audits.

---

**2) Design Principles**
1. Policy is the single source of truth for simulation runs.
2. All displayed numeric outcomes come from model computation, not page-level heuristics.
3. Hardcoded logic is allowed only for narrative scaffolding, defaults, and fallbacks.
4. Every metric includes lineage metadata.
5. One run equals one immutable snapshot consumed by all pages.

---

**3) Hybrid Strategy (What is CGE vs Hardcoded)**
1. CGE-computed domain:
- Prices
- Quantities
- Welfare and macro indicators
- Trade and factor market outcomes
- Government revenue and distribution outcomes

2. Hardcoded deterministic support domain:
- Scenario labels
- Narrative template scaffolds
- Confidence badges
- Demo fallback text
- Optional fallback synthetic outputs when solver fails (must be explicitly flagged)

3. Prohibited hardcoding:
- Any final result metric presented as computed economic output.

---

**4) Input Contract V2 (Exogenous)**
All fields below are required unless explicitly marked optional.

1. `structural_behavioral_parameters`
- `elasticities_substitution`
- `elasticities_transformation`
- `income_elasticities`
- `baseline_tax_rates`
- `behavior_flags` (optional deterministic assumptions)

2. `benchmark_sam`
- `transaction_flows`
- `factor_endowments` with labor skill splits, capital, land, resources
- `household_characteristics` with population, types, base distribution
- `government_accounts` with spending and transfers
- `rest_of_world_accounts` (for open economy behavior)

3. `policy_shocks`
- `price_shocks` for import/export world prices
- `policy_changes` for tax/tariff/subsidy/carbon instruments
- `productivity_shocks` by sector
- `factor_supply_shocks` for labor force and capital stock

4. `closure_config`
- `numeraire_choice`
- `government_closure_rule`
- `savings_investment_closure_rule`
- `external_balance_closure_rule`
- `exchange_rate_regime`

5. `run_metadata`
- `run_id` (generated if absent)
- `policy_artifact_id`
- `country_context`
- `currency`
- `notes` (optional)

---

**5) Output Contract V2 (Endogenous)**
1. `prices`
- `producer_prices`
- `consumer_prices`
- `factor_prices` with wages, rentals, rents
- `exchange_rate`
- `numeraire_price`

2. `quantities_volumes`
- `sectoral_output`
- `factor_demand`
- `trade_volumes` imports and exports
- `household_consumption`
- `investment_savings`

3. `welfare_macro_indicators`
- `real_gdp`
- `equivalent_variation`
- `compensating_variation`
- `government_revenue`
- `trade_balance`
- `income_distribution_changes`

4. `decomposition`
- `channel_contributions` by shock type
- `sector_contributions` to macro movement
- `group_contributions` to welfare shifts

5. `diagnostics`
- `solver_status`
- `convergence_flags`
- `residual_norms`
- `market_clearing_checks`
- `invariant_checks`

6. `provenance`
- `lineage_ids`
- `active_equation_blocks`
- `matched_rule_ids` when applicable
- `source_type` per metric (`cge`, `rule_overlay`, `derived`)
- `timestamp`

---

**6) Backend Module Architecture**
1. `contract_layer`
- Validate `InputContractV2`
- Validate and serialize `OutputContractV2`
- Reject partial or malformed payloads with explicit error codes

2. `calibration_layer`
- SAM normalization
- Baseline parameter calibration
- Elasticity and share consistency checks

3. `shock_compiler`
- Convert policy shocks into model-compatible perturbations
- Resolve precedence and conflicts
- Produce a compiled shock map

4. `cge_solver_core`
- Baseline solve
- Scenario solve
- Equilibrium convergence checks
- Open-economy and closure handling

5. `postsolve_analytics`
- Delta computation baseline vs scenario
- Welfare metrics EV/CV
- Distribution and macro decomposition

6. `hybrid_overlay_engine`
- Add deterministic narrative scaffolds and confidence metadata
- Add explicit flags when fallbacks are used

7. `response_assembler_v2`
- Assemble `OutputContractV2`
- Attach provenance and diagnostics
- Emit immutable `run_snapshot`

---

**7) API Specification**
1. `POST /simulate/v2`
- Input: `InputContractV2`
- Output: `RunSnapshotV2` containing validated output contract and diagnostics

2. `POST /calibrate/sam/v2`
- Input: benchmark SAM + optional defaults
- Output: calibrated baseline object + validation report

3. `POST /validate/contract/v2`
- Input: simulation payload candidate
- Output: pass/fail + field-level contract errors

4. `GET /schemas/v2`
- Output: machine-readable JSON schema references for input/output contracts

---

**8) Canonical Run Snapshot (Frontend Single Source)**
`run_snapshot_v2` must include:
1. `input_echo`
2. `compiled_shocks`
3. `computed_output`
4. `diagnostics`
5. `provenance`
6. `ui_meta`

Frontend must store exactly this object as `activeRunSnapshot` and all pages read from selectors based on it.

---

**9) Page Consumption Map**
1. Policy Studio
- Input validation state
- Compiled shock preview
- Artifact export and run readiness checks

2. Macro Impact
- Real GDP, sectoral output, prices, government revenue
- Driver summary from decomposition and lineage

3. Distribution Impact
- Income distribution changes by group
- EV/CV by household type
- Why-this-group channels from decomposition

4. Persona Experience
- Persona effects derived from household distribution output
- No independent numeric generation on the frontend

5. Causal Explorer
- Ordered transmission graph from shock to prices/quantities/welfare
- Magnitudes from decomposition and diagnostics

6. Policy Lab
- Counterfactual variants generated as new input shocks
- Each variant solved through same pipeline and compared on outputs

7. Scenario Comparison
- Multi-run comparison table from multiple `run_snapshot_v2` entries

---

**10) Practical Reasons for This Revamp**
1. Eliminates fake continuity between pages by replacing implicit transforms with explicit contracts.
2. Prevents “vibe-coded drift” through schema-validated boundaries.
3. Supports both economic rigor and demo speed through controlled hybridization.
4. Makes debugging fast via diagnostic visibility and provenance tags.
5. Enables future scale to full CGE sophistication without breaking UI contracts.
6. Preserves existing UX investment while fixing model integrity.

---

**11) Expected Benefits**
1. Practical reliability:
- Fewer broken handoffs
- Deterministic behavior
- Faster iteration with guardrails

2. Economic credibility:
- Real equilibrium-based outputs
- Proper welfare interpretation
- Better policy defensibility to judges/stakeholders

3. Engineering quality:
- Clear separation of concerns
- Contract-driven development
- Strong testability and reproducibility

4. Presentation quality:
- Every page can explain “what changed and why”
- Better confidence story with diagnostics
- Cleaner narrative alignment with computed data

---

**12) Validation and Testing Requirements**
1. Contract tests
- Input/output schema conformance for all endpoints

2. Golden scenario tests
- Carbon tax, tax+transfer, productivity gain, factor shock

3. Economic invariant tests
- Market clearing checks
- Non-negativity where required
- Closure consistency

4. Frontend selector tests
- Each page selector resolves from `run_snapshot_v2` without undefined fields

5. Provenance tests
- Every displayed metric has lineage and source type

---

**13) Rollout Plan**
1. Phase 1: Contract-first backbone
- Implement InputContractV2, OutputContractV2, RunSnapshotV2
- Add `/simulate/v2` with strict validation

2. Phase 2: CGE core hardening
- Baseline/scenario solve, closure options, diagnostics

3. Phase 3: Hybrid overlays and decomposition
- Narrative-ready and page-ready metadata with source tagging

4. Phase 4: Frontend binding and render gates
- Migrate page selectors to run snapshot
- Remove page-level numeric recomputations

5. Phase 5: Counterfactual and scenario comparison maturity
- Policy Lab variant loop and scenario store normalization

---

**14) Non-Negotiable Acceptance Criteria**
1. Numeric outputs displayed in UI are always model-derived or explicitly flagged as fallback.
2. Every output metric includes provenance.
3. All existing pages render from one run snapshot format.
4. Contract validation blocks invalid runs before simulation starts.
5. Diagnostics make solver and data issues explicit, not silent.

---

**15) Implementation Decision**
Build a real CGE-centered backend with deterministic hardcoded support logic around it.  
Do not replace with a pure hardcoded simulation engine.  
Do not start a separate backend stack now unless organizational constraints force it.

This gives the best balance of:
1. Practical delivery speed.
2. Economic impressiveness.
3. End-to-end robustness across your current workflow.

If you want, next I can convert this into an execution-ready technical spec format with:
1. JSON schemas for `InputContractV2` and `OutputContractV2`.
2. Endpoint request/response examples.
3. A field-by-field page binding matrix for your existing UI.