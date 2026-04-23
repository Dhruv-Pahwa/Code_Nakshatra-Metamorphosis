# Backend Data Flow Document for SimulationResponse Contract

## 1. Pipeline Overview

| Stage | Module | Purpose | Upstream Dependencies |
|---|---|---|---|
| 1 | policy_ingestion | Normalize, validate, and enrich incoming policy input into a canonical policy state. | None |
| 2 | macro_engine | Compute macro outcomes from canonical policy state. | policy_ingestion |
| 3 | distribution_engine | Compute distributional outcomes using macro outputs and policy state. | policy_ingestion, macro_engine |
| 4 | persona_engine | Compute persona-level outcomes using distribution and macro outputs. | policy_ingestion, macro_engine, distribution_engine |
| 5 | causal_engine | Build causal graph and diagnostics from policy and computed outcomes. | policy_ingestion, macro_engine, distribution_engine, persona_engine |
| 6 | policy_lab_engine | Generate policy lab deltas, refinements, and matrix metrics. | policy_ingestion, macro_engine, distribution_engine, causal_engine |
| 7 | scenario_engine | Generate comparative scenarios, metrics, tradeoff points, and verdict. | policy_ingestion, macro_engine, distribution_engine, persona_engine, causal_engine, policy_lab_engine |
| 8 | analysis_summary_engine | Generate analysisSummary after all other sections are available. | macro_engine, distribution_engine, persona_engine, causal_engine, policy_lab_engine, scenario_engine |
| 9 | response_assembler | Assemble final contract object in exact top-level key order and validate strict contract compliance. | analysis_summary_engine, macro_engine, distribution_engine, persona_engine, causal_engine, policy_lab_engine, scenario_engine |

## 2. Module Specifications

### policy_ingestion
Signature:
```python
def policy_ingestion(
    policy: dict,
    run_id: str,
    timestamp_utc: str,
    model_config: dict
) -> dict:
    ...
```

Inputs:
- policy (raw request payload)
- run_id
- timestamp_utc
- model_config

Outputs:
- canonical_policy_state (internal artifact)
- policy_features (internal artifact)

Dependencies:
- None

Example input shape:
```json
{
  "policy": {
    "policies": [
      {"id": "pol-001", "policyType": "tax", "sliderValue": 35},
      {"id": "pol-002", "policyType": "transfer", "sliderValue": 60}
    ]
  },
  "run_id": "run-20260417-001",
  "timestamp_utc": "2026-04-17T08:35:00Z"
}
```

Example output shape:
```json
{
  "canonical_policy_state": {
    "runId": "run-20260417-001",
    "effectivePolicyVector": {"tax": 0.35, "transfer": 0.60}
  },
  "policy_features": {
    "policyCount": 2,
    "intensityScore": 0.475
  }
}
```

---

### macro_engine
Signature:
```python
def macro_engine(
    canonical_policy_state: dict,
    policy_features: dict,
    macro_coefficients: dict
) -> dict:
    ...
```

Inputs:
- canonical_policy_state
- policy_features
- macro_coefficients

Outputs (contract paths):
- macro.insightTitle
- macro.insightImplication
- macro.contextBridge
- macro.userIntent
- macro.currentMacroTarget
- macro.fiscalYearBaseline
- macro.wowDelta
- macro.sectors[]
- macro.sideMetrics[]
- macro.activeSimulations[]

Dependencies:
- policy_ingestion

Example input shape:
```json
{
  "canonical_policy_state": {"effectivePolicyVector": {"tax": 0.35, "transfer": 0.60}},
  "policy_features": {"policyCount": 2, "intensityScore": 0.475}
}
```

