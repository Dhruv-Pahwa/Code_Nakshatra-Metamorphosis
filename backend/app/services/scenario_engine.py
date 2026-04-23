from app.services.formatters import parse_signed_number
from app.services.rule_registry import active_rule_for, lineage_for


def scenario_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution: dict,
    personas: dict,
    causal: dict,
    policyLab: dict,
    scenario_params: dict
) -> dict:
    simulation_state = canonical_policy_state.get("simulationState", {})
    active_rule = active_rule_for(canonical_policy_state)
    rule_macro = active_rule.get("macro_effects", {}) if active_rule else {}
    deltas = simulation_state.get("delta", {})
    macro_target = parse_signed_number(macro.get("currentMacroTarget", "2.4"), 2.4)
    baseline_growth = scenario_params["baseline_growth"]
    if rule_macro:
        reform_a_delta = float(rule_macro.get("gdp_change_pct", 0.0))
        macro_target = baseline_growth + reform_a_delta
        reform_b_growth = max(0.0, baseline_growth + (reform_a_delta * 0.45))
    else:
        reform_b_growth = max(0.0, baseline_growth + (float(deltas.get("gdp", {}).get("percent", 0.0)) * 0.45))
        reform_a_delta = macro_target - baseline_growth
    reform_b_delta = reform_b_growth - baseline_growth
    gini_delta = parse_signed_number(distribution.get("giniDelta", "-0.014"))
    reform_b_gini_delta = round(gini_delta * 0.6, 3) if active_rule else parse_signed_number(scenario_params["reform_b_gini_delta"])
    # Determine per-metric winners
    gdp_winner = "A" if reform_a_delta >= reform_b_delta else ("B" if reform_b_delta > reform_a_delta else "baseline")
    gini_winner = "A" if abs(gini_delta) >= abs(reform_b_gini_delta) else ("B" if abs(reform_b_gini_delta) > abs(gini_delta) else "baseline")

    metrics = [
        {
            "name": "GDP Growth Rate",
            "sub": "Annualized percentage",
            "baseline": f"{baseline_growth:.1f}%",
            "reformA": f"{macro_target:.1f}%",
            "reformADelta": f"{'up' if reform_a_delta >= 0 else 'down'}{abs(reform_a_delta):.1f}%",
            "reformB": f"{reform_b_growth:.1f}%",
            "reformBDelta": f"{'up' if reform_b_delta >= 0 else 'down'}{abs(reform_b_delta):.1f}%",
            "reformAType": "positive" if reform_a_delta >= 0 else "negative",
            "reformBType": "positive" if reform_b_delta >= 0 else "negative",
            "winner": gdp_winner,
            "rationale": f"{'Reform A' if gdp_winner == 'A' else 'Reform B' if gdp_winner == 'B' else 'Both'} delivers {'stronger' if gdp_winner != 'baseline' else 'similar'} growth impact",
        },
        {
            "name": "Gini Delta",
            "sub": "Inequality movement",
            "baseline": "0.000",
            "reformA": distribution.get("giniDelta", "-0.014"),
            "reformADelta": f"down{abs(parse_signed_number(distribution.get('giniDelta', '-0.014'))):.3f}",
            "reformB": f"{reform_b_gini_delta:+.3f}",
            "reformBDelta": f"{'down' if reform_b_gini_delta <= 0 else 'up'}{abs(reform_b_gini_delta):.3f}",
            "reformAType": "positive" if gini_delta <= 0 else "negative",
            "reformBType": "positive" if reform_b_gini_delta <= 0 else "negative",
            "winner": gini_winner,
            "rationale": f"{'Reform A' if gini_winner == 'A' else 'Reform B' if gini_winner == 'B' else 'Both'} achieves {'greater' if gini_winner != 'baseline' else 'similar'} inequality reduction",
        },
    ]
    reform_scores = {
        "reformA": macro_target * scenario_params["score_weights"]["growth"]
        - (scenario_params["reform_a_debt"] + max(float(deltas.get("tax_revenue", {}).get("percent", 0.0)), 0.0)) * scenario_params["score_weights"]["debt"],
        "reformB": reform_b_growth * scenario_params["score_weights"]["growth"]
        - scenario_params["reform_b_debt"] * scenario_params["score_weights"]["debt"],
    }
    winner = "reformA" if reform_scores["reformA"] >= reform_scores["reformB"] else "reformB"
    verdict = scenario_params["verdicts"][winner]
    suggestion = {}
    if active_rule:
        suggestion = active_rule.get("policylab_suggestions", [{}])[0] if active_rule.get("policylab_suggestions") else {}
        verdict = {
            "title": f"{active_rule['name']} has a measurable mitigation path.",
            "implication": suggestion.get("tradeoff", "Rule-linked mitigation changes growth, equity, and fiscal tradeoffs."),
            "summary": suggestion.get("outcome_improvement", f"{active_rule['name']} remains the active scenario."),
            "detail": suggestion.get("policy_delta", "No additional policy delta supplied by the matched rule."),
        }

    return {
        "scenarios": {
            "title": verdict["title"],
            "insightImplication": verdict["implication"],
            "contextBridge": (
                "Scenario values inherit the active rule effects, while CGE outputs remain the baseline reference."
                if active_rule
                else "Scenarios are generated from the same deterministic policy stack."
            ),
            "userIntent": "Compare scenarios and commit optimal path.",
            "description": "Comparative macro trajectory analysis.",
            "step": "07",
            "stepLabel": "FINAL REVIEW",
            "metrics": metrics,
            "tradeoffData": [
                scenario_params["tradeoff_data"][0],
                {
                    "name": "Reform A",
                    "growth": round(40.0 + max(macro_target, 0.0) * 10, 1),
                    "debt": round(scenario_params["reform_a_debt"] + max(float(deltas.get("tax_revenue", {}).get("percent", 0.0)), 0.0), 1),
                },
                {
                    "name": "Reform B",
                    "growth": round(40.0 + max(reform_b_growth, 0.0) * 6, 1),
                    "debt": scenario_params["reform_b_debt"],
                },
            ],
            "verdict": {
                "summary": verdict["summary"],
                "detail": verdict["detail"],
            },
            "reformALabel": active_rule["name"] if active_rule else scenario_params["reform_a_label"],
            "reformBLabel": (
                suggestion.get("variant_name", scenario_params["reform_b_label"])
                if active_rule
                else scenario_params["reform_b_label"]
            ),
        },
        "internal": {
            "baseline": {"scenarios": {"metrics": {"GDP Growth Rate": f"{baseline_growth:.1f}%"}}},
            "scenario": {"scenarios": {"winner": winner, "metrics": metrics}},
            "delta": {"scenarios": {"reformADelta": f"{reform_a_delta:+.1f}"}},
        },
        "lineage": lineage_for("scenarios"),
    }
