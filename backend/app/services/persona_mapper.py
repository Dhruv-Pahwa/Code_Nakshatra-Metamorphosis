from typing import Dict, Any

def map_persona_to_cge_context(persona: Dict[str, Any]) -> Dict[str, Any]:
    """
    Heuristically maps a rich persona from the dataset to the CGE simulation context 
    (segment weights, base financial breakdown).
    """
    edu = persona.get("education_level", "Unknown")
    occ = persona.get("occupation", "Unknown").lower()
    zone = persona.get("zone", "Rural")
    
    # default weights
    weights = {"lower": 0.0, "middle": 0.0, "upper": 0.0}
    
    # 1. Income Segment Determination
    if edu in ["Illiterate", "Below Primary", "Primary", "Literate without education level"]:
        weights["lower"] = 0.8
        weights["middle"] = 0.2
        income_tier = "lower"
    elif edu in ["Middle", "Matric/Secondary", "Higher Secondary/Intermediate Pre-University/Senior Secondary"]:
        weights["lower"] = 0.2
        weights["middle"] = 0.7
        weights["upper"] = 0.1
        income_tier = "middle"
    elif edu in ["Technical diploma or certificate not equal to degree", "Non-technical diploma or certificate not equal to degree", "Graduate & above"]:
        weights["middle"] = 0.3
        weights["upper"] = 0.7
        income_tier = "upper"
    else:
        weights["middle"] = 1.0 # default
        income_tier = "middle"

    # 2. Sector Mapping (rough)
    sector = "Services Output"
    if any(k in occ for k in ["farmer", "agri", "gatherer", "livestock", "crop"]):
        sector = "Agriculture"
    elif any(k in occ for k in ["assembler", "machinery", "leather", "thatcher", "industrial", "erector", "metal"]):
        sector = "Industrial Production"
    elif any(k in occ for k in ["tech", "software", "aeronautical", "safety"]):
        sector = "Services Output" # Or specific tech? Current model has Services Output
    
    # 3. Base Financial Breakdown (Synthesized)
    # These are placeholder annual values in INR
    if income_tier == "lower":
        base_breakdown = {
            "taxAdjustments": 0,
            "costOfLiving": -12000,
            "rebateCredit": 5000,
        }
        breakdown_weights = {
            "taxAdjustments": 20,
            "costOfLiving": -50,
            "rebateCredit": 100,
        }
    elif income_tier == "middle":
        base_breakdown = {
            "taxAdjustments": -30000,
            "costOfLiving": -60000,
            "rebateCredit": 15000,
        }
        breakdown_weights = {
            "taxAdjustments": 150,
            "costOfLiving": -80,
            "rebateCredit": 180,
        }
    else: # upper
        base_breakdown = {
            "taxAdjustments": -200000,
            "costOfLiving": -150000,
            "rebateCredit": 30000,
        }
        breakdown_weights = {
            "taxAdjustments": 500,
            "costOfLiving": -120,
            "rebateCredit": 250,
        }

    return {
        "id": persona.get("uuid"),
        "name": persona.get("professional_persona", "Unknown").split(",")[0], # often starts with name
        "sector": sector,
        "description": persona.get("persona", ""),
        "segmentWeights": weights,
        "baseBreakdown": base_breakdown,
        "breakdownWeights": breakdown_weights,
        "metadata": {
            "state": persona.get("state"),
            "district": persona.get("district"),
            "sex": persona.get("sex"),
            "age": persona.get("age"),
            "zone": persona.get("zone"),
            "occupation": persona.get("occupation"),
            "first_language": persona.get("first_language"),
        }
    }