Example output shape:
```json
{
  "macro": {
    "insightTitle": "GDP stabilizes at +2.4%.",
    "insightImplication": "Industrial output leads trajectory.",
    "contextBridge": "Based on your policy stack...",
    "userIntent": "Review aggregate economic outcomes.",
    "currentMacroTarget": "2.4",
    "fiscalYearBaseline": "INR 295.8T",
    "wowDelta": "+0.74% WoW",
    "sectors": [
      {"name": "Industrial Production", "subtitle": "MANUFACTURING INDEX", "value": 54.2, "delta": "+1.2%"}
    ],
    "sideMetrics": [
      {"label": "PRICE INDEX (CPI)", "value": "4.1", "unit": "%", "note": "Inflation within tolerance band."}
    ],
    "activeSimulations": [
      {"name": "Expansionary Alpha", "status": "RUNNING"}
    ]
  }
}
```

---

### distribution_engine
Signature:
```python
def distribution_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution_coefficients: dict
) -> dict:
    ...
```

Inputs:
- canonical_policy_state
- macro.currentMacroTarget
- macro.sectors[]
- distribution_coefficients

Outputs (contract paths):
- distribution.insightTitle
- distribution.insightImplication
- distribution.contextBridge
- distribution.userIntent
- distribution.segments[]
- distribution.ledger[]
- distribution.giniDelta
- distribution.methodologyNote

Dependencies:
- policy_ingestion
- macro_engine

Example input shape:
```json
{
  "macro": {
    "currentMacroTarget": "2.4",
    "sectors": [{"name": "Industrial Production", "value": 54.2}]
  }
}
```

Example output shape:
```json
{
  "distribution": {
    "insightTitle": "Tax restructuring is progressive.",
    "insightImplication": "Gini improves by -0.014.",
    "contextBridge": "Macro growth translates into uneven effects.",
    "userIntent": "Assess distributional balance.",
    "segments": [
      {
        "id": "lower",
        "segmentLabel": "LOWER QUINTILE",
        "name": "Consumer Resilience",
        "delta": "+7.2",
        "description": "Disposable Income Delta",
        "netImpact": "+INR 11400 / yr"
      }
    ],
    "ledger": [{"name": "Standard Deduction Expansion", "delta": "+2.3%"}],
    "giniDelta": "-0.014",
    "methodologyNote": "Static behavioral response assumption."
  }
}
```

---

### persona_engine
Signature:
```python
def persona_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution: dict,
    persona_catalog: dict
) -> dict:
    ...
```

Inputs:
- canonical_policy_state
- macro.currentMacroTarget
- distribution.giniDelta
- distribution.segments[]
- persona_catalog

Outputs (contract paths):
- personas.insightTitle
- personas.insightImplication
- personas.contextBridge
- personas.userIntent
- personas.description
- personas.personas[]

Dependencies:
- policy_ingestion
- macro_engine
- distribution_engine

Example input shape:
```json
{
  "distribution": {"giniDelta": "-0.014", "segments": [{"id": "lower", "delta": "+7.2"}]}
}
```

Example output shape:
```json
{
  "personas": {
    "insightTitle": "Urban professionals benefit most.",
    "insightImplication": "Largest beneficiary is far above most affected cohort.",
    "contextBridge": "Distribution shifts manifest as persona-level changes.",
    "userIntent": "Identify affected demographic cohorts.",
    "description": "Benefits concentrated in mid/high income brackets.",
    "personas": [
      {
        "id": "p1",
        "name": "Priya Sharma",
        "sector": "Urban Professional, Tech Sector",
        "description": "Impacted by levy removal and tax holiday.",
        "netImpact": "+INR 104200",
        "tag": "Top 5th Percentile Beneficiary",
        "tagType": "positive",
        "breakdown": {
          "taxAdjustments": "+INR 38000 / yr",
          "costOfLiving": "-INR 15600 / yr",
          "rebateCredit": "+INR 81800 / yr"
        }
      }
    ]
  }
}
```

---

### causal_engine
Signature:
```python
def causal_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution: dict,
    personas: dict,
    causal_rules: dict
) -> dict:
    ...
```

