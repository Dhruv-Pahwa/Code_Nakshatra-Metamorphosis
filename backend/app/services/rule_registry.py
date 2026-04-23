import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.models.schemas import PipelineError


RULE_REGISTRY = {
    "ASSUMPTION_RULE_A01": {
        "module": "macro_engine",
        "precedence": 1,
        "stage": "policy->macro",
    },
    "R_POL_MACRO_001": {
        "module": "macro_engine",
        "precedence": 10,
        "stage": "policy->macro",
    },
    "R_POL_MACRO_002": {
        "module": "macro_engine",
        "precedence": 20,
        "stage": "policy->macro",
    },
    "R_MAC_DIST_001": {
        "module": "distribution_engine",
        "precedence": 30,
        "stage": "macro->distribution",
    },
    "R_MAC_DIST_002": {
        "module": "distribution_engine",
        "precedence": 40,
        "stage": "macro->distribution",
    },
    "R_DIST_PER_001": {
        "module": "persona_engine",
        "precedence": 50,
        "stage": "distribution->personas",
    },
    "R_DIST_PER_002": {
        "module": "persona_engine",
        "precedence": 60,
        "stage": "distribution->personas",
    },
    "R_PER_CAUS_001": {
        "module": "causal_engine",
        "precedence": 70,
        "stage": "personas->causal",
    },
    "R_PER_CAUS_002": {
        "module": "causal_engine",
        "precedence": 80,
        "stage": "personas->causal",
    },
    "R_CAUS_LAB_001": {
        "module": "policy_lab_engine",
        "precedence": 90,
        "stage": "causal->policyLab",
    },
    "R_CAUS_LAB_002": {
        "module": "policy_lab_engine",
        "precedence": 100,
        "stage": "causal->policyLab",
    },
    "R_LAB_SCEN_001": {
        "module": "scenario_engine",
        "precedence": 110,
        "stage": "policyLab->scenarios",
    },
    "R_LAB_SCEN_002": {
        "module": "scenario_engine",
        "precedence": 120,
        "stage": "policyLab->scenarios",
    },
    "R_SCEN_SUM_001": {
        "module": "analysis_summary_engine",
        "precedence": 130,
        "stage": "scenarios->analysisSummary",
    },
    "R_SCEN_SUM_002": {
        "module": "analysis_summary_engine",
        "precedence": 140,
        "stage": "scenarios->analysisSummary",
    },
}


FIELD_LINEAGE = {
    "macro": ["ASSUMPTION_RULE_A01", "R_POL_MACRO_001", "R_POL_MACRO_002"],
    "distribution": ["R_MAC_DIST_001", "R_MAC_DIST_002"],
    "personas": ["R_DIST_PER_001", "R_DIST_PER_002"],
    "causal": ["R_PER_CAUS_001", "R_PER_CAUS_002"],
    "policyLab": ["R_CAUS_LAB_001", "R_CAUS_LAB_002"],
    "scenarios": ["R_LAB_SCEN_001", "R_LAB_SCEN_002"],
    "analysisSummary": ["R_SCEN_SUM_001", "R_SCEN_SUM_002"],
}


RULES_DIR = Path(__file__).resolve().parents[3] / "rules"


class RuleRegistryError(PipelineError):
    error_code = "RULE_REGISTRY_ERROR"
    module = "rule_registry"


