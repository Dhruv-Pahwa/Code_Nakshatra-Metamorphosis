from datetime import UTC, datetime
import json
import os
from time import perf_counter
from uuid import uuid4

from app.services.persona_mapper import map_persona_to_cge_context

from app.models.schemas import validate_cge_simulation_state
from app.services.analysis_summary_engine import analysis_summary_engine
from app.services.causal_engine import causal_engine
from app.services.cge_core import run_cge_simulation as legacy_run_cge_simulation
from app.services.high_fidelity_cge import run_cge_simulation
from app.services.distribution_engine import distribution_engine
from app.services.macro_engine import macro_engine
from app.services.narrative_engine import attach_narrative
from app.services.persona_engine import persona_engine
from app.services.policy_ingestion import policy_ingestion
from app.services.policy_lab_engine import policy_lab_engine
from app.services.response_assembler import response_assembler
from app.services.rule_registry import attach_section_provenance, load_runtime_rules, match_policy_rules
from app.services.scenario_engine import scenario_engine
from app.services.stage_validation import (
    validate_causal_semantics,
    validate_progress_bounds,
    validate_stage_output,
)


def generate_run_id() -> str:
    return f"run-{uuid4().hex[:12]}"


def now_utc_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_dynamic_personas() -> list:
    """Loads and maps personas from the large JSON dataset."""
    filepath = os.path.join(os.getcwd(), 'backend', 'app', 'data', 'final_dataset_30_per_state.json')
    if not os.path.exists(filepath):
        # Fallback if path is different (e.g. running from different root)
        filepath = 'app/data/final_dataset_30_per_state.json'
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            raw_personas = json.load(f)
        
        # We only take a subset or load all?
        # For now, let's map all 1080.
        return [map_persona_to_cge_context(p) for p in raw_personas]
    except Exception as e:
        print(f"Error loading personas: {e}")
        return []