Inputs:
- canonical_policy_state
- macro.sectors[]
- distribution.segments[]
- personas.personas[]
- causal_rules

Outputs (contract paths):
- causal.insightTitle
- causal.insightImplication
- causal.contextBridge
- causal.userIntent
- causal.nodes[]
- causal.edges[]
- causal.diagnostic

Dependencies:
- policy_ingestion
- macro_engine
- distribution_engine
- persona_engine

Example input shape:
```json
{
  "macro": {"sectors": [{"name": "Industrial Production"}]},
  "distribution": {"segments": [{"id": "lower"}]},
  "personas": {"personas": [{"id": "p1"}]}
}
```

Example output shape:
```json
{
  "causal": {
    "insightTitle": "Tax adjustments drive GDP via fiscal multiplier.",
    "insightImplication": "Employment elasticity is strongest downstream channel.",
    "contextBridge": "Persona-level impacts are explained by these causal chains.",
    "userIntent": "Trace causal chain and strongest channels.",
    "nodes": [
      {
        "id": "n1",
        "type": "instrument",
        "position": {"x": 80, "y": 200},
        "data": {"label": "Interest Rates", "sublabel": "INSTRUMENT"}
      }
    ],
    "edges": [
      {"id": "e1", "source": "n1", "target": "n2", "type": "active"}
    ],
    "diagnostic": {
      "selectedVariable": "Fiscal Multiplier",
      "primaryDriver": {"name": "Corporate Tax Adjustment", "value": "+0.22", "label": "Marginal Impact"},
      "downstreamOutcome": {"name": "Regional Employment", "value": "94%", "label": "Statistical Confidence"},
      "explanation": "Detailed causal explanation text."
    }
  }
}
```

---

### policy_lab_engine
Signature:
```python
def policy_lab_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution: dict,
    causal: dict,
    optimization_params: dict
) -> dict:
    ...
```

Inputs:
- canonical_policy_state
- macro.currentMacroTarget
- distribution.giniDelta
- causal.diagnostic
- optimization_params

Outputs (contract paths):
- policyLab.insightTitle
- policyLab.insightImplication
- policyLab.contextBridge
- policyLab.userIntent
- policyLab.simulationStatus
- policyLab.deltaMetrics[]
- policyLab.refinements[]
- policyLab.comparisonMatrix[]
- policyLab.confidence
- policyLab.stochasticDrift

Dependencies:
- policy_ingestion
- macro_engine
- distribution_engine
- causal_engine

Example input shape:
```json
{
  "macro": {"currentMacroTarget": "2.4"},
  "distribution": {"giniDelta": "-0.014"},
  "causal": {"diagnostic": {"selectedVariable": "Fiscal Multiplier"}}
}
```

Example output shape:
```json
{
  "policyLab": {
    "insightTitle": "Refinements yield +2.4% GDP with inflation cooling.",
    "insightImplication": "Short-term fiscal contraction trade-off.",
    "contextBridge": "System identified refinement opportunities.",
    "userIntent": "Evaluate and accept/modify/reject optimizations.",
    "simulationStatus": "Active",
    "deltaMetrics": [
      {"label": "INFLATION", "value": "-0.6", "unit": "%", "note": "Projected acceleration from reinvestment.", "trend": "down"}
    ],
    "refinements": [{"name": "Corporate Levy Structuring", "priority": "PRIORITY A", "progress": 75}],
    "comparisonMatrix": [
      {"metric": "Marginal Utility per Capita", "statusQuo": "4.22", "simX": "4.89", "simY": "4.45", "variance": "+15.8%", "varType": "positive"}
    ],
    "confidence": "98.2%",
    "stochasticDrift": "0.04%"
  }
}
```

---

### scenario_engine
Signature:
```python
def scenario_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution: dict,
    personas: dict,
    causal: dict,
    policyLab: dict,
    scenario_params: dict
) -> dict:
    ...
```

