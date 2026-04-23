from app.services.formatters import clamp, signed_percent
from app.services.rule_registry import active_rule_for, lineage_for


SECTOR_NAME_TO_RULE_KEY = {
    "Industrial Production": "manufacturing",
    "Services Output": "services",
    "Agriculture": "agriculture",
}


def _average_rule_real_income_delta(rule: dict | None) -> float:
    if not rule:
        return 0.0
    effects = rule.get("distribution_effects", {})
    if not isinstance(effects, dict) or not effects:
        return 0.0
    values = [
        float(item.get("real_income_change_pct", 0.0))
        for item in effects.values()
        if isinstance(item, dict)
    ]
    return sum(values) / max(len(values), 1)


def macro_engine(
    canonical_policy_state: dict,
    policy_features: dict,
    macro_coefficients: dict
) -> dict:
    simulation_state = canonical_policy_state.get("simulationState", {})
    active_rule = active_rule_for(canonical_policy_state)
    rule_macro = active_rule.get("macro_effects", {}) if active_rule else {}
    baseline = simulation_state.get("baseline", {})
    scenario = simulation_state.get("scenario", {})
    deltas = simulation_state.get("delta", {})
    parameters = simulation_state.get("parameters", {})
    intensity_score = float(policy_features.get("intensityScore", 0.5))
    base_growth = float(macro_coefficients.get("base_growth", 2.1))
    multiplier = float(macro_coefficients.get("policy_multiplier", 0.6))
    gdp_delta_pct = float(deltas.get("gdp", {}).get("percent", 0.0))
    if rule_macro:
        gdp_delta_pct = float(rule_macro.get("gdp_change_pct", gdp_delta_pct))
    current_target = round(base_growth + gdp_delta_pct, 1)
    policy_vector = canonical_policy_state.get("effectivePolicyVector", {})
    subsidy_floor = canonical_policy_state.get("policyConstraints", {}).get(
        "subsidyFloor",
        macro_coefficients.get("subsidy_floor", -0.5),
    )
    tax_effective_by_sector = {
        sector["name"]: round(
            clamp(
                policy_vector.get("tax", 0.5) - policy_vector.get("subsidy", 0.0),
                subsidy_floor,
                1.0,
            ),
            3,
        )
        for sector in macro_coefficients["sector_table"]
    }
    top_policy_ids = [
        key for key in policy_vector.keys()
        if key != "baseline"
    ][:2]
    run_name = macro_coefficients["active_simulation_name"].format(
        suffix="-".join(top_policy_ids) if top_policy_ids else "baseline"
    )
    sector_names = parameters.get("sectors", [sector["name"] for sector in macro_coefficients["sector_table"]])
    value_added = scenario.get("value_added", [])
    output_deltas = deltas.get("value_added", [])
    sectors = []
    for index, sector_name in enumerate(sector_names):
        configured = macro_coefficients["sector_table"][index % len(macro_coefficients["sector_table"])]
        rule_sector_key = SECTOR_NAME_TO_RULE_KEY.get(sector_name, sector_name.lower())
        rule_sector_delta = (
            rule_macro.get("sectoral_output_pct", {}).get(rule_sector_key)
            if isinstance(rule_macro.get("sectoral_output_pct"), dict)
            else None
        )
        sectors.append(
            {
                "name": sector_name,
                "subtitle": configured["subtitle"],
                "value": round(value_added[index], 1) if index < len(value_added) else round(configured["base_value"], 1),
                "delta": signed_percent(
                    float(rule_sector_delta)
                    if rule_sector_delta is not None
                    else output_deltas[index]["percent"],
                    1,
                ) if index < len(output_deltas) or rule_sector_delta is not None else signed_percent(0.0, 1),
            }
        )
    avg_cpi = sum(scenario.get("cpi", [1.0])) / max(len(scenario.get("cpi", [1.0])), 1)
    cpi_delta_pct = float(rule_macro.get("cpi_change_pct", 0.0)) if rule_macro else 0.0
    avg_real_income_delta = sum(item["percent"] for item in deltas.get("real_incomes", [{"percent": 0.0}])) / max(
        len(deltas.get("real_incomes", [{"percent": 0.0}])),
        1,
    )
    if active_rule:
        avg_real_income_delta = _average_rule_real_income_delta(active_rule)
    side_metrics = [
        {
            "label": "CPI CHANGE",
            "value": f"{cpi_delta_pct:+.1f}" if rule_macro else f"{avg_cpi:.2f}",
            "unit": "%" if rule_macro else "idx",
            "note": (
                f"From matched rule {active_rule['policy_id']}."
                if active_rule
                else "CPI is computed from solved household consumption baskets."
            ),
        },
        {
            "label": "REAL INCOME DELTA",
            "value": f"{avg_real_income_delta:+.2f}",
            "unit": "%",
            "note": "Average real income movement across calibrated household groups.",
        },
    ]
    baseline_macro = {
        "currentMacroTarget": f"{base_growth:.1f}",
        "sectorValues": {
            sector_name: baseline.get("value_added", [])[index]
            for index, sector_name in enumerate(sector_names)
            if index < len(baseline.get("value_added", []))
        },
    }
    scenario_macro = {
        "currentMacroTarget": f"{current_target:.1f}",
        "sectorValues": {sector["name"]: sector["value"] for sector in sectors},
    }
    delta_macro = {
        "growthDelta": round(gdp_delta_pct, 3),
        "taxEffectiveBySector": tax_effective_by_sector,
        "solverDiagnostics": simulation_state.get("diagnostics", {}),
        "activeRule": active_rule.get("policy_id") if active_rule else None,
    }
    if active_rule:
        macro_title = f"{active_rule['name']} shifts GDP by {gdp_delta_pct:+.1f} pp to {current_target:.1f}%."
        macro_implication = f"CPI moves {cpi_delta_pct:+.1f}% while sector effects follow the matched rule registry."
        context_bridge = f"Rule {active_rule['policy_id']} is the deterministic propagation source; CGE solve remains the baseline reference."
    else:
        macro_title = f"GDP stabilizes at +{current_target}%."
        macro_implication = "Industrial output leads trajectory."
        context_bridge = "Policy vector is normalized and transmitted through deterministic macro coefficients."

    return {
        "macro": {
            "insightTitle": macro_title,
            "insightImplication": macro_implication,
            "contextBridge": context_bridge,
            "userIntent": "Review aggregate economic outcomes.",
            "currentMacroTarget": f"{current_target:.1f}",
            "fiscalYearBaseline": f"INR {baseline.get('gdp', 295.8):.1f}T",
            "wowDelta": f"{gdp_delta_pct:+.2f}% solved",
            "sectors": sectors,
            "sideMetrics": side_metrics,
            "activeSimulations": [
                {"name": run_name, "status": "RUNNING"}
            ],
            "regionalImpactMap": canonical_policy_state.get("regionalImpactMap", {})
        },
        "internal": {
            "baseline": {"macro": baseline_macro},
            "scenario": {"macro": scenario_macro},
            "delta": {"macro": delta_macro},
        },
        "lineage": lineage_for("macro"),
    }
