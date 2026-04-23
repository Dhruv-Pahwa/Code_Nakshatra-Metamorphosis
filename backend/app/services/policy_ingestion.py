from app.services.formatters import clamp, coerce_float
from app.services.rule_registry import lineage_for


POLICY_BLOCK_VERSION = "policyblock-v1"


def _is_number(value) -> bool:
    return isinstance(value, int | float) and not isinstance(value, bool)


def _normalize_assumptions(assumptions) -> list:
    if not isinstance(assumptions, list):
        return []
    return [item for item in assumptions if isinstance(item, str | dict)]


def _normalize_secondary_params(params) -> list[dict]:
    if not isinstance(params, list):
        return []

    normalized = []
    for item in params:
        if not isinstance(item, dict):
            continue
        normalized.append({
            "key": str(item.get("key") or item.get("label") or "").strip(),
            "label": str(item.get("label") or item.get("key") or "").strip(),
            "value": item.get("value"),
            "unit": item.get("unit") or "",
        })
    return normalized


def _normalize_shock(item: dict, index: int, model_config: dict) -> tuple[dict, float, str, bool]:
    policy_type = str(item.get("policyType") or item.get("type") or "").strip()
    used_default = False
    if not policy_type:
        policy_type = f"policy_{index + 1}"
        used_default = True

    default_slider = model_config["assumption_defaults"]["policy_intensity"] * 100
    slider_value = item.get("sliderValue")
    if not _is_number(slider_value):
        intensity = item.get("intensity")
        if _is_number(intensity):
            slider_value = clamp(float(intensity), 0, 1) * 100
        else:
            slider_value = default_slider
            used_default = True

    normalized_slider = clamp(coerce_float(slider_value, default_slider), 0, 100)
    normalized_intensity = normalized_slider / 100

    # Resolve direction — prefer signedIntensity if provided, otherwise use direction field
    primary_param = item.get("primaryParam") if isinstance(item.get("primaryParam"), dict) else {}
    direction_str = str(primary_param.get("direction") or "POSITIVE").upper()
    direction_sign = -1 if direction_str == "NEGATIVE" else 1

    # signedIntensity takes precedence if the frontend computed it
    signed_intensity_raw = item.get("signedIntensity")
    if _is_number(signed_intensity_raw):
        signed_intensity = float(signed_intensity_raw)
    else:
        signed_intensity = round(normalized_intensity * direction_sign, 4)

    shock = {
        "id": str(item.get("id") or f"shock-{index + 1}"),
        "name": str(item.get("name") or policy_type.replace("_", " ").title()),
        "policyType": policy_type,
        "status": str(item.get("status") or "STAGING"),
        "sliderValue": normalized_slider,
        "intensity": round(normalized_intensity, 4),
        "signedIntensity": round(signed_intensity, 4),
        "direction": direction_str,
        "primaryParam": {
            "label": str(primary_param.get("label") or ""),
            "value": primary_param.get("value"),
            "unit": primary_param.get("unit") or "",
            "direction": direction_str,
        },
        "secondaryParams": _normalize_secondary_params(item.get("secondaryParams")),
        "metadata": item.get("metadata") if isinstance(item.get("metadata"), dict) else {},
    }
    return shock, signed_intensity, policy_type, used_default


def _legacy_policy_to_block(policy: dict, run_id: str, timestamp_utc: str) -> dict:
    policies = policy.get("policies", [])
    if not isinstance(policies, list):
        policies = []

    return {
        "id": str(policy.get("id") or f"policyblock-{run_id}"),
        "name": str(policy.get("name") or "Policy Studio Run"),
        "version": str(policy.get("version") or POLICY_BLOCK_VERSION),
        "createdAt": str(policy.get("createdAt") or timestamp_utc),
        "runId": str(policy.get("runId") or run_id),
        "shocks": policies,
        "metadata": {
            "source": "legacy-policies-payload",
            "policyCount": len(policies),
            **(policy.get("metadata") if isinstance(policy.get("metadata"), dict) else {}),
        },
        "assumptions": _normalize_assumptions(policy.get("assumptions")),
    }


