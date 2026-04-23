import random
from app.services.formatters import inr_total, parse_signed_number
from app.services.rule_registry import active_rule_for, lineage_for


SEGMENT_TO_RULE_GROUP = {
    "lower": "poor",
    "middle": "middle",
    "upper": "rich",
}


def _weighted_rule_effect(item: dict, rule_distribution: dict, key: str) -> float:
    total = 0.0
    for segment_id, weight in item.get("segmentWeights", {}).items():
        rule_group = SEGMENT_TO_RULE_GROUP.get(segment_id, segment_id)
        effect = rule_distribution.get(rule_group, {})
        if isinstance(effect, dict):
            total += float(effect.get(key, 0.0)) * float(weight)
    return total


def _persona_exposure(item: dict) -> float:
    weights = item.get("segmentWeights", {})
    return (
        120000 * float(weights.get("lower", 0.0))
        + 240000 * float(weights.get("middle", 0.0))
        + 520000 * float(weights.get("upper", 0.0))
    )


def persona_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution: dict,
    persona_catalog: dict
) -> dict:
    active_rule = active_rule_for(canonical_policy_state)
    rule_distribution = active_rule.get("distribution_effects", {}) if active_rule else {}
    segment_deltas = {
        segment["id"]: parse_signed_number(segment["delta"])
        for segment in distribution["segments"]
    }
    
    all_personas = persona_catalog["personas"]
    
    # If we have too many personas, we sample them to keep the UI responsive.
    # In a real app, we might filter by a selected region here.
    # For now, let's take a representative sample if > 30.
    if len(all_personas) > 30:
        # Sort by impact or some other metric later, but for now just pick 30
        # Maybe pick 1 from each state? (There are 36 states/UTs)
        # Let's just shuffle and take 30 for now to keep it lean.
        random.seed(42) # Deterministic for same simulation
        persona_pool = random.sample(all_personas, 30)
    else:
        persona_pool = all_personas

    seen_persona_ids: set[str] = set()
    persona_items = []
    
    for item in persona_pool:
        if item["id"] in seen_persona_ids:
            continue
        seen_persona_ids.add(item["id"])
        
        weighted_delta = sum(
            segment_deltas.get(segment_id, 0.0) * weight
            for segment_id, weight in item["segmentWeights"].items()
        )
        
        if active_rule and isinstance(rule_distribution, dict) and rule_distribution:
            exposure = _persona_exposure(item)
            weighted_copc = _weighted_rule_effect(item, rule_distribution, "copc_change_pct")
            weighted_wage = _weighted_rule_effect(item, rule_distribution, "wage_index_change_pct")
            net_impact = exposure * (weighted_delta / 100)
            tax_adjustments = exposure * (weighted_wage / 100)
            cost_of_living = -abs(exposure * (weighted_copc / 100))
            rebate_credit = net_impact - tax_adjustments - cost_of_living
            
            description = (
                f"{item['description']} "
                f"Economic profile: real income {weighted_delta:+.1f}%, "
                f"cost basket {weighted_copc:+.1f}%, wage channel {weighted_wage:+.1f}%."
            )
        else:
            tax_adjustments = item["baseBreakdown"]["taxAdjustments"] + weighted_delta * item["breakdownWeights"]["taxAdjustments"]
            cost_of_living = item["baseBreakdown"]["costOfLiving"] + weighted_delta * item["breakdownWeights"]["costOfLiving"]
            rebate_credit = item["baseBreakdown"]["rebateCredit"] + weighted_delta * item["breakdownWeights"]["rebateCredit"]
            net_impact = tax_adjustments + cost_of_living + rebate_credit
            description = item["description"]
            
        tag = "Neutral Impact Cohort"
        tag_type = "neutral"
        for threshold in persona_catalog["tag_thresholds"]:
            if net_impact >= threshold["minImpact"]:
                tag = threshold["tag"]
                tag_type = threshold["tagType"]
                break
                
        persona_items.append(
            {
                "id": item["id"],
                "name": item["name"],
                "sector": item["sector"],
                "description": description,
                "netImpact": inr_total(net_impact),
                "tag": tag,
                "tagType": tag_type,
                "metadata": item.get("metadata", {}), # Pass through new metadata
                "breakdown": {
                    "taxAdjustments": inr_total(tax_adjustments) + " / yr",
                    "costOfLiving": inr_total(cost_of_living) + " / yr",
                    "rebateCredit": inr_total(rebate_credit) + " / yr",
                },
            }
        )
        
    persona_items.sort(key=lambda persona: parse_signed_number(persona["netImpact"]), reverse=True)
    
    # Calculate spread
    if persona_items:
        spread = parse_signed_number(persona_items[0]["netImpact"]) - parse_signed_number(persona_items[-1]["netImpact"])
    else:
        spread = 0

    baseline_personas = {
        persona["id"]: {
            "netImpact": "INR 0",
        }
        for persona in persona_items
    }

    return {
        "personas": {
            "insightTitle": (
                f"Insights derived for {len(persona_items)} representative personas."
                if active_rule
                else "Regional impacts mapped through segment weights."
            ),
            "insightImplication": (
                "Net impacts reflect localized economic exposure and policy incidence."
                if active_rule
                else "Impact spread varies by state and zone (Urban/Rural)."
            ),
            "contextBridge": (
                "Distribution effects are mapped through detailed persona profiles across all states."
                if active_rule
                else "Segment-level effects are mapped to personas through demographic proxies."
            ),
            "userIntent": "Identify affected demographic cohorts.",
            "description": f"Simulation context mapped to {len(persona_items)} personas. Spread: INR {round(spread)}.",
            "personas": persona_items,
        },
        "internal": {
            "baseline": {"personas": baseline_personas},
            "scenario": {"personas": {persona["id"]: persona["netImpact"] for persona in persona_items}},
            "delta": {"personas": {persona["id"]: persona["netImpact"] for persona in persona_items}},
        },
        "lineage": lineage_for("personas"),
    }