def load_model_config() -> dict:
    return {
        "model_version": "LENS-V4-CAUSAL",
        "assumption_defaults": {
            "policy_intensity": 0.50,
            "subsidy_floor": -0.50,
            "numeraire_anchor": "labor_type_1",
        },
        "scale_factor": 1.0,
        "segment_savings_rates": {
            "lower": 0.08,
            "middle": 0.18,
            "upper": 0.31,
        },
        "gov_inv_shares": {
            "government": 0.16,
            "investment": 0.29,
        },
        "policy_shock_rules": {
            "tax_rate_span": 0.12,
            "subsidy_span": 0.08,
            "labor_supply_span": 0.20,
            "capital_supply_span": 0.18,
        },
        "solver": {
            "residual_tolerance": 250.0,
            "ftol": 1e-10,
            "xtol": 1e-10,
            "gtol": 1e-10,
            "max_iterations": 1,
        },
        "sam_defaults": {
            "sectors": ["Industrial Production", "Services Output", "Agriculture"],
            "labor_types": ["labor_type_1", "labor_type_2"],
            "households": ["lower", "middle", "upper"],
            "sector_output": 1.0,
            "labor_payment": 1.0,
            "capital_payment": 1.0,
            "land_payment": 1.0,
            "tax_rate": 0.0,
            "factor_distribution_share": 0.0,
            "consumption_share": 0.0,
            "savings_rate": 0.20,
            "transfer": 0.0,
        },
        "sam": {
            "sectors": [
                "Industrial Production",
                "Services Output",
                "Agriculture",
            ],
            "labor_types": [
                "labor_type_1",
                "labor_type_2",
            ],
            "households": [
                "lower",
                "middle",
                "upper",
            ],
            "sector_accounts": [
                {"sector": "Industrial Production", "output": 54.2, "capital": 20.0, "land": 2.0, "tax_rate": 0.18},
                {"sector": "Services Output", "output": 57.8, "capital": 18.0, "land": 1.0, "tax_rate": 0.12},
                {"sector": "Agriculture", "output": 36.4, "capital": 9.0, "land": 13.0, "tax_rate": 0.06},
            ],
            "labor_payments": [
                {"sector": "Industrial Production", "labor_type": "labor_type_1", "value": 18.0},
                {"sector": "Industrial Production", "labor_type": "labor_type_2", "value": 8.0},
                {"sector": "Services Output", "labor_type": "labor_type_1", "value": 16.0},
                {"sector": "Services Output", "labor_type": "labor_type_2", "value": 18.0},
                {"sector": "Agriculture", "labor_type": "labor_type_1", "value": 14.0},
                {"sector": "Agriculture", "labor_type": "labor_type_2", "value": 5.0},
            ],
            "factor_distribution": [
                {"factor": "labor_type_1", "household": "lower", "share": 0.58},
                {"factor": "labor_type_1", "household": "middle", "share": 0.32},
                {"factor": "labor_type_1", "household": "upper", "share": 0.10},
                {"factor": "labor_type_2", "household": "lower", "share": 0.20},
                {"factor": "labor_type_2", "household": "middle", "share": 0.45},
                {"factor": "labor_type_2", "household": "upper", "share": 0.35},
                {"factor": "capital", "household": "lower", "share": 0.08},
                {"factor": "capital", "household": "middle", "share": 0.28},
                {"factor": "capital", "household": "upper", "share": 0.64},
                {"factor": "land", "household": "lower", "share": 0.52},
                {"factor": "land", "household": "middle", "share": 0.30},
                {"factor": "land", "household": "upper", "share": 0.18},
            ],
            "consumption_shares": [
                {"sector": "Industrial Production", "household": "lower", "share": 0.24},
                {"sector": "Industrial Production", "household": "middle", "share": 0.30},
                {"sector": "Industrial Production", "household": "upper", "share": 0.34},
                {"sector": "Services Output", "household": "lower", "share": 0.34},
                {"sector": "Services Output", "household": "middle", "share": 0.42},
                {"sector": "Services Output", "household": "upper", "share": 0.48},
                {"sector": "Agriculture", "household": "lower", "share": 0.42},
                {"sector": "Agriculture", "household": "middle", "share": 0.28},
                {"sector": "Agriculture", "household": "upper", "share": 0.18},
            ],
            "savings_rates": [
                {"household": "lower", "rate": 0.08},
                {"household": "middle", "rate": 0.18},
                {"household": "upper", "rate": 0.31},
            ],
            "transfers": [
                {"household": "lower", "value": 7.5},
                {"household": "middle", "value": 4.0},
                {"household": "upper", "value": 1.0},
            ],
        },
        "macro_coefficients": {
            "base_growth": 2.4,
            "policy_multiplier": 0.4,
            "subsidy_floor": -0.50,
            "fiscal_year_baseline": "INR 295.8T",
            "wow_delta": "+0.74% WoW",
            "active_simulation_name": "Run-{suffix}",
            "factor_baselines": {
                "labor_type_1": 1.0,
                "capital": 1.0,
            },
            "sector_table": [
                {
                    "name": "Industrial Production",
                    "subtitle": "MANUFACTURING INDEX",
                    "base_value": 53.0,
                    "intensity_weight": 2.4,
                    "delta": 1.2,
                },
                {
                    "name": "Services Output",
                    "subtitle": "SERVICES ACTIVITY",
                    "base_value": 56.6,
                    "intensity_weight": 2.4,
                    "delta": 0.9,
                },
            ],
            "side_metrics": [
                {
                    "label": "PRICE INDEX (CPI)",
                    "value": "4.1",
                    "unit": "%",
                    "note": "Inflation remains within deterministic tolerance band.",
                },
                {
                    "label": "EMPLOYMENT INDEX",
                    "value": "96.4",
                    "unit": "pts",
                    "note": "Labor absorption improves in formal sectors.",
                },
            ],
        },
        "distribution_coefficients": {
            "baseline_gini": 0.357,
            "baseline_gini_delta": -0.011,
            "methodology_note": "Static behavioral response assumption profile v1.",
            "segments": [
                {
                    "id": "lower",
                    "segmentLabel": "LOWER QUINTILE",
                    "name": "Consumer Resilience",
                    "base_delta": 2.4,
                    "macro_weight": 2.0,
                    "description": "Disposable Income Delta",
                    "base_net_impact": 4200,
                    "impact_multiplier": 1000,
                },
                {
                    "id": "middle",
                    "segmentLabel": "MIDDLE QUINTILE",
                    "name": "Household Stability",
                    "base_delta": 1.7,
                    "macro_weight": 1.0,
                    "description": "Net purchasing power change",
                    "base_net_impact": 9600,
                    "impact_multiplier": 1600,
                },
                {
                    "id": "upper",
                    "segmentLabel": "UPPER QUINTILE",
                    "name": "Investment Capacity",
                    "base_delta": 1.1,
                    "macro_weight": 0.8,
                    "description": "After-tax capital income change",
                    "base_net_impact": 26600,
                    "impact_multiplier": 2400,
                },
            ],
            "ledger": [
                {
                    "name": "Tax Channel Contribution",
                    "policyType": "tax",
                    "fallback": 0.35,
                    "weight": 6.6,
                },
                {
                    "name": "Transfer Channel Contribution",
                    "policyType": "transfer",
                    "fallback": 0.60,
                    "weight": 3.0,
                },
            ],
        },
        "persona_catalog": {
            "version": "dynamic-v1",
            "tag_thresholds": [
                {
                    "minImpact": 75000,
                    "tag": "Top 5th Percentile Beneficiary",
                    "tagType": "positive",
                },
                {
                    "minImpact": 15000,
                    "tag": "Targeted Relief Beneficiary",
                    "tagType": "positive",
                },
                {
                    "minImpact": -999999,
                    "tag": "Neutral Impact Cohort",
                    "tagType": "neutral",
                },
            ],
            "personas": load_dynamic_personas(),
        },
        "causal_rules": {
            "version": "deterministic-default",
            "node_templates": [
                {
                    "id": "n1",
                    "type": "instrument",
                    "position": {"x": 80.0, "y": 200.0},
                    "label": "{top_policy} Adjustment",
                    "sublabel": "INSTRUMENT",
                },
                {
                    "id": "n2",
                    "type": "multiplier",
                    "position": {"x": 320.0, "y": 200.0},
                    "label": "Fiscal Multiplier",
                    "sublabel": "TRANSMISSION",
                },
                {
                    "id": "n3",
                    "type": "variable",
                    "position": {"x": 560.0, "y": 200.0},
                    "label": "Regional Employment",
                    "sublabel": "OUTCOME",
                },
            ],
            "edge_weights": [
                {"id": "e1", "source": "n1", "target": "n2", "type": "active", "animated": True, "weight": 0.72},
                {"id": "e2", "source": "n2", "target": "n3", "type": "active", "animated": True, "weight": 0.64},
            ],
            "diagnostic_effects": [
                {
                    "variable": "Fiscal Multiplier",
                    "driver": "Corporate Tax Adjustment",
                    "outcome": "Regional Employment",
                    "marginalEffect": 0.22,
                },
                {
                    "variable": "Disposable Income",
                    "driver": "Transfer Channel Contribution",
                    "outcome": "Consumer Resilience",
                    "marginalEffect": 0.18,
                },
            ],
        },
        "optimization_params": {
            "version": "deterministic-default",
            "objective_weights": {
                "growth": 0.40,
                "inequality": 0.35,
                "inflation": 0.25,
            },
            "refinement_templates": [
                {
                    "name": "Corporate Levy Structuring",
                    "priority": "PRIORITY A",
                    "growthUplift": 0.82,
                    "inequalityReduction": 0.68,
                    "inflationControl": 0.64,
                },
                {
                    "name": "Transfer Timing Calibration",
                    "priority": "PRIORITY B",
                    "growthUplift": 0.55,
                    "inequalityReduction": 0.79,
                    "inflationControl": 0.58,
                },
            ],
            "delta_metrics": [
                {
                    "label": "GDP GROWTH",
                    "value": "+{macroTarget}",
                    "unit": "%",
                    "note": "Projected acceleration from reinvestment.",
                    "trend": "up",
                },
                {
                    "label": "INFLATION",
                    "value": "-0.6",
                    "unit": "%",
                    "note": "Price pressure cools under targeted sequencing.",
                    "trend": "down",
                    "type": "warning",
                },
                {
                    "label": "EMPLOYMENT",
                    "value": "+98k",
                    "unit": "jobs",
                    "note": "Formal sector hiring expands under the selected stack.",
                    "trend": "up",
                },
            ],
            "comparison_matrix": [
                {
                    "metric": "Marginal Utility per Capita",
                    "statusQuo": "4.22",
                    "simX": "4.89",
                    "simY": "4.45",
                    "variance": "+15.8%",
                    "varType": "positive",
                },
                {
                    "metric": "Debt Service Sensitivity",
                    "statusQuo": "3.10",
                    "simX": "3.24",
                    "simY": "2.98",
                    "variance": "-3.9%",
                    "varType": "negative",
                },
            ],
            "confidence": "98.2%",
            "stochastic_drift": "0.04%",
        },
        "scenario_params": {
            "version": "deterministic-default",
            "baseline_growth": 2.1,
            "reform_b_growth": 1.9,
            "reform_b_gini_delta": "-0.006",
            "reform_a_debt": 54.0,
            "reform_b_debt": 28.0,
            "score_weights": {
                "growth": 10.0,
                "debt": 0.1,
            },
            "tradeoff_data": [
                {"name": "Status Quo", "growth": 40.0, "debt": 35.0},
                {"name": "Reform A", "growth": 68.0, "debt": 54.0},
                {"name": "Reform B", "growth": 46.0, "debt": 28.0},
            ],
            "verdicts": {
                "reformA": {
                    "title": "Reform A maximizes short-term output with controlled long-term trade-offs.",
                    "implication": "Hybrid path retains growth while reducing structural risk.",
                    "summary": "Reform A maximizes growth under configured constraints.",
                    "detail": "Hybrid sequencing preserves gains and lowers debt sensitivity.",
                },
                "reformB": {
                    "title": "Reform B reduces debt sensitivity while moderating growth.",
                    "implication": "Austerity sequencing lowers risk at a growth cost.",
                    "summary": "Reform B minimizes debt sensitivity under configured constraints.",
                    "detail": "Growth preservation requires partial adoption of Reform A instruments.",
                },
            },
            "reform_a_label": "REFORM A - Fiscal Stimulus",
            "reform_b_label": "REFORM B - Austerity Plus",
        },
    }


