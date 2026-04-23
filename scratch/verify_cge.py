import json
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.pipeline import simulate

# Mock policy payload
policy = {
    "shocks": [
        {
            "id": "tax-1",
            "name": "Corporate Tax Adjustment",
            "policyType": "tax",
            "intensity": 0.5,
            "metadata": {"tags": ["RULE-BACKED", "TAX"]}
        }
    ]
}

print("Running High-Fidelity CGE Simulation Test...")
try:
    response = simulate(policy)
    
    # Verify top level keys
    top_keys = ["analysisSummary", "macro", "distribution", "personas", "causal", "policyLab", "scenarios"]
    for key in top_keys:
        if key not in response:
            print(f"FAILED: Missing key {key}")
            sys.exit(1)
            
    # Verify regional impact data
    macro = response.get("macro", {})
    regional_map = macro.get("regionalImpactMap", {})
    if not regional_map:
        print("FAILED: No regionalImpactMap in macro")
        sys.exit(1)
        
    print(f"SUCCESS: Simulation completed. {len(regional_map)} states processed.")
    print(f"Sample Regional Data (Maharashtra): {regional_map.get('Maharashtra')}")
    
except Exception as e:
    print(f"FAILED with error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
