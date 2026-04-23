from app.services.formatters import inr_per_year, parse_signed_number, signed_number, signed_percent
from app.services.rule_registry import active_rule_for, lineage_for


HOUSEHOLD_TO_RULE_GROUP = {
    "lower": "poor",
    "middle": "middle",
    "upper": "rich",
}


def _gini(values: list[float]) -> float:
    sorted_values = sorted(max(float(value), 0.0) for value in values)
    count = len(sorted_values)
    total = sum(sorted_values)
    if count == 0 or total == 0:
        return 0.0
    weighted_sum = sum((index + 1) * value for index, value in enumerate(sorted_values))
    return ((2 * weighted_sum) / (count * total)) - ((count + 1) / count)


def distribution_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution_coefficients: dict
) -> dict:
    simulation_state = canonical_policy_state.get("simulationState", {})
    active_rule = active_rule_for(canonical_policy_state)
    rule_distribution = active_rule.get("distribution_effects", {}) if active_rule else {}
    baseline = simulation_state.get("baseline", {})
    scenario = simulation_state.get("scenario", {})
    deltas = simulation_state.get("delta", {})
    households = simulation_state.get("parameters", {}).get("households", [])
    macro_target = parse_signed_number(macro.get("currentMacroTarget"), 2.4)
    policy_vector = canonical_policy_state.get("effectivePolicyVector", {})
    segments = []
    real_income_deltas = deltas.get("real_incomes", [])
    for index, segment in enumerate(distribution_coefficients["segments"]):
        household_id = households[index] if index < len(households) else segment["id"]
        rule_group = HOUSEHOLD_TO_RULE_GROUP.get(household_id, household_id)
        rule_group_effect = rule_distribution.get(rule_group, {}) if isinstance(rule_distribution, dict) else {}
        solved_delta = (
            float(rule_group_effect.get("real_income_change_pct"))
            if rule_group_effect.get("real_income_change_pct") is not None
            else real_income_deltas[index]["percent"]
            if index < len(real_income_deltas)
            else segment["base_delta"] + macro_target * segment["macro_weight"]
        )
        if rule_group_effect.get("real_income_change_pct") is not None:
            solved_delta = float(rule_group_effect["real_income_change_pct"])
        solved_net_impact = (
            (segment["base_net_impact"] * (solved_delta / 100))
            if rule_group_effect
            else scenario.get("real_incomes", [0.0])[index] - baseline.get("real_incomes", [0.0])[index]
            if index < len(scenario.get("real_incomes", [])) and index < len(baseline.get("real_incomes", []))
            else segment["base_net_impact"] + solved_delta * segment["impact_multiplier"]
        )
        if rule_group_effect:
            solved_net_impact = segment["base_net_impact"] * (solved_delta / 100)
        segments.append(
            {
                "id": household_id,
                "segmentLabel": segment["segmentLabel"],
                "name": segment["name"],
                "delta": signed_number(solved_delta, 1),
                "description": segment["description"],
                "netImpact": inr_per_year(solved_net_impact * 1000),
            }
        )

    if active_rule and isinstance(rule_distribution, dict) and rule_distribution:
        ledger = []
        for group_name, effect in rule_distribution.items():
            if not isinstance(effect, dict):
                continue
            ledger.append({
                "name": f"{group_name.title()} cost-of-living pressure",
                "delta": signed_percent(float(effect.get("copc_change_pct", 0.0)), 1),
            })
            ledger.append({
                "name": f"{group_name.title()} wage channel",
                "delta": signed_percent(float(effect.get("wage_index_change_pct", 0.0)), 1),
            })
        ledger = ledger[:6]
    else:
        ledger = [
            {
                "name": item["name"],
                "delta": signed_percent(policy_vector.get(item["policyType"], item["fallback"]) * item["weight"], 1),
            }
            for item in distribution_coefficients["ledger"]
        ]
    baseline_gini = _gini(baseline.get("real_incomes", [1.0]))
    scenario_gini = _gini(scenario.get("real_incomes", [1.0]))
    gini_delta = round(scenario_gini - baseline_gini, 3)
    if active_rule and len(segments) >= 2:
        poor_delta = parse_signed_number(segments[0]["delta"])
        rich_delta = parse_signed_number(segments[-1]["delta"])
        gini_delta = round((rich_delta - poor_delta) / 100, 3)
    gini_delta_text = f"{gini_delta:+.3f}"
    baseline_distribution = {
        "gini": distribution_coefficients["baseline_gini"],
        "segments": {segment["id"]: 0.0 for segment in segments},
    }
    scenario_distribution = {
        "giniDelta": gini_delta_text,
        "segments": {segment["id"]: segment["delta"] for segment in segments},
    }

    if active_rule:
        title = f"{active_rule['name']} distribution effects are propagated from the rule registry."
        implication = f"Bottom-group real income moves {segments[0]['delta']} while top-group real income moves {segments[-1]['delta']}."
        context_bridge = "Macro rule effects are mapped into income-group real income, cost-of-living, and wage channels."
        methodology = f"Runtime rule propagation using {active_rule['source_file']}; CGE solve retained as baseline reference."
    else:
        title = "Tax and transfer stack is progressive under configured pass-through coefficients."
        implication = f"Gini improves by {gini_delta_text}."
        context_bridge = "Macro expansion translates into deterministic segment-level income deltas."
        methodology = distribution_coefficients["methodology_note"]

    return {
        "distribution": {
            "insightTitle": title,
            "insightImplication": implication,
            "contextBridge": context_bridge,
            "userIntent": "Assess distributional balance.",
            "segments": segments,
            "ledger": ledger,
            "giniDelta": gini_delta_text,
            "methodologyNote": methodology,
        },
        "internal": {
            "baseline": {"distribution": baseline_distribution},
            "scenario": {"distribution": scenario_distribution},
            "delta": {"distribution": {"giniDelta": gini_delta_text}},
        },
        "lineage": lineage_for("distribution"),
    }
