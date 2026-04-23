from fastapi import APIRouter, HTTPException

from app.models.schemas import PipelineError
from app.services.rule_registry import build_policy_templates, load_runtime_rules
from app.services.pipeline import simulate as run_simulation

router = APIRouter()


@router.post("/simulate")
async def simulate(payload: dict):
    """
    Accepts policy input and returns a complete contract-compliant simulation response.
    """
    try:
        return run_simulation(policy=payload)
    except PipelineError as exc:
        raise HTTPException(status_code=422, detail=exc.to_response()) from exc


@router.get("/policy/templates")
async def policy_templates():
    """
    Returns rule-backed policy templates for Policy Studio authoring.
    """
    try:
        runtime_rules = load_runtime_rules()
        return {"templates": build_policy_templates(runtime_rules)}
    except PipelineError as exc:
        raise HTTPException(status_code=422, detail=exc.to_response()) from exc
