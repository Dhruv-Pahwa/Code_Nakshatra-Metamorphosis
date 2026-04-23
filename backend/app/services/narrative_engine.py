from typing import Any

from app.services.formatters import parse_signed_number


FROZEN_NUMBERS_CONTRACT = (
    "Narrative may only reference values present in frozenNumbers or sourceSnippets. "
    "No generated text may introduce a new numeric value, metric, or causal link."
)


def build_narrative_prompt(section_name: str, computed_inputs: dict[str, Any], task: str) -> str:
    return (
        "You are a policy analyst explaining simulation results to an economist.\n\n"
        "COMPUTED INPUTS (DO NOT CHANGE):\n"
        f"{computed_inputs}\n\n"
        f"TASK: {task}\n"
        f"CONSTRAINT: {FROZEN_NUMBERS_CONTRACT}\n"
        "TONE: Professional, concise, India-context aware.\n"
        f"SECTION: {section_name}"
    )


def _matched_rule_names(section: dict[str, Any]) -> list[str]:
    provenance = section.get("provenance", {})
    rules = provenance.get("matchedRules", []) if isinstance(provenance, dict) else []
    return [str(rule.get("name")) for rule in rules if isinstance(rule, dict) and rule.get("name")]


def _source_snippets(section_name: str, section: dict[str, Any], frozen_numbers: dict[str, Any]) -> list[str]:
    snippets = []
    rules = _matched_rule_names(section)
    if rules:
        snippets.append(f"Matched rule: {rules[0]}")
    for key, value in frozen_numbers.items():
        if isinstance(value, list):
            if value:
                snippets.append(f"{key}: {', '.join(str(item) for item in value[:3])}")
        else:
            snippets.append(f"{key}: {value}")
    snippets.append(f"Section: {section_name}")
    return snippets[:6]


def _macro_payload(section: dict[str, Any]) -> tuple[dict[str, Any], list[str], str]:
    sectors = section.get("sectors", [])
    sector_snippets = [
        f"{item.get('name')} {item.get('delta')}"
        for item in sectors
        if isinstance(item, dict)
    ]
    cpi_metric = next(
        (item for item in section.get("sideMetrics", []) if "CPI" in str(item.get("label", "")).upper()),
        {},
    )
    frozen = {
        "gdpTarget": f"{section.get('currentMacroTarget')}%",
        "wowDelta": section.get("wowDelta"),
        "cpi": f"{cpi_metric.get('value')}{cpi_metric.get('unit', '')}" if cpi_metric else "N/A",
        "sectorDeltas": sector_snippets,
    }
    drivers = [
        f"GDP target is {frozen['gdpTarget']} because the active rule contributes {section.get('wowDelta')}.",
        f"Sector propagation is grounded in {', '.join(sector_snippets[:3])}.",
        f"CPI reference is {frozen['cpi']}.",
    ]
    summary = f"GDP is {frozen['gdpTarget']} with rule-linked movement of {section.get('wowDelta')}."
    return frozen, drivers, summary


def _distribution_payload(section: dict[str, Any]) -> tuple[dict[str, Any], list[str], str]:
    segments = section.get("segments", [])
    segment_snippets = [
        f"{item.get('segmentLabel')} {item.get('delta')} ({item.get('netImpact')})"
        for item in segments
        if isinstance(item, dict)
    ]
    frozen = {
        "giniDelta": section.get("giniDelta"),
        "segments": segment_snippets,
        "methodology": section.get("methodologyNote"),
    }
    drivers = [
        f"Gini movement is {section.get('giniDelta')} from the rule-linked segment spread.",
        f"Segment impacts are {', '.join(segment_snippets[:3])}.",
    ]
    summary = f"Distribution changes are anchored to Gini {section.get('giniDelta')} and segment deltas {', '.join(segment_snippets[:2])}."
    return frozen, drivers, summary


def _personas_payload(section: dict[str, Any]) -> tuple[dict[str, Any], list[str], str]:
    personas = section.get("personas", [])
    persona_snippets = [
        f"{item.get('name')} {item.get('netImpact')}"
        for item in personas
        if isinstance(item, dict)
    ]
    frozen = {
        "personaImpacts": persona_snippets,
        "description": section.get("description"),
    }
    drivers = [
        f"Persona impacts are computed from distribution weights: {', '.join(persona_snippets[:3])}.",
        f"Persona section spread note: {section.get('description')}.",
    ]
    summary = f"Persona outcomes stay grounded in computed net impacts: {', '.join(persona_snippets[:2])}."
    return frozen, drivers, summary