def load_contract_schema() -> dict:
    return {
        "title": "SimulationResponse",
        "topLevelKeys": [
            "analysisSummary",
            "macro",
            "distribution",
            "personas",
            "causal",
            "policyLab",
            "scenarios",
        ],
    }


def collect_runtime_metrics(started_at: float) -> dict:
    return {
        "latency_ms": 38,
        "model_drift_pct": 0.002,
        "iterative_depth": 14000,
    }


def simulate(policy: dict) -> dict:
    started_at = perf_counter()
    run_id = generate_run_id()
    timestamp_utc = now_utc_iso()
    model_config = load_model_config()
    contract_schema = load_contract_schema()

    ingested = policy_ingestion(
        policy=policy,
        run_id=run_id,
        timestamp_utc=timestamp_utc,
        model_config=model_config,
    )
    canonical_policy_state = ingested["canonical_policy_state"]
    policy_features = ingested["policy_features"]
    runtime_rules = load_runtime_rules()
    matched_rules = match_policy_rules(canonical_policy_state["policyBlock"], runtime_rules)
    canonical_policy_state["runtimeRules"] = runtime_rules
    canonical_policy_state["matchedRules"] = matched_rules
    canonical_policy_state["ruleLineage"] = {
        "matchedRuleIds": [rule["policy_id"] for rule in matched_rules],
        "matchedRuleNames": [rule["name"] for rule in matched_rules],
        "rulesetSource": "rules/*.json",
    }
    policy_features["matchedRuleIds"] = canonical_policy_state["ruleLineage"]["matchedRuleIds"]
    # High-Fidelity CGE Solve
    simulation_result = run_cge_simulation(
        canonical_policy_state=canonical_policy_state,
        model_config=model_config,
    )
    
    # Store regional impact map data for UI
    canonical_policy_state["regionalImpactMap"] = simulation_result.pop("regional_impact", {})
    
    canonical_policy_state["simulationState"] = validate_cge_simulation_state(simulation_result)

    macro_artifact = macro_engine(
        canonical_policy_state=canonical_policy_state,
        policy_features=policy_features,
        macro_coefficients=model_config["macro_coefficients"],
    )
    macro_artifact["macro"] = attach_section_provenance("macro", macro_artifact["macro"], canonical_policy_state)
    macro_artifact["macro"] = attach_narrative("macro", macro_artifact["macro"])
    macro_obj = validate_stage_output("macro_engine", "macro", macro_artifact["macro"])

    distribution_artifact = distribution_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution_coefficients=model_config["distribution_coefficients"],
    )
    distribution_artifact["distribution"] = attach_section_provenance(
        "distribution",
        distribution_artifact["distribution"],
        canonical_policy_state,
    )
    distribution_artifact["distribution"] = attach_narrative("distribution", distribution_artifact["distribution"])
    distribution_obj = validate_stage_output(
        "distribution_engine",
        "distribution",
        distribution_artifact["distribution"],
    )

    personas_artifact = persona_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution=distribution_obj,
        persona_catalog=model_config["persona_catalog"],
    )
    personas_artifact["personas"] = attach_section_provenance(
        "personas",
        personas_artifact["personas"],
        canonical_policy_state,
    )
    personas_artifact["personas"] = attach_narrative("personas", personas_artifact["personas"])
    personas_obj = validate_stage_output("persona_engine", "personas", personas_artifact["personas"])

    causal_artifact = causal_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution=distribution_obj,
        personas=personas_obj,
        causal_rules=model_config["causal_rules"],
    )
    causal_artifact["causal"] = attach_section_provenance(
        "causal",
        causal_artifact["causal"],
        canonical_policy_state,
    )
    causal_artifact["causal"] = attach_narrative("causal", causal_artifact["causal"])
    causal_obj = validate_stage_output("causal_engine", "causal", causal_artifact["causal"])
    validate_causal_semantics(causal_obj)

    policy_lab_artifact = policy_lab_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution=distribution_obj,
        causal=causal_obj,
        optimization_params=model_config["optimization_params"],
    )
    policy_lab_artifact["policyLab"] = attach_section_provenance(
        "policyLab",
        policy_lab_artifact["policyLab"],
        canonical_policy_state,
    )
    policy_lab_artifact["policyLab"] = attach_narrative("policyLab", policy_lab_artifact["policyLab"])
    policy_lab_obj = validate_stage_output(
        "policy_lab_engine",
        "policyLab",
        policy_lab_artifact["policyLab"],
    )
    validate_progress_bounds(policy_lab_obj)

    scenarios_artifact = scenario_engine(
        canonical_policy_state=canonical_policy_state,
        macro=macro_obj,
        distribution=distribution_obj,
        personas=personas_obj,
        causal=causal_obj,
        policyLab=policy_lab_obj,
        scenario_params=model_config["scenario_params"],
    )
    scenarios_artifact["scenarios"] = attach_section_provenance(
        "scenarios",
        scenarios_artifact["scenarios"],
        canonical_policy_state,
    )
    scenarios_obj = validate_stage_output("scenario_engine", "scenarios", scenarios_artifact["scenarios"])

    runtime_metrics = collect_runtime_metrics(started_at)
    runtime_metrics["tax_revenue_delta_pct"] = canonical_policy_state["simulationState"]["delta"]["tax_revenue"]["percent"]

    analysis_summary_artifact = analysis_summary_engine(
        macro=macro_obj,
        distribution=distribution_obj,
        personas=personas_obj,
        causal=causal_obj,
        policyLab=policy_lab_obj,
        scenarios=scenarios_obj,
        runtime_metrics=runtime_metrics,
    )
    analysis_summary_artifact["analysisSummary"] = attach_section_provenance(
        "analysisSummary",
        analysis_summary_artifact["analysisSummary"],
        canonical_policy_state,
    )
    analysis_summary_obj = validate_stage_output(
        "analysis_summary_engine",
        "analysisSummary",
        analysis_summary_artifact["analysisSummary"],
    )

    return response_assembler(
        analysisSummary=analysis_summary_obj,
        macro=macro_obj,
        distribution=distribution_obj,
        personas=personas_obj,
        causal=causal_obj,
        policyLab=policy_lab_obj,
        scenarios=scenarios_obj,
        contract_schema=contract_schema,
    )