Inputs:
- canonical_policy_state
- macro
- distribution
- personas
- causal
- policyLab
- scenario_params

Outputs (contract paths):
- scenarios.title
- scenarios.insightImplication
- scenarios.contextBridge
- scenarios.userIntent
- scenarios.description
- scenarios.step
- scenarios.stepLabel
- scenarios.metrics[]
- scenarios.tradeoffData[]
- scenarios.verdict
- scenarios.reformALabel
- scenarios.reformBLabel

Dependencies:
- policy_ingestion
- macro_engine
- distribution_engine
- persona_engine
- causal_engine
- policy_lab_engine

Example input shape:
```json
{
  "macro": {"currentMacroTarget": "2.4"},
  "distribution": {"giniDelta": "-0.014"},
  "policyLab": {"confidence": "98.2%"}
}
```

Example output shape:
```json
{
  "scenarios": {
    "title": "Reform A maximizes short-term output but adds long-term overhang.",
    "insightImplication": "Hybrid path recommended.",
    "contextBridge": "Scenarios derived from the same policy stack.",
    "userIntent": "Compare scenarios and commit optimal path.",
    "description": "Comparative macro trajectory analysis.",
    "step": "07",
    "stepLabel": "FINAL REVIEW",
    "metrics": [
      {
        "name": "GDP Growth Rate",
        "baseline": "2.1%",
        "reformA": "3.4%",
        "reformADelta": "up1.3%",
        "reformB": "1.4%",
        "reformBDelta": "down0.7%",
        "reformAType": "positive",
        "reformBType": "negative"
      }
    ],
    "tradeoffData": [{"name": "Reform A", "growth": 40, "debt": 35}],
    "verdict": {
      "summary": "Reform A maximizes short-term output but creates structural overhang by year 7.",
      "detail": "Hybrid tertiary path recommended."
    },
    "reformALabel": "REFORM A - Fiscal Stimulus",
    "reformBLabel": "REFORM B - Austerity Plus"
  }
}
```

---

### analysis_summary_engine
Signature:
```python
def analysis_summary_engine(
    macro: dict,
    distribution: dict,
    personas: dict,
    causal: dict,
    policyLab: dict,
    scenarios: dict,
    runtime_metrics: dict
) -> dict:
    ...
```

Inputs:
- macro
- distribution
- personas
- causal
- policyLab
- scenarios
- runtime_metrics (latency_ms, model_drift_pct, iterative_depth)

Outputs (contract paths):
- analysisSummary.netFiscalImpact
- analysisSummary.confidenceInterval
- analysisSummary.iterativeDepth
- analysisSummary.modelDrift
- analysisSummary.latency
- analysisSummary.insightTitle
- analysisSummary.insightImplication
- analysisSummary.userIntent

Dependencies:
- macro_engine
- distribution_engine
- persona_engine
- causal_engine
- policy_lab_engine
- scenario_engine

Example input shape:
```json
{
  "macro": {"currentMacroTarget": "2.4"},
  "policyLab": {"confidence": "98.2%"},
  "runtime_metrics": {"latency_ms": 38, "model_drift_pct": 0.002, "iterative_depth": 14000}
}
```

Example output shape:
```json
{
  "analysisSummary": {
    "netFiscalImpact": "+3.8",
    "confidenceInterval": "97.2",
    "iterativeDepth": "14000 steps",
    "modelDrift": "0.002%",
    "latency": "38ms",
    "insightTitle": "You defined a 2-policy fiscal framework.",
    "insightImplication": "Projected +3.8% net fiscal surplus with high confidence.",
    "userIntent": "Configure and run simulation."
  }
}
```

---

### response_assembler
Signature:
```python
def response_assembler(
    analysisSummary: dict,
    macro: dict,
    distribution: dict,
    personas: dict,
    causal: dict,
    policyLab: dict,
    scenarios: dict,
    contract_schema: dict
) -> dict:
    ...
```