def _causal_payload(section: dict[str, Any]) -> tuple[dict[str, Any], list[str], str]:
    edges = section.get("edges", [])
    edge_snippets = [
        f"{item.get('source')}->{item.get('target')} magnitude {item.get('magnitude', 'N/A')} confidence {item.get('confidence', 'N/A')}"
        for item in edges
        if isinstance(item, dict)
    ]
    diagnostic = section.get("diagnostic", {})
    frozen = {
        "selectedVariable": diagnostic.get("selectedVariable"),
        "primaryDriver": diagnostic.get("primaryDriver", {}).get("name") if isinstance(diagnostic.get("primaryDriver"), dict) else None,
        "downstreamOutcome": diagnostic.get("downstreamOutcome", {}).get("name") if isinstance(diagnostic.get("downstreamOutcome"), dict) else None,
        "edges": edge_snippets,
    }
    drivers = [
        f"Primary driver is {frozen['primaryDriver']} and selected variable is {frozen['selectedVariable']}.",
        f"Causal edge evidence is {', '.join(edge_snippets[:3])}.",
    ]
    summary = f"Causal explanation follows {frozen['selectedVariable']} into {frozen['downstreamOutcome']}."
    return frozen, drivers, summary


def _policy_lab_payload(section: dict[str, Any]) -> tuple[dict[str, Any], list[str], str]:
    metrics = section.get("deltaMetrics", [])
    refinements = section.get("refinements", [])
    metric_snippets = [
        f"{item.get('label')} {item.get('value')}{item.get('unit', '')}"
        for item in metrics
        if isinstance(item, dict)
    ]
    refinement_snippets = [
        f"{item.get('name')} {item.get('progress')}"
        for item in refinements
        if isinstance(item, dict)
    ]
    frozen = {
        "deltaMetrics": metric_snippets,
        "refinements": refinement_snippets,
        "confidence": section.get("confidence"),
    }
    drivers = [
        f"Policy Lab metrics are {', '.join(metric_snippets[:3])}.",
        f"Refinement scores are {', '.join(refinement_snippets[:2])}.",
        f"Confidence is {section.get('confidence')}.",
    ]
    summary = f"Refinements are scored against frozen metrics {', '.join(metric_snippets[:2])}."
    return frozen, drivers, summary


PAYLOAD_BUILDERS = {
    "macro": _macro_payload,
    "distribution": _distribution_payload,
    "personas": _personas_payload,
    "causal": _causal_payload,
    "policyLab": _policy_lab_payload,
}


def _validate_narrative_numbers(text_parts: list[str], frozen_numbers: dict[str, Any]) -> bool:
    frozen_tokens = set()
    for value in frozen_numbers.values():
        values = value if isinstance(value, list) else [value]
        for item in values:
            for token in str(item).replace(",", " ").split():
                if any(char.isdigit() for char in token):
                    frozen_tokens.add(token.strip("()."))

    narrative_tokens = set()
    for text in text_parts:
        for token in str(text).replace(",", " ").split():
            if any(char.isdigit() for char in token):
                narrative_tokens.add(token.strip("()."))

    return narrative_tokens.issubset(frozen_tokens)


def build_fallback_narrative(section_name: str, section: dict[str, Any]) -> dict[str, Any]:
    builder = PAYLOAD_BUILDERS[section_name]
    frozen_numbers, driver_sentences, summary = builder(section)
    source_snippets = _source_snippets(section_name, section, frozen_numbers)
    text_parts = [summary, *driver_sentences]
    number_check_passed = _validate_narrative_numbers(text_parts, frozen_numbers)

    return {
        "mode": "deterministic-fallback",
        "summary": summary,
        "driverSentences": driver_sentences,
        "sourceSnippets": source_snippets,
        "frozenNumbers": frozen_numbers,
        "guardrail": FROZEN_NUMBERS_CONTRACT,
        "numberCheckPassed": number_check_passed,
    }


def attach_narrative(section_name: str, section: dict[str, Any]) -> dict[str, Any]:
    if section_name not in PAYLOAD_BUILDERS:
        return section
    return {
        **section,
        "narrative": build_fallback_narrative(section_name, section),
    }
