from typing import Any

from pydantic import ValidationError

from app.models.schemas import (
    AnalysisSummary,
    Causal,
    Distribution,
    Macro,
    ModuleOutputError,
    Personas,
    PolicyLab,
    Scenarios,
)


SECTION_MODELS = {
    "analysisSummary": AnalysisSummary,
    "macro": Macro,
    "distribution": Distribution,
    "personas": Personas,
    "causal": Causal,
    "policyLab": PolicyLab,
    "scenarios": Scenarios,
}


def _error_path(section_name: str, error: dict[str, Any]) -> str:
    suffix = ".".join(str(part) for part in error["loc"])
    return f"{section_name}.{suffix}" if suffix else section_name


def validate_stage_output(module_name: str, section_name: str, section: dict) -> dict:
    model = SECTION_MODELS[section_name]
    try:
        validated = model.model_validate(section)
    except ValidationError as exc:
        missing_paths: list[str] = []
        invalid_paths: list[str] = []
        for error in exc.errors():
            path = _error_path(section_name, error)
            if error["type"] == "missing":
                missing_paths.append(path)
            else:
                invalid_paths.append(path)
        raise ModuleOutputError(
            f"{module_name} produced invalid {section_name} output.",
            module=module_name,
            missing_paths=missing_paths,
            invalid_paths=invalid_paths,
        ) from exc

    return validated.model_dump(exclude_none=True)


def validate_causal_semantics(causal: dict) -> None:
    node_ids = {node["id"] for node in causal["nodes"]}
    invalid_edges = [
        edge["id"]
        for edge in causal["edges"]
        if edge["source"] not in node_ids or edge["target"] not in node_ids
    ]
    if invalid_edges:
        raise ModuleOutputError(
            "causal_engine produced edges with missing node endpoints.",
            module="causal_engine",
            invalid_paths=[f"causal.edges.{edge_id}" for edge_id in invalid_edges],
        )


def validate_progress_bounds(policy_lab: dict) -> None:
    invalid = [
        item["name"]
        for item in policy_lab["refinements"]
        if item["progress"] < 0 or item["progress"] > 100
    ]
    if invalid:
        raise ModuleOutputError(
            "policy_lab_engine produced refinement progress outside 0..100.",
            module="policy_lab_engine",
            invalid_paths=[f"policyLab.refinements.{name}.progress" for name in invalid],
        )
