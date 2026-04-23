from app.services.formatters import parse_signed_number
from app.services.rule_registry import active_rule_for, lineage_for


def _causal_graph_from_rule(rule: dict) -> tuple[list[dict], list[dict]]:
    chain = rule.get("causal_chain", [])
    if not isinstance(chain, list) or not chain:
        return [], []

    nodes = []
    edges = []
    first_step = str(chain[0].get("step") or "Policy Shock")
    nodes.append({
        "id": "rule-node-0",
        "type": "instrument",
        "position": {"x": 80.0, "y": 220.0},
        "data": {"label": first_step, "sublabel": "POLICY SHOCK"},
    })

    for index, item in enumerate(chain):
        effect = str(item.get("effect") or f"Effect {index + 1}")
        node_id = f"rule-node-{index + 1}"
        nodes.append({
            "id": node_id,
            "type": "variable" if index == len(chain) - 1 else "multiplier",
            "position": {"x": 280.0 + (index * 220.0), "y": 160.0 if index % 2 else 260.0},
            "data": {
                "label": effect,
                "sublabel": "OUTCOME" if index == len(chain) - 1 else "TRANSMISSION",
            },
        })
        edges.append({
            "id": f"rule-edge-{index + 1}",
            "source": f"rule-node-{index}",
            "target": node_id,
            "type": "active",
            "label": str(item.get("magnitude") or "linked"),
            "magnitude": str(item.get("magnitude") or "medium"),
            "confidence": str(item.get("confidence") or "medium"),
            "animated": True,
        })

    return nodes, edges


def causal_engine(
    canonical_policy_state: dict,
    macro: dict,
    distribution: dict,
    personas: dict,
    causal_rules: dict
) -> dict:
    policy_vector = canonical_policy_state.get("effectivePolicyVector", {})
    active_rule = active_rule_for(canonical_policy_state)
    simulation_state = canonical_policy_state.get("simulationState", {})
    deltas = simulation_state.get("delta", {})
    top_policy = max(policy_vector.items(), key=lambda item: (abs(item[1]), item[0]))[0]
    top_persona = max(
        personas["personas"],
        key=lambda persona: parse_signed_number(persona["netImpact"]),
    )
    nodes, edges = _causal_graph_from_rule(active_rule) if active_rule else ([], [])
    if not nodes:
        node_templates = causal_rules["node_templates"]
        nodes = [
            {
                "id": template["id"],
                "type": template["type"],
                "position": template["position"],
                "data": {
                    "label": template["label"].format(
                        top_policy=top_policy.replace("_", " ").title(),
                        top_sector=macro["sectors"][0]["name"],
                        top_persona=top_persona["name"],
                    ),
                    "sublabel": template["sublabel"],
                },
            }
            for template in node_templates
        ]
        edges = [
            {
                "id": edge["id"],
                "source": edge["source"],
                "target": edge["target"],
                "type": edge["type"],
                "animated": edge["animated"],
            }
            for edge in causal_rules["edge_weights"]
        ]
    solved_effects = []
    gdp_effect = float(deltas.get("gdp", {}).get("percent", 0.0)) / 10
    real_income_effects = deltas.get("real_incomes", [])
    income_effect = (
        sum(item["percent"] for item in real_income_effects) / max(len(real_income_effects), 1) / 10
        if real_income_effects
        else 0.0
    )
    for effect in causal_rules["diagnostic_effects"]:
        marginal_effect = gdp_effect if effect["variable"] == "Fiscal Multiplier" else income_effect
        solved_effects.append({**effect, "marginalEffect": marginal_effect})
    ranked_effects = sorted(
        solved_effects,
        key=lambda item: (-abs(item["marginalEffect"]), item["variable"]),
    )
    selected = ranked_effects[0]
    if active_rule and active_rule.get("causal_chain"):
        chain = active_rule["causal_chain"]
        selected = {
            "variable": str(chain[0].get("step", active_rule["name"])),
            "driver": active_rule["name"],
            "outcome": str(chain[-1].get("effect", "Final outcome")),
            "marginalEffect": parse_signed_number(macro.get("wowDelta"), 0.0),
        }
    confidence = "94%" if parse_signed_number(distribution["giniDelta"]) <= 0 else "88%"
    if active_rule and active_rule.get("causal_chain"):
        confidence = str(active_rule["causal_chain"][-1].get("confidence", "medium")).title()

    return {
        "causal": {
            "insightTitle": (
                f"{active_rule['name']} propagates through {len(active_rule.get('causal_chain', []))} rule-linked causal steps."
                if active_rule
                else f"{top_policy.replace('_', ' ').title()} channel drives growth and employment through fiscal transmission."
            ),
            "insightImplication": (
                "Causal nodes and edges are generated from the matched rule chain."
                if active_rule
                else "Employment elasticity channel dominates downstream outcomes."
            ),
            "contextBridge": (
                "Policy -> macro -> distribution -> persona outputs are explained by the same matched rule chain."
                if active_rule
                else "Persona impacts are consistent with dominant causal path weights."
            ),
            "userIntent": "Trace causal chain and strongest channels.",
            "nodes": nodes,
            "edges": edges,
            "diagnostic": {
                "selectedVariable": selected["variable"],
                "primaryDriver": {
                    "name": selected["driver"],
                    "value": f"{selected['marginalEffect']:+.2f}",
                    "label": "Marginal Impact",
                },
                "downstreamOutcome": {
                    "name": selected["outcome"],
                    "value": confidence,
                    "label": "Statistical Confidence",
                },
                "explanation": (
                    f"Rule {active_rule['policy_id']} provides the ordered causal chain and edge confidence labels."
                    if active_rule
                    else "Policy shock propagates from instrument to transmission to employment outcome under fixed causal weights."
                ),
            },
        },
        "internal": {
            "baseline": {"causal": {"selectedVariable": "Status Quo"}},
            "scenario": {"causal": {"selectedVariable": selected["variable"]}},
            "delta": {"causal": {"marginalEffect": f"{selected['marginalEffect']:+.2f}"}},
        },
        "lineage": lineage_for("causal"),
    }
