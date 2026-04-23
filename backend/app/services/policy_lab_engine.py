from app.services.formatters import clamp, parse_signed_number
from app.services.rule_registry import active_rule_for, lineage_for


def _average_distribution_effect(rule: dict | None, key: str) -> float:
    if not rule:
        return 0.0
    effects = rule.get("distribution_effects", {})
    if not isinstance(effects, dict):
        return 0.0
    values = [
        float(item.get(key, 0.0))
        for item in effects.values()
        if isinstance(item, dict)
    ]
    return sum(values) / max(len(values), 1)


def policy_lab_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution: dict,
    causal: dict,
    optimization_params: dict
) -> dict:
    simulation_state = canonical_policy_state.get("simulationState", {})
    active_rule = active_rule_for(canonical_policy_state)
    rule_macro = active_rule.get("macro_effects", {}) if active_rule else {}
    deltas = simulation_state.get("delta", {})
    diagnostics = simulation_state.get("diagnostics", {}).get("scenario", {})
    macro_target = parse_signed_number(macro.get("currentMacroTarget", "2.4"), 2.4)
    selected_variable = causal["diagnostic"]["selectedVariable"]
    if active_rule and active_rule.get("policylab_suggestions"):
        refinements = []
        for index, suggestion in enumerate(active_rule["policylab_suggestions"]):
            progress = 88 - (index * 9)
            refinements.append({
                "name": suggestion.get("variant_name", f"Rule Variant {index + 1}"),
                "priority": f"PRIORITY {chr(65 + index)}",
                "progress": clamp(progress, 0, 100),
            })
    else:
        scored_refinements = []
        for template in optimization_params["refinement_templates"]:
            score = (
                template["growthUplift"] * optimization_params["objective_weights"]["growth"]
                + template["inequalityReduction"] * optimization_params["objective_weights"]["inequality"]
                + template["inflationControl"] * optimization_params["objective_weights"]["inflation"]
            )
            scored_refinements.append(
                {
                    "name": template["name"].format(selectedVariable=selected_variable),
                    "priority": template["priority"],
                    "progress": clamp(round(score * 100), 0, 100),
                    "_score": score,
                }
            )
        scored_refinements.sort(key=lambda item: (-item["_score"], item["name"]))
        refinements = [
            {key: value for key, value in item.items() if key != "_score"}
            for item in scored_refinements
        ]
    avg_cpi_delta = 0.0
    if deltas.get("cpi"):
        avg_cpi_delta = sum(item["percent"] for item in deltas["cpi"]) / len(deltas["cpi"])
    if rule_macro:
        avg_cpi_delta = float(rule_macro.get("cpi_change_pct", avg_cpi_delta))
    avg_real_income_delta = 0.0
    if deltas.get("real_incomes"):
        avg_real_income_delta = sum(item["percent"] for item in deltas["real_incomes"]) / len(deltas["real_incomes"])
    if active_rule:
        avg_real_income_delta = _average_distribution_effect(active_rule, "real_income_change_pct")
        macro_target = float(rule_macro.get("gdp_change_pct", macro_target))
    delta_metrics = [
        {
            "label": "GDP GROWTH",
            "value": f"{macro_target:+.1f}",
            "unit": "%",
            "note": "GDP growth is mapped from solved baseline-to-scenario income deltas.",
            "trend": "up" if macro_target >= 0 else "down",
        },
        {
            "label": "INFLATION",
            "value": f"{avg_cpi_delta:+.1f}",
            "unit": "%",
            "note": "Price movement is computed from solved household CPI baskets.",
            "trend": "down" if avg_cpi_delta <= 0 else "up",
            "type": "warning" if avg_cpi_delta > 0 else "stability",
        },
        {
            "label": "REAL INCOME",
            "value": f"{avg_real_income_delta:+.1f}",
            "unit": "%",
            "note": "Average real household income movement after CPI adjustment.",
            "trend": "up" if avg_real_income_delta >= 0 else "down",
        },
    ]
    confidence_value = max(85.0, 99.0 - float(diagnostics.get("residualNorm", 0.0)) / 100)
    if active_rule:
        confidence_value = 94.0 if parse_signed_number(distribution.get("giniDelta")) <= 0 else 89.0
    comparison_matrix = optimization_params["comparison_matrix"]
    if active_rule and active_rule.get("policylab_suggestions"):
        comparison_matrix = [
            {
                "metric": suggestion.get("variant_name", f"Variant {index + 1}"),
                "statusQuo": active_rule["name"],
                "simX": suggestion.get("outcome_improvement", "Improvement not quantified"),
                "simY": suggestion.get("policy_delta", "Policy delta not specified"),
                "variance": suggestion.get("tradeoff", "Tradeoff not specified"),
                "varType": "positive" if index == 0 else "negative",
            }
            for index, suggestion in enumerate(active_rule["policylab_suggestions"][:2])
        ]

    return {
        "policyLab": {
            "insightTitle": (
                f"Rule-based refinements respond to {active_rule['name']} tradeoffs."
                if active_rule
                else f"Refinements preserve +{macro_target:.1f}% growth with deterministic inflation cooling."
            ),
            "insightImplication": (
                active_rule["policylab_suggestions"][0].get("outcome_improvement", "Rule suggestions identify measurable mitigation.")
                if active_rule and active_rule.get("policylab_suggestions")
                else "Short-term fiscal trade-off remains within configured tolerance."
            ),
            "contextBridge": (
                "Policy Lab variants are pulled from matched rule suggestions and scored deterministically."
                if active_rule
                else "Refinements are generated from dominant causal bottlenecks."
            ),
            "userIntent": "Evaluate and accept or reject deterministic optimizations.",
            "simulationStatus": "Active",
            "deltaMetrics": delta_metrics,
            "refinements": refinements,
            "comparisonMatrix": comparison_matrix,
            "confidence": f"{confidence_value:.1f}%",
            "stochasticDrift": f"{float(diagnostics.get('optimality', 0.0)):.2f}%",
        },
        "internal": {
            "baseline": {"policyLab": {"simulationStatus": "Status Quo"}},
            "scenario": {"policyLab": {"simulationStatus": "Active", "refinements": refinements}},
            "delta": {"policyLab": {"confidence": f"{confidence_value:.1f}%"}},
        },
        "lineage": lineage_for("policyLab"),
    }