Inputs:
- section artifacts from prior modules
- contract_schema

Outputs:
- final contract response object with exact top-level order:
  analysisSummary, macro, distribution, personas, causal, policyLab, scenarios

Dependencies:
- analysis_summary_engine
- macro_engine
- distribution_engine
- persona_engine
- causal_engine
- policy_lab_engine
- scenario_engine

Example input shape:
```json
{
  "analysisSummary": {"netFiscalImpact": "+3.8"},
  "macro": {"currentMacroTarget": "2.4"},
  "distribution": {"giniDelta": "-0.014"},
  "personas": {"personas": []},
  "causal": {"nodes": [], "edges": [], "diagnostic": {}},
  "policyLab": {"confidence": "98.2%", "stochasticDrift": "0.04%"},
  "scenarios": {"title": "Reform A..."}
}
```

Example output shape:
```json
{
  "analysisSummary": {},
  "macro": {},
  "distribution": {},
  "personas": {},
  "causal": {},
  "policyLab": {},
  "scenarios": {}
}
```

## 3. Contract Field Lineage Matrix

| Field Path(s) | Producing Module | Immediate Input Dependencies | Transformation Rule Summary |
|---|---|---|---|
| analysisSummary, macro, distribution, personas, causal, policyLab, scenarios | response_assembler | All section artifacts | Assemble in exact key order with no extra top-level keys. |
| analysisSummary.netFiscalImpact | analysis_summary_engine | macro, distribution, policyLab, runtime_metrics | Aggregate fiscal deltas and format signed numeric string. |
| analysisSummary.confidenceInterval | analysis_summary_engine | policyLab.confidence, model confidence sources | Normalize confidence to numeric string without percent symbol. |
| analysisSummary.iterativeDepth | analysis_summary_engine | runtime_metrics.iterative_depth | Format integer depth as "<n> steps". |
| analysisSummary.modelDrift | analysis_summary_engine | runtime_metrics.model_drift_pct | Format drift percent as string with "%" suffix. |
| analysisSummary.latency | analysis_summary_engine | runtime_metrics.latency_ms | Format latency as "<ms>ms". |
| analysisSummary.insightTitle, analysisSummary.insightImplication, analysisSummary.userIntent | analysis_summary_engine | macro, distribution, personas, causal, policyLab, scenarios | Generate deterministic summary strings from section-level outcomes. |
| macro.insightTitle, macro.insightImplication, macro.contextBridge, macro.userIntent | macro_engine | canonical_policy_state, policy_features | Generate deterministic macro narratives from macro outputs. |
| macro.currentMacroTarget | macro_engine | canonical_policy_state, macro coefficients | Compute modeled growth target and format numeric string. |
| macro.fiscalYearBaseline | macro_engine | baseline tables | Lookup fiscal baseline and format currency string. |
| macro.wowDelta | macro_engine | current and prior macro snapshots | Compute week-over-week delta and format signed percent string. |
| macro.sectors | macro_engine | sector model outputs | Emit non-empty sector array. |
| macro.sectors[].name, macro.sectors[].subtitle, macro.sectors[].value, macro.sectors[].delta | macro_engine | sector model outputs | Map each sector record to required typed fields. |
| macro.sideMetrics | macro_engine | macro diagnostics | Emit non-empty side metrics array. |
| macro.sideMetrics[].label, macro.sideMetrics[].value, macro.sideMetrics[].unit, macro.sideMetrics[].note | macro_engine | macro diagnostics | Map each diagnostic metric to required typed fields. |
| macro.activeSimulations | macro_engine | run registry | Emit non-empty active simulation array. |
| macro.activeSimulations[].name, macro.activeSimulations[].status | macro_engine | run registry | Map each run registry row to required fields. |
| distribution.insightTitle, distribution.insightImplication, distribution.contextBridge, distribution.userIntent | distribution_engine | macro, canonical_policy_state | Generate deterministic distribution narratives. |
| distribution.segments | distribution_engine | distribution model outputs | Emit non-empty segment array. |
| distribution.segments[].id, distribution.segments[].segmentLabel, distribution.segments[].name, distribution.segments[].delta, distribution.segments[].description, distribution.segments[].netImpact | distribution_engine | distribution model outputs | Map each segment row to required fields with formatted deltas. |
| distribution.ledger | distribution_engine | policy effect decomposition | Emit non-empty ledger array. |
| distribution.ledger[].name, distribution.ledger[].delta | distribution_engine | policy effect decomposition | Map each decomposition row to required fields. |
| distribution.giniDelta | distribution_engine | inequality model output | Compute and format Gini delta string. |
| distribution.methodologyNote | distribution_engine | model metadata | Emit deterministic method note string. |
| personas.insightTitle, personas.insightImplication, personas.contextBridge, personas.userIntent, personas.description | persona_engine | macro, distribution, canonical_policy_state | Generate persona section narratives and descriptor. |
| personas.personas | persona_engine | persona catalog, modeled impacts | Emit non-empty persona array. |
| personas.personas[].id, personas.personas[].name, personas.personas[].sector, personas.personas[].description, personas.personas[].netImpact, personas.personas[].tag, personas.personas[].tagType, personas.personas[].breakdown | persona_engine | persona catalog, modeled impacts | Map persona rows to required identity, impact, and breakdown object. |
| personas.personas[].breakdown.taxAdjustments, personas.personas[].breakdown.costOfLiving, personas.personas[].breakdown.rebateCredit | persona_engine | impact decomposition per persona | Map decomposition components to required string fields. |
| causal.insightTitle, causal.insightImplication, causal.contextBridge, causal.userIntent | causal_engine | canonical_policy_state, macro, distribution, personas | Generate deterministic causal section narratives. |
| causal.nodes | causal_engine | causal graph builder | Emit non-empty nodes array. |
| causal.nodes[].id, causal.nodes[].type, causal.nodes[].position, causal.nodes[].data | causal_engine | causal graph builder | Emit each node with required structural objects. |
| causal.nodes[].position.x, causal.nodes[].position.y | causal_engine | graph layout engine | Emit numeric coordinates from layout output. |
| causal.nodes[].data.label, causal.nodes[].data.sublabel | causal_engine | node metadata builder | Emit label metadata per node. |
| causal.edges | causal_engine | causal graph builder | Emit non-empty edges array. |
| causal.edges[].id, causal.edges[].source, causal.edges[].target, causal.edges[].type | causal_engine | causal graph builder | Emit required linkage fields for each edge. |
| causal.diagnostic | causal_engine | causal inference diagnostics | Emit required diagnostic object. |
| causal.diagnostic.selectedVariable | causal_engine | diagnostic selector | Select top variable by contribution score. |
| causal.diagnostic.primaryDriver, causal.diagnostic.downstreamOutcome | causal_engine | ranked causal effects | Emit required objects for strongest driver and downstream outcome. |
| causal.diagnostic.primaryDriver.name, causal.diagnostic.primaryDriver.value, causal.diagnostic.primaryDriver.label | causal_engine | ranked causal effects | Map primary driver tuple to required fields. |
| causal.diagnostic.downstreamOutcome.name, causal.diagnostic.downstreamOutcome.value, causal.diagnostic.downstreamOutcome.label | causal_engine | ranked downstream effects | Map downstream tuple to required fields. |
| causal.diagnostic.explanation | causal_engine | explanation generator inputs | Emit deterministic explanation string from effect chain. |
| policyLab.insightTitle, policyLab.insightImplication, policyLab.contextBridge, policyLab.userIntent | policy_lab_engine | macro, distribution, causal | Generate deterministic policy lab narratives. |
| policyLab.simulationStatus | policy_lab_engine | run status | Emit normalized status string. |
| policyLab.deltaMetrics | policy_lab_engine | optimization deltas | Emit non-empty delta metrics array. |
| policyLab.deltaMetrics[].label, policyLab.deltaMetrics[].value, policyLab.deltaMetrics[].unit, policyLab.deltaMetrics[].note, policyLab.deltaMetrics[].trend | policy_lab_engine | optimization deltas | Map each delta metric to required fields with typed trend. |
| policyLab.refinements | policy_lab_engine | optimizer recommendations | Emit non-empty refinement array. |
| policyLab.refinements[].name, policyLab.refinements[].priority, policyLab.refinements[].progress | policy_lab_engine | optimizer recommendations | Map each recommendation to required fields. |
| policyLab.comparisonMatrix | policy_lab_engine | scenario matrix precompute | Emit non-empty comparison matrix array. |
| policyLab.comparisonMatrix[].metric, policyLab.comparisonMatrix[].statusQuo, policyLab.comparisonMatrix[].simX, policyLab.comparisonMatrix[].simY, policyLab.comparisonMatrix[].variance, policyLab.comparisonMatrix[].varType | policy_lab_engine | scenario matrix precompute | Map each matrix row to required fields. |
| policyLab.confidence | policy_lab_engine | uncertainty model | Format confidence string with "%" suffix. |
| policyLab.stochasticDrift | policy_lab_engine | uncertainty model | Format drift string with "%" suffix. |
| scenarios.title, scenarios.insightImplication, scenarios.contextBridge, scenarios.userIntent, scenarios.description | scenario_engine | macro, distribution, personas, causal, policyLab | Generate deterministic scenario narratives and description. |
| scenarios.step, scenarios.stepLabel | scenario_engine | pipeline constants | Emit fixed step metadata strings. |
| scenarios.metrics | scenario_engine | scenario comparator | Emit non-empty metrics array. |
| scenarios.metrics[].name, scenarios.metrics[].baseline, scenarios.metrics[].reformA, scenarios.metrics[].reformADelta, scenarios.metrics[].reformB, scenarios.metrics[].reformBDelta, scenarios.metrics[].reformAType, scenarios.metrics[].reformBType | scenario_engine | scenario comparator | Map each comparison metric row to required fields. |
| scenarios.tradeoffData | scenario_engine | tradeoff model | Emit non-empty tradeoff data array. |
| scenarios.tradeoffData[].name, scenarios.tradeoffData[].growth, scenarios.tradeoffData[].debt | scenario_engine | tradeoff model | Map each tradeoff point to required fields. |
| scenarios.verdict | scenario_engine | verdict evaluator | Emit required verdict object. |
| scenarios.verdict.summary, scenarios.verdict.detail | scenario_engine | verdict evaluator | Map verdict outputs to required summary/detail strings. |
| scenarios.reformALabel, scenarios.reformBLabel | scenario_engine | scenario metadata | Emit normalized reform labels. |

