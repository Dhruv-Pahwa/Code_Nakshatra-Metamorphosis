import json
from pathlib import Path
from typing import Any

from app.services.pipeline import load_model_config
from app.services.policy_ingestion import policy_ingestion
from app.services.cge_core import run_cge_simulation


DEFAULT_FIXTURE_DIR = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "parity"


def _extract_aggregates(state: dict[str, Any]) -> dict[str, Any]:
    return {
        "baseline": {
            "gdp": state["baseline"]["gdp"],
            "tax_revenue": state["baseline"]["tax_revenue"],
            "cpi": state["baseline"]["cpi"],
            "real_incomes": state["baseline"]["real_incomes"],
            "value_added": state["baseline"]["value_added"],
            "capital": state["baseline"]["capital"],
            "total_labor": state["baseline"]["total_labor"],
        },
        "scenario": {
            "gdp": state["scenario"]["gdp"],
            "tax_revenue": state["scenario"]["tax_revenue"],
            "cpi": state["scenario"]["cpi"],
            "real_incomes": state["scenario"]["real_incomes"],
            "value_added": state["scenario"]["value_added"],
            "capital": state["scenario"]["capital"],
            "total_labor": state["scenario"]["total_labor"],
        },
        "delta": {
            "gdp": state["delta"]["gdp"],
            "tax_revenue": state["delta"]["tax_revenue"],
            "cpi": state["delta"]["cpi"],
            "real_incomes": state["delta"]["real_incomes"],
            "value_added": state["delta"]["value_added"],
            "wages": state["delta"]["wages"],
        },
        "invariants": state["diagnostics"]["invariants"],
        "diagnostics": {
            "baseline": state["diagnostics"]["baseline"],
            "scenario": state["diagnostics"]["scenario"],
        },
    }


def _flatten(value: Any, prefix: str = "") -> dict[str, float]:
    if isinstance(value, dict):
        items: dict[str, float] = {}
        for key, child in value.items():
            child_prefix = f"{prefix}.{key}" if prefix else str(key)
            items.update(_flatten(child, child_prefix))
        return items
    if isinstance(value, list):
        items = {}
        for index, child in enumerate(value):
            child_prefix = f"{prefix}.{index}" if prefix else str(index)
            items.update(_flatten(child, child_prefix))
        return items
    if isinstance(value, int | float):
        return {prefix: float(value)}
    return {}


def load_fixture(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def run_fixture(fixture: dict[str, Any]) -> dict[str, Any]:
    model_config = load_model_config()
    ingested = policy_ingestion(
        policy=fixture["policy"],
        run_id=f"fixture-{fixture['fixture_id']}",
        timestamp_utc="2026-04-17T00:00:00Z",
        model_config=model_config,
    )
    state = run_cge_simulation(
        canonical_policy_state=ingested["canonical_policy_state"],
        model_config=model_config,
    )
    actual = _extract_aggregates(state)
    expected = fixture["expected"]
    tolerance = fixture["tolerances"]["aggregate_abs"]
    expected_flat = _flatten(expected)
    actual_flat = _flatten(actual)
    diffs = []
    for path, expected_value in expected_flat.items():
        actual_value = actual_flat.get(path)
        if actual_value is None:
            diffs.append(
                {
                    "path": path,
                    "expected": expected_value,
                    "actual": None,
                    "absoluteDiff": None,
                    "passed": False,
                }
            )
            continue
        absolute_diff = abs(actual_value - expected_value)
        diffs.append(
            {
                "path": path,
                "expected": expected_value,
                "actual": actual_value,
                "absoluteDiff": round(absolute_diff, 9),
                "passed": absolute_diff <= tolerance,
            }
        )

    invariant_thresholds = fixture["tolerances"]["invariants"]
    invariant_results = [
        {
            "path": "diagnostics.baseline.residualNorm",
            "actual": actual["diagnostics"]["baseline"]["residualNorm"],
            "threshold": invariant_thresholds["residualNorm"],
            "passed": actual["diagnostics"]["baseline"]["residualNorm"] <= invariant_thresholds["residualNorm"],
        },
        {
            "path": "diagnostics.scenario.residualNorm",
            "actual": actual["diagnostics"]["scenario"]["residualNorm"],
            "threshold": invariant_thresholds["residualNorm"],
            "passed": actual["diagnostics"]["scenario"]["residualNorm"] <= invariant_thresholds["residualNorm"],
        },
        {
            "path": "invariants.marketClearingNorm",
            "actual": actual["invariants"]["marketClearingNorm"],
            "threshold": invariant_thresholds["marketClearingNorm"],
            "passed": actual["invariants"]["marketClearingNorm"] <= invariant_thresholds["marketClearingNorm"],
        },
        {
            "path": "invariants.factorSupplyConsistency",
            "actual": actual["invariants"]["factorSupplyConsistency"],
            "threshold": invariant_thresholds["factorSupplyConsistency"],
            "passed": actual["invariants"]["factorSupplyConsistency"] <= invariant_thresholds["factorSupplyConsistency"],
        },
    ]
    passed = all(item["passed"] for item in diffs) and all(item["passed"] for item in invariant_results)

    return {
        "fixtureId": fixture["fixture_id"],
        "class": fixture["class"],
        "passed": passed,
        "diffs": diffs,
        "invariants": invariant_results,
        "diagnostics": actual["diagnostics"],
    }


def run_parity_suite(fixture_dir: Path = DEFAULT_FIXTURE_DIR) -> dict[str, Any]:
    fixture_paths = sorted(fixture_dir.glob("*.json"))
    results = [run_fixture(load_fixture(path)) for path in fixture_paths]
    return {
        "fixtureCount": len(results),
        "passedCount": sum(1 for result in results if result["passed"]),
        "failedCount": sum(1 for result in results if not result["passed"]),
        "passed": all(result["passed"] for result in results),
        "results": results,
    }
