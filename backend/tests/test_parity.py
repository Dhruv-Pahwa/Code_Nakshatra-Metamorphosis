import unittest

from app.services.parity_harness import run_parity_suite
from app.services.pipeline import simulate


class ParitySuiteTest(unittest.TestCase):
    def test_all_parity_fixtures_pass(self):
        report = run_parity_suite()
        self.assertEqual(report["fixtureCount"], 6)
        self.assertTrue(report["passed"], report)

    def test_external_contract_reproducibility(self):
        payload = {
            "policies": [
                {"id": "pol-tax", "policyType": "tax", "sliderValue": 35},
                {"id": "pol-transfer", "policyType": "transfer", "sliderValue": 60},
                {"id": "pol-labor", "policyType": "labor_supply", "sliderValue": 52},
                {"id": "pol-capital", "policyType": "capital_supply", "sliderValue": 51},
            ]
        }
        self.assertEqual(simulate(payload), simulate(payload))


if __name__ == "__main__":
    unittest.main()