Optional field lineage:
- causal.edges[].animated: causal_engine, derived from edge dynamics flag.
- policyLab.deltaMetrics[].type: policy_lab_engine, emitted only for flagged metrics.
- scenarios.metrics[].sub: scenario_engine, emitted only when metric subtitle exists.

## 4. Pipeline Orchestrator

Signature:
```python
def simulate(policy: dict) -> dict:
    ...
```

Execution sequence:
```python
def simulate(policy: dict) -> dict:
    run_id = generate_run_id()
    timestamp_utc = now_utc_iso()
    model_config = load_model_config()
    contract_schema = load_contract_schema()

    ingested = policy_ingestion(
        policy=policy,
        run_id=run_id,
        timestamp_utc=timestamp_utc,
        model_config=model_config
    )
    canonical_policy_state = ingested["canonical_policy_state"]
    policy_features = ingested["policy_features"]

    macro_obj = macro_engine(
        canonical_policy_state=canonical_policy_state,
        policy_features=policy_features,
        macro_coefficients=model_config["macro_coefficients"]
    )["macro"]

    distribution_obj = distribution_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution_coefficients=model_config["distribution_coefficients"]
    )["distribution"]

    personas_obj = persona_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution=distribution_obj,
        persona_catalog=model_config["persona_catalog"]
    )["personas"]

    causal_obj = causal_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution=distribution_obj,
        personas=personas_obj,
        causal_rules=model_config["causal_rules"]
    )["causal"]

    policy_lab_obj = policy_lab_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution=distribution_obj,
        causal=causal_obj,
        optimization_params=model_config["optimization_params"]
    )["policyLab"]

    scenarios_obj = scenario_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution=distribution_obj,
        personas=personas_obj,
        causal=causal_obj,
        policyLab=policy_lab_obj,
        scenario_params=model_config["scenario_params"]
    )["scenarios"]

    runtime_metrics = collect_runtime_metrics()

    analysis_summary_obj = analysis_summary_engine(
        macro=macro_obj,
        distribution=distribution_obj,
        personas=personas_obj,
        causal=causal_obj,
        policyLab=policy_lab_obj,
        scenarios=scenarios_obj,
        runtime_metrics=runtime_metrics
    )["analysisSummary"]

    response = response_assembler(
        analysisSummary=analysis_summary_obj,
        macro=macro_obj,
        distribution=distribution_obj,
        personas=personas_obj,
        causal=causal_obj,
        policyLab=policy_lab_obj,
        scenarios=scenarios_obj,
        contract_schema=contract_schema
    )

    validate_contract_or_raise(response, contract_schema)

    return response
```