def _extract_policy_block(policy: dict, run_id: str, timestamp_utc: str) -> dict:
    incoming = policy.get("policyBlock")
    if isinstance(incoming, dict):
        block = dict(incoming)
        block["id"] = str(block.get("id") or f"policyblock-{run_id}")
        block["name"] = str(block.get("name") or "Policy Studio Run")
        block["version"] = str(block.get("version") or POLICY_BLOCK_VERSION)
        block["createdAt"] = str(block.get("createdAt") or timestamp_utc)
        block["runId"] = str(block.get("runId") or run_id)
        block["metadata"] = block.get("metadata") if isinstance(block.get("metadata"), dict) else {}
        block["assumptions"] = _normalize_assumptions(block.get("assumptions"))
        block["shocks"] = block.get("shocks") if isinstance(block.get("shocks"), list) else []
        return block

    return _legacy_policy_to_block(policy, run_id, timestamp_utc)


def policy_ingestion(
    policy: dict,
    run_id: str,
    timestamp_utc: str,
    model_config: dict
) -> dict:
    policy_block = _extract_policy_block(policy, run_id, timestamp_utc)
    incoming_shocks = policy_block.get("shocks", [])
    effective_policy_vector: dict[str, float] = {}
    slider_values: list[float] = []
    assumptions_applied: list[str] = []
    policy_constraints = {
        "subsidyFloor": model_config["assumption_defaults"]["subsidy_floor"],
        "numeraireAnchor": model_config["assumption_defaults"]["numeraire_anchor"],
        "baselineScaleSource": "model_config.scale_factor",
        "savingsRateSource": "model_config.segment_savings_rates",
        "governmentInvestmentShareSource": "model_config.gov_inv_shares",
    }

    normalized_shocks: list[dict] = []
    for index, item in enumerate(incoming_shocks):
        if not isinstance(item, dict):
            assumptions_applied.append("ASSUMPTION_RULE_A01")
            continue
        shock, normalized_value, policy_type, used_default = _normalize_shock(item, index, model_config)
        if used_default:
            assumptions_applied.append("ASSUMPTION_RULE_A01")
        normalized_shocks.append(shock)
        effective_policy_vector[policy_type] = normalized_value
        slider_values.append(normalized_value)

    if not effective_policy_vector:
        default_intensity = model_config["assumption_defaults"]["policy_intensity"]
        effective_policy_vector = {"baseline": default_intensity}
        slider_values = [default_intensity]
        assumptions_applied.append("ASSUMPTION_RULE_A01")
        normalized_shocks = [{
            "id": "shock-baseline",
            "name": "Baseline Policy",
            "policyType": "baseline",
            "status": "ACTIVE",
            "sliderValue": default_intensity * 100,
            "intensity": round(default_intensity, 4),
            "primaryParam": {"label": "Baseline intensity", "value": default_intensity * 100, "unit": "%"},
            "secondaryParams": [],
            "metadata": {"generated": True},
        }]

    intensity_score = sum(slider_values) / len(slider_values)
    canonical_policy_block = {
        **policy_block,
        "shocks": normalized_shocks,
        "metadata": {
            **policy_block.get("metadata", {}),
            "policyCount": len(normalized_shocks),
            "effectivePolicyTypes": list(effective_policy_vector.keys()),
        },
        "assumptions": [
            *policy_block.get("assumptions", []),
            *sorted(set(assumptions_applied)),
        ],
    }

    return {
        "canonical_policy_state": {
            "id": canonical_policy_block["id"],
            "name": canonical_policy_block["name"],
            "version": canonical_policy_block["version"],
            "createdAt": canonical_policy_block["createdAt"],
            "runId": canonical_policy_block["runId"],
            "timestampUtc": canonical_policy_block["createdAt"],
            "shocks": canonical_policy_block["shocks"],
            "metadata": canonical_policy_block["metadata"],
            "assumptions": canonical_policy_block["assumptions"],
            "policyBlock": canonical_policy_block,
            "effectivePolicyVector": effective_policy_vector,
            "modelVersion": model_config.get("model_version", "LENS-V4-CAUSAL"),
            "policyConstraints": policy_constraints,
        },
        "policy_features": {
            "policyCount": len(normalized_shocks) if normalized_shocks else 1,
            "intensityScore": round(intensity_score, 3),
            "policyArtifactId": canonical_policy_block["id"],
            "policyArtifactVersion": canonical_policy_block["version"],
        },
        "internal": {
            "assumptionsApplied": sorted(set(assumptions_applied)),
            "policyConstraints": policy_constraints,
            "policyBlock": canonical_policy_block,
        },
        "lineage": lineage_for("macro"),
    }
