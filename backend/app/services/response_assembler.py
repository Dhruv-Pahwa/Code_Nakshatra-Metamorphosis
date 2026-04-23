from app.models.schemas import AssemblyError, validate_simulation_response


TOP_LEVEL_KEYS = [
    "analysisSummary",
    "macro",
    "distribution",
    "personas",
    "causal",
    "policyLab",
    "scenarios",
]


def response_assembler(
    analysisSummary: dict,
    macro: dict,
    distribution: dict,
    personas: dict,
    causal: dict,
    policyLab: dict,
    scenarios: dict,
    contract_schema: dict
) -> dict:
    sections = {
        "analysisSummary": analysisSummary,
        "macro": macro,
        "distribution": distribution,
        "personas": personas,
        "causal": causal,
        "policyLab": policyLab,
        "scenarios": scenarios,
    }
    missing_sections = [
        key for key in TOP_LEVEL_KEYS
        if not isinstance(sections.get(key), dict) or not sections[key]
    ]
    if missing_sections:
        raise AssemblyError(
            "Response assembly failed because required sections are missing.",
            missing_paths=missing_sections,
        )

    response = {key: sections[key] for key in TOP_LEVEL_KEYS}
    return validate_simulation_response(response)