Final response assembly order:
1. analysisSummary
2. macro
3. distribution
4. personas
5. causal
6. policyLab
7. scenarios

Validation checkpoint:
- Execute strict schema and structural validation immediately before return.
- Reject response if any required field path is missing or any additional property exists.

## 5. Validation and Failure Rules

Validation checks:
- Validate top-level required keys exactly: analysisSummary, macro, distribution, personas, causal, policyLab, scenarios.
- Validate additionalProperties=false at every object level in schema.
- Validate all required nested object keys.
- Validate required array presence and minItems >= 1.
- Validate required array item keys for:
  - macro.sectors[]
  - macro.sideMetrics[]
  - macro.activeSimulations[]
  - distribution.segments[]
  - distribution.ledger[]
  - personas.personas[]
  - personas.personas[].breakdown
  - causal.nodes[]
  - causal.nodes[].position
  - causal.nodes[].data
  - causal.edges[]
  - causal.diagnostic
  - causal.diagnostic.primaryDriver
  - causal.diagnostic.downstreamOutcome
  - policyLab.deltaMetrics[]
  - policyLab.refinements[]
  - policyLab.comparisonMatrix[]
  - scenarios.metrics[]
  - scenarios.tradeoffData[]
  - scenarios.verdict
- Validate type correctness for each contract path according to schema.
- Validate optionality constraints exactly:
  - causal.edges[].animated optional
  - policyLab.deltaMetrics[].type optional
  - scenarios.metrics[].sub optional
  - all other contract fields required

Failure behavior:
- If a module cannot produce one or more required output fields, raise ModuleOutputError(module_name, missing_paths).
- If type mismatches exist, raise ModuleTypeError(module_name, invalid_paths).
- If response assembly detects missing required sections, raise AssemblyError(missing_sections).
- If final contract validation fails, raise ContractValidationError(missing_paths, extra_paths, type_errors).
- On any raised error, do not return partial SimulationResponse.
- Return a pipeline failure at transport level (non-success status) with structured error metadata:
  - errorCode
  - module
  - missingPaths
  - invalidPaths
  - message
- Partial payloads are disallowed for simulate(policy: dict) success return.
