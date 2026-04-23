from fastapi import APIRouter, HTTPException
from app.models.schemas import PersonaQueryRequest
from app.services.persona_service import persona_service

router = APIRouter()

@router.post("/query")
async def query_persona(payload: PersonaQueryRequest):
    """
    Accepts a user query and simulation context, returns AI-generated persona insights via Groq.
    """
    try:
        response = persona_service.query_persona_insights(
            query=payload.query,
            context=payload.context,
            selected_region=payload.selectedRegion,
            mode=payload.mode
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
