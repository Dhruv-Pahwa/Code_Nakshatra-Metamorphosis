from app.services.pipeline import simulate
from app.models.schemas import validate_simulation_response

def run_tests():
    print("Running Smoke Tests...")

    # Test 1: Given a default empty policy block
    policy_block = {}
    response = simulate(policy_block)
    validated = validate_simulation_response(response)
    
    assert "macro" in validated
    assert len(validated["macro"]["sectors"]) > 0
    assert "distribution" in validated
    assert len(validated["distribution"]["segments"]) > 0
    assert "scenarios" in validated
    print("Test 1 Passed: Empty policy block simulated cleanly.")

    # Test 2: Pipeline with carbon tax rules
    policy_block = {
        "policyBlock": {
            "shocks": [
                {
                    "id": "tax-1",
                    "policyType": "tax",
                    "name": "Carbon Tax",
                    "metadata": {"tags": ["carbon", "fuel"]}
                }
            ]
        }
    }
    response = simulate(policy_block)
    validated = validate_simulation_response(response)
    
    matched_ids = validated["macro"]["provenance"]["lineageIds"]
    print(f"Matched rule IDs: {matched_ids}")
    assert any("carbon_tax_india_v1" == rule_id for rule_id in matched_ids), "Carbon tax rule should trigger based on tags"
    print("Test 2 Passed: Payload integrity with tax block.")

if __name__ == "__main__":
    run_tests()
    print("All smoke tests passed.")