class RuntimeRule(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    policy_id: str
    name: str
    version: str
    description: str = ""
    trigger_conditions: list[str] = Field(default_factory=list)
    macro_effects: dict[str, Any] = Field(default_factory=dict)
    distribution_effects: dict[str, Any] = Field(default_factory=dict)
    causal_chain: list[dict[str, Any]] = Field(default_factory=list)
    policylab_suggestions: list[dict[str, Any]] = Field(default_factory=list)
    provenance: dict[str, Any] = Field(default_factory=dict)
    cge_ready: bool = True
    cge_placeholder: dict[str, Any] = Field(default_factory=dict)
    source_file: str


def lineage_for(section_name: str) -> dict[str, list[str]]:
    return {section_name: FIELD_LINEAGE[section_name]}


def _version_from_policy_id(policy_id: str) -> str:
    parts = policy_id.rsplit("_", 1)
    if len(parts) == 2 and parts[1].startswith("v") and parts[1][1:].isdigit():
        return parts[1]
    return "v1"


def _default_trigger_conditions(rule: dict[str, Any]) -> list[str]:
    policy_id = str(rule.get("policy_id", "")).lower()
    name = str(rule.get("name", "")).lower()
    haystack = f"{policy_id} {name}"
    triggers: list[str] = []
    if "carbon" in haystack or "fuel" in haystack or "energy" in haystack:
        triggers.append("tax")
    if "transfer" in haystack or "benefit" in haystack or "cash" in haystack:
        triggers.append("transfer")
    if "subsidy" in haystack:
        triggers.append("subsidy")
    return triggers or ["baseline"]


def _normalize_rule(raw_rule: dict[str, Any], source_file: str) -> dict[str, Any]:
    policy_id = str(raw_rule.get("policy_id") or Path(source_file).stem)
    return {
        "policy_id": policy_id,
        "name": str(raw_rule.get("name") or policy_id.replace("_", " ").title()),
        "version": str(raw_rule.get("version") or _version_from_policy_id(policy_id)),
        "description": str(raw_rule.get("description") or ""),
        "trigger_conditions": [
            str(item).strip().lower()
            for item in raw_rule.get("trigger_conditions", _default_trigger_conditions(raw_rule))
            if str(item).strip()
        ],
        "macro_effects": raw_rule.get("macro_effects") if isinstance(raw_rule.get("macro_effects"), dict) else {},
        "distribution_effects": raw_rule.get("distribution_effects")
        if isinstance(raw_rule.get("distribution_effects"), dict)
        else {},
        "causal_chain": raw_rule.get("causal_chain") if isinstance(raw_rule.get("causal_chain"), list) else [],
        "policylab_suggestions": raw_rule.get("policylab_suggestions")
        if isinstance(raw_rule.get("policylab_suggestions"), list)
        else [],
        "provenance": raw_rule.get("provenance") if isinstance(raw_rule.get("provenance"), dict) else {},
        "cge_ready": bool(raw_rule.get("cge_ready", True)),
        "cge_placeholder": raw_rule.get("cge_placeholder")
        if isinstance(raw_rule.get("cge_placeholder"), dict)
        else {},
        "source_file": source_file,
    }


def _serialize_rule(rule: RuntimeRule) -> dict[str, Any]:
    return rule.model_dump()


def _infer_template_type(rule: dict[str, Any]) -> str:
    triggers = {
        str(item).strip().lower()
        for item in rule.get("trigger_conditions", [])
        if str(item).strip()
    }
    name = str(rule.get("name") or "").lower()
    policy_id = str(rule.get("policy_id") or "").lower()
    haystack = f"{name} {policy_id}"

    if "transfer" in triggers or "benefit" in haystack or "cash" in haystack:
        return "transfer"
    if "subsidy" in triggers:
        return "subsidy"
    if "tax" in triggers or any(token in haystack for token in ("carbon", "fuel", "energy")):
        return "tax"
    return "tax"


def _template_tags(rule: dict[str, Any], policy_type: str) -> list[str]:
    tags: list[str] = ["RULE-BACKED", policy_type.upper()]
    name = str(rule.get("name") or "").lower()
    if "carbon" in name:
        tags.append("CLIMATE")
    if "rural" in name:
        tags.append("RURAL")
    if "transfer" in name:
        tags.append("REDISTRIBUTIVE")
    return list(dict.fromkeys(tags))


def build_policy_templates(runtime_rules: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    rules = runtime_rules if runtime_rules is not None else load_runtime_rules()
    templates: list[dict[str, Any]] = []

    for rule in rules:
        triggers = {
            str(item).strip().lower()
            for item in rule.get("trigger_conditions", [])
            if str(item).strip()
        }
        if triggers == {"baseline"}:
            continue

        policy_type = _infer_template_type(rule)
        templates.append({
            "id": str(rule.get("policy_id")),
            "label": str(rule.get("name") or str(rule.get("policy_id"))),
            "description": str(rule.get("description") or ""),
            "type": policy_type,
            "ruleId": str(rule.get("policy_id")),
            "ruleVersion": str(rule.get("version") or "v1"),
            "sourceFile": str(rule.get("source_file") or ""),
            "tags": _template_tags(rule, policy_type),
            "triggerConditions": sorted(triggers),
        })

    templates.sort(key=lambda item: (item["type"], item["label"]))
    return templates


@lru_cache(maxsize=1)
def load_runtime_rules(rules_dir: str | None = None) -> list[dict[str, Any]]:
    base_dir = Path(rules_dir) if rules_dir else RULES_DIR
    if not base_dir.exists():
        raise RuleRegistryError(
            "Runtime rules directory is missing.",
            missing_paths=[str(base_dir)],
        )

    rules: list[dict[str, Any]] = []
    invalid_paths: list[str] = []
    for path in sorted(base_dir.glob("*.json")):
        try:
            raw_rule = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(raw_rule, dict):
                invalid_paths.append(str(path))
                continue
            validated = RuntimeRule.model_validate(_normalize_rule(raw_rule, path.name))
            rules.append(_serialize_rule(validated))
        except (json.JSONDecodeError, ValidationError):
            invalid_paths.append(str(path))

    if invalid_paths:
        raise RuleRegistryError(
            "Runtime rule validation failed.",
            invalid_paths=invalid_paths,
        )

    return rules


def _policy_tokens(policy_block: dict[str, Any]) -> set[str]:
    tokens: set[str] = set()
    shocks = policy_block.get("shocks", [])
    if not isinstance(shocks, list):
        return tokens

    for shock in shocks:
        if not isinstance(shock, dict):
            continue
        for key in ("policyType", "name"):
            value = str(shock.get(key) or "").lower()
            for token in ("tax", "transfer", "subsidy", "carbon", "fuel", "energy", "benefit", "cash"):
                if token in value:
                    tokens.add("transfer" if token in {"benefit", "cash"} else token)
        tags = shock.get("metadata", {}).get("tags", []) if isinstance(shock.get("metadata"), dict) else []
        if isinstance(tags, list):
            for tag in tags:
                tag_text = str(tag).lower()
                for token in ("tax", "transfer", "subsidy", "carbon", "fuel", "energy"):
                    if token in tag_text:
                        tokens.add(token)

    if "carbon" in tokens or "fuel" in tokens or "energy" in tokens:
        tokens.add("tax")
    return tokens


def match_policy_rules(policy_block: dict[str, Any], runtime_rules: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    rules = runtime_rules if runtime_rules is not None else load_runtime_rules()
    tokens = _policy_tokens(policy_block)
    if not tokens:
        tokens = {"baseline"}

    matches = []
    for rule in rules:
        triggers = set(rule.get("trigger_conditions", []))
        if triggers and triggers.issubset(tokens):
            matches.append(rule)

    matches.sort(
        key=lambda item: (
            -len(item.get("trigger_conditions", [])),
            item.get("policy_id", ""),
        )
    )
    return matches


def active_rule_for(canonical_policy_state: dict[str, Any]) -> dict[str, Any] | None:
    matched_rules = canonical_policy_state.get("matchedRules", [])
    if not isinstance(matched_rules, list) or not matched_rules:
        return None
    active_rule = matched_rules[0]
    return active_rule if isinstance(active_rule, dict) else None


def summarize_rule_matches(matched_rules: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [
        {
            "id": rule["policy_id"],
            "name": rule["name"],
            "version": rule["version"],
            "sourceFile": rule["source_file"],
        }
        for rule in matched_rules
    ]


def lineage_ids_for(section_name: str, matched_rules: list[dict[str, Any]] | None = None) -> list[str]:
    ids = [*FIELD_LINEAGE[section_name]]
    ids.extend(rule["policy_id"] for rule in (matched_rules or []))
    return list(dict.fromkeys(ids))


def _leaf_metric_paths(value: Any, prefix: str = "") -> list[str]:
    if isinstance(value, dict):
        paths: list[str] = []
        for key, child in value.items():
            if key == "provenance":
                continue
            child_prefix = f"{prefix}.{key}" if prefix else str(key)
            paths.extend(_leaf_metric_paths(child, child_prefix))
        return paths
    if isinstance(value, list):
        paths = []
        for index, child in enumerate(value):
            child_prefix = f"{prefix}.{index}" if prefix else str(index)
            paths.extend(_leaf_metric_paths(child, child_prefix))
        return paths
    return [prefix] if prefix else []


def section_provenance(section_name: str, section: dict[str, Any], canonical_policy_state: dict[str, Any]) -> dict[str, Any]:
    matched_rules = canonical_policy_state.get("matchedRules", [])
    lineage_ids = lineage_ids_for(section_name, matched_rules)
    confidence_notes = [
        str(rule.get("provenance", {}).get("confidence_note"))
        for rule in matched_rules
        if rule.get("provenance", {}).get("confidence_note")
    ]
    metric_paths = _leaf_metric_paths(section)

    baselines = [
        source
        for rule in matched_rules
        for source in rule.get("provenance", {}).get("baseline_sources", [])
    ]
    key_assumptions = [
        assumption
        for rule in matched_rules
        for assumption in rule.get("provenance", {}).get("key_assumptions", [])
    ]

    return {
        "section": section_name,
        "matchedRules": summarize_rule_matches(matched_rules),
        "lineageIds": lineage_ids,
        "metricLineage": {path: lineage_ids for path in metric_paths},
        "notes": list(dict.fromkeys(confidence_notes)),
        "sourceMetadata": {
            "baselineSources": list(dict.fromkeys(baselines)) if baselines else ["MOSPI / PLFS 2022-23", "NITI Aayog Computations"],
            "footnotes": [
                "Modeled using simplified India-specific CGE calibrations.",
                "Assumes limited inter-state supply chain flexibility.",
                *list(dict.fromkeys(key_assumptions))
            ]
        }
    }


def attach_section_provenance(section_name: str, section: dict[str, Any], canonical_policy_state: dict[str, Any]) -> dict[str, Any]:
    return {
        **section,
        "provenance": section_provenance(section_name, section, canonical_policy_state),
    }
