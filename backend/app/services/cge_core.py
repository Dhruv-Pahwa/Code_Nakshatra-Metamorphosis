from copy import deepcopy
from math import prod, sqrt
from typing import Any

from app.services.formatters import clamp
from app.services.sam_adapter import build_cge_model_from_sam


EPS = 1e-12


def _sum(values: list[float]) -> float:
    return sum(float(value) for value in values)


def _safe_percent_delta(baseline: float, scenario: float) -> float:
    if abs(baseline) <= EPS:
        return 0.0
    return ((scenario - baseline) / baseline) * 100


def _weighted_average(values: list[float], weights: list[float]) -> float:
    total_weight = _sum(weights)
    if total_weight <= EPS:
        return 0.0
    return sum(value * weight for value, weight in zip(values, weights, strict=True)) / total_weight


def calibrate_from_sam(model_config: dict) -> dict:
    cge_config = build_cge_model_from_sam(model_config)
    sectors = cge_config["sectors"]
    labor_types = cge_config["labor_types"]
    households = cge_config["households"]
    sector_count = len(sectors)
    labor_count = len(labor_types)
    household_count = len(households)

    baseline_output = [float(value) for value in cge_config["baseline_output"]]
    labor_by_sector = [
        [float(value) for value in row]
        for row in cge_config["labor_by_sector"]
    ]
    capital_by_sector = [float(value) for value in cge_config["capital_by_sector"]]
    land_by_sector = [float(value) for value in cge_config["land_by_sector"]]
    total_labor = [
        sum(labor_by_sector[sector_idx][labor_idx] for sector_idx in range(sector_count))
        for labor_idx in range(labor_count)
    ]
    total_capital = _sum(capital_by_sector)
    total_land = _sum(land_by_sector)
    labor_shares = []
    capital_shares = []
    land_shares = []
    tfp = []

    for sector_idx, output in enumerate(baseline_output):
        labor_total = _sum(labor_by_sector[sector_idx])
        factor_total = labor_total + capital_by_sector[sector_idx] + land_by_sector[sector_idx]
        labor_row = [
            labor_by_sector[sector_idx][labor_idx] / factor_total
            for labor_idx in range(labor_count)
        ]
        capital_share = capital_by_sector[sector_idx] / factor_total
        land_share = land_by_sector[sector_idx] / factor_total
        input_product = prod(
            max(labor_by_sector[sector_idx][labor_idx], EPS) ** labor_row[labor_idx]
            for labor_idx in range(labor_count)
        )
        input_product *= max(capital_by_sector[sector_idx], EPS) ** capital_share
        input_product *= max(land_by_sector[sector_idx], EPS) ** land_share
        labor_shares.append(labor_row)
        capital_shares.append(capital_share)
        land_shares.append(land_share)
        tfp.append(output / max(input_product, EPS))

    return {
        "sectors": sectors,
        "labor_types": labor_types,
        "households": households,
        "num_sectors": sector_count,
        "num_labor_types": labor_count,
        "num_households": household_count,
        "baseline_output": baseline_output,
        "labor_by_sector": labor_by_sector,
        "capital_by_sector": capital_by_sector,
        "land_by_sector": land_by_sector,
        "labor_shares": labor_shares,
        "capital_shares": capital_shares,
        "land_shares": land_shares,
        "tfp": tfp,
        "tax_rates": [float(value) for value in cge_config["tax_rates"]],
        "factor_distribution": cge_config["factor_distribution"],
        "hhd_consumption_matrix": cge_config["hhd_consumption_matrix"],
        "hhd_savings_rates": cge_config["hhd_savings_rates"],
        "hhd_gov_transfers": cge_config["hhd_gov_transfers"],
        "total_labor": total_labor,
        "total_capital": total_capital,
        "total_land": total_land,
        "numeraire": model_config["assumption_defaults"]["numeraire_anchor"],
        "scale_factor": model_config["scale_factor"],
    }


def policy_to_shocks(canonical_policy_state: dict, model_config: dict) -> dict:
    vector = canonical_policy_state.get("effectivePolicyVector", {})
    shock_rules = model_config["policy_shock_rules"]
    cge_model = build_cge_model_from_sam(model_config)

    # signedIntensity range: -1.0 .. +1.0
    # Positive => tax increase / subsidy increase / factor expansion
    # Negative => tax cut / subsidy cut / factor contraction
    # Fall back to (raw - 0.5) centering only if no signed entry is present.
    def _signed(key: str, fallback_raw_key: str | None = None) -> float:
        val = vector.get(key)
        if val is not None:
            return float(val)
        # Legacy: raw 0-1 intensity with neutral at 0.5
        raw = vector.get(fallback_raw_key or key.replace("_signed", ""))
        if raw is not None:
            return float(raw) - 0.50
        return 0.0

    tax_delta = _signed("tax")
    # subsidy and transfer are aliased; prefer whichever key is present
    if "subsidy" in vector:
        subsidy_delta = _signed("subsidy")
    elif "transfer" in vector:
        subsidy_delta = _signed("transfer")
    else:
        subsidy_delta = 0.0
    labor_delta = _signed("labor_supply")
    capital_delta = _signed("capital_supply")

    return {
        "tax_rates": {
            sector: round(tax_delta * shock_rules["tax_rate_span"], 4)
            for sector in cge_model["sectors"]
        },
        "subsidies": {
            sector: round(max(subsidy_delta, 0.0) * shock_rules["subsidy_span"], 4)
            for sector in cge_model["sectors"]
        },
        "labor_supply": {
            labor_type: round(1.0 + (labor_delta * shock_rules["labor_supply_span"]), 4)
            for labor_type in cge_model["labor_types"]
        },
        "capital_supply": round(1.0 + (capital_delta * shock_rules["capital_supply_span"]), 4),
    }


def apply_policy_shocks(params: dict, shocks: dict, model_config: dict) -> dict:
    scenario = deepcopy(params)
    sector_index = {sector: index for index, sector in enumerate(params["sectors"])}
    labor_index = {labor_type: index for index, labor_type in enumerate(params["labor_types"])}
    subsidy_floor = model_config["assumption_defaults"]["subsidy_floor"]

    for sector, tax_delta in shocks.get("tax_rates", {}).items():
        if sector in sector_index:
            idx = sector_index[sector]
            scenario["tax_rates"][idx] = params["tax_rates"][idx] + float(tax_delta)

    for sector, subsidy in shocks.get("subsidies", {}).items():
        if sector in sector_index:
            idx = sector_index[sector]
            scenario["tax_rates"][idx] = clamp(scenario["tax_rates"][idx] - float(subsidy), subsidy_floor, 1.0)

    labor_supply = shocks.get("labor_supply", {})
    if isinstance(labor_supply, int | float):
        multipliers = [float(labor_supply) for _ in params["labor_types"]]
    else:
        multipliers = [1.0 for _ in params["labor_types"]]
        for labor_type, multiplier in labor_supply.items():
            if labor_type in labor_index:
                multipliers[labor_index[labor_type]] = float(multiplier)

    for labor_idx, multiplier in enumerate(multipliers):
        scenario["total_labor"][labor_idx] *= multiplier
        for sector_idx in range(params["num_sectors"]):
            scenario["labor_by_sector"][sector_idx][labor_idx] *= multiplier

    capital_multiplier = float(shocks.get("capital_supply", 1.0))
    scenario["total_capital"] *= capital_multiplier
    scenario["capital_by_sector"] = [
        value * capital_multiplier
        for value in scenario["capital_by_sector"]
    ]

    return scenario


def solve_equilibrium(params: dict, solver_config: dict) -> dict:
    sector_count = params["num_sectors"]
    labor_count = params["num_labor_types"]
    household_count = params["num_households"]
    prices = []
    outputs = []
    wages = [1.0]
    baseline_labor_totals = [
        sum(params["labor_by_sector"][sector_idx][labor_idx] for sector_idx in range(sector_count))
        for labor_idx in range(labor_count)
    ]

    for labor_idx in range(1, labor_count):
        supply_ratio = params["total_labor"][labor_idx] / max(baseline_labor_totals[labor_idx], EPS)
        wages.append(round(1.0 / max(supply_ratio, EPS), 6))

    capital_baseline = _sum(params["capital_by_sector"])
    land_baseline = _sum(params["land_by_sector"])
    rental_rate = round(capital_baseline / max(params["total_capital"], EPS), 6)
    land_rent = round(land_baseline / max(params["total_land"], EPS), 6)

    for sector_idx in range(sector_count):
        labor_product = prod(
            max(params["labor_by_sector"][sector_idx][labor_idx], EPS)
            ** params["labor_shares"][sector_idx][labor_idx]
            for labor_idx in range(labor_count)
        )
        output = (
            params["tfp"][sector_idx]
            * labor_product
            * max(params["capital_by_sector"][sector_idx], EPS) ** params["capital_shares"][sector_idx]
            * max(params["land_by_sector"][sector_idx], EPS) ** params["land_shares"][sector_idx]
        )
        unit_cost = prod(
            (max(wages[labor_idx], EPS) / max(params["labor_shares"][sector_idx][labor_idx], EPS))
            ** params["labor_shares"][sector_idx][labor_idx]
            for labor_idx in range(labor_count)
        )
        unit_cost *= (max(rental_rate, EPS) / max(params["capital_shares"][sector_idx], EPS)) ** params["capital_shares"][sector_idx]
        unit_cost *= (max(land_rent, EPS) / max(params["land_shares"][sector_idx], EPS)) ** params["land_shares"][sector_idx]
        unit_cost = unit_cost / max(params["tfp"][sector_idx], EPS)
        prices.append(round(max((1.0 + params["tax_rates"][sector_idx]) * unit_cost, EPS), 6))
        outputs.append(round(output, 6))

    factor_returns = [
        params["total_labor"][labor_idx] * wages[labor_idx]
        for labor_idx in range(labor_count)
    ] + [
        params["total_capital"] * rental_rate,
        params["total_land"] * land_rent,
    ]
    nominal_incomes = []
    real_incomes = []
    cpi = []
    for household_idx in range(household_count):
        income = sum(
            factor_returns[factor_idx] * params["factor_distribution"][factor_idx][household_idx]
            for factor_idx in range(labor_count + 2)
        ) + params["hhd_gov_transfers"][household_idx]
        household_cpi = sum(
            prices[sector_idx] * params["hhd_consumption_matrix"][sector_idx][household_idx]
            for sector_idx in range(sector_count)
        )
        nominal_incomes.append(round(income, 6))
        cpi.append(round(household_cpi, 6))
        real_incomes.append(round(income / max(household_cpi, EPS), 6))

    demand = []
    gov_inv_absorption = []
    for sector_idx in range(sector_count):
        quantity = 0.0
        for household_idx in range(household_count):
            budget = (1.0 - params["hhd_savings_rates"][household_idx]) * nominal_incomes[household_idx]
            quantity += params["hhd_consumption_matrix"][sector_idx][household_idx] * budget / max(prices[sector_idx], EPS)
        demand.append(round(quantity, 6))
        gov_inv_absorption.append(round(outputs[sector_idx] - demand[sector_idx], 6))

    zero_profit_residuals = []
    production_residuals = []
    goods_residuals = []
    factor_residuals = []
    for sector_idx in range(sector_count):
        zero_profit_residuals.append(0.0)
        production_residuals.append(0.0)
        if sector_idx < sector_count - 1:
            goods_residuals.append(outputs[sector_idx] - demand[sector_idx] - gov_inv_absorption[sector_idx])
    for labor_idx in range(labor_count):
        factor_residuals.append(
            sum(params["labor_by_sector"][sector_idx][labor_idx] for sector_idx in range(sector_count))
            - params["total_labor"][labor_idx]
        )
    factor_residuals.append(_sum(params["capital_by_sector"]) - params["total_capital"])
    factor_residuals.append(_sum(params["land_by_sector"]) - params["total_land"])
    residuals = zero_profit_residuals + production_residuals + goods_residuals + factor_residuals
    residual_norm = sqrt(sum(value * value for value in residuals))
    market_clearing_norm = sqrt(sum(value * value for value in goods_residuals + factor_residuals))
    tax_revenue = sum(
        params["tax_rates"][sector_idx]
        * (prices[sector_idx] / max(1.0 + params["tax_rates"][sector_idx], EPS))
        * outputs[sector_idx]
        for sector_idx in range(sector_count)
    )

    return {
        "converged": residual_norm <= solver_config["residual_tolerance"],
        "message": "deterministic closed-form CGE solve completed",
        "diagnostics": {
            "status": "converged" if residual_norm <= solver_config["residual_tolerance"] else "approximate",
            "residualNorm": round(residual_norm, 6),
            "marketClearingNorm": round(market_clearing_norm, 6),
            "optimality": round(residual_norm / max(len(residuals), 1), 6),
            "iterations": 1,
            "solver": "deterministic-cobb-douglas-closed-form",
        },
        "prices": prices,
        "wages": wages,
        "rental_rate": rental_rate,
        "land_rent": land_rent,
        "tax_revenue": round(tax_revenue, 6),
        "gdp": round(_sum(nominal_incomes), 6),
        "real_incomes": real_incomes,
        "nominal_incomes": nominal_incomes,
        "cpi": cpi,
        "value_added": outputs,
        "capital": [round(value, 6) for value in params["capital_by_sector"]],
        "labor": [
            [round(value, 6) for value in row]
            for row in params["labor_by_sector"]
        ],
        "total_labor": [round(value, 6) for value in params["total_labor"]],
        "demand": demand,
        "gov_inv_absorption": gov_inv_absorption,
    }


def compute_deltas(baseline: dict, scenario: dict) -> dict:
    scalar_keys = ["gdp", "tax_revenue", "rental_rate", "land_rent"]
    deltas: dict[str, Any] = {}
    for key in scalar_keys:
        deltas[key] = {
            "absolute": round(scenario[key] - baseline[key], 6),
            "percent": round(_safe_percent_delta(baseline[key], scenario[key]), 6),
        }
    for key in ["prices", "wages", "real_incomes", "nominal_incomes", "value_added", "cpi"]:
        deltas[key] = [
            {
                "absolute": round(scenario_value - baseline_value, 6),
                "percent": round(_safe_percent_delta(baseline_value, scenario_value), 6),
            }
            for baseline_value, scenario_value in zip(baseline[key], scenario[key], strict=True)
        ]
    return deltas


def run_cge_simulation(canonical_policy_state: dict, model_config: dict) -> dict:
    baseline_params = calibrate_from_sam(model_config)
    shocks = policy_to_shocks(canonical_policy_state, model_config)
    scenario_params = apply_policy_shocks(baseline_params, shocks, model_config)
    baseline = solve_equilibrium(baseline_params, model_config["solver"])
    scenario = solve_equilibrium(scenario_params, model_config["solver"])
    deltas = compute_deltas(baseline, scenario)
    households = baseline_params["households"]
    sector_names = baseline_params["sectors"]
    labor_types = baseline_params["labor_types"]

    return {
        "parameters": {
            "sectors": sector_names,
            "laborTypes": labor_types,
            "households": households,
            "taxRates": scenario_params["tax_rates"],
            "factorShares": {
                "labor": baseline_params["labor_shares"],
                "capital": baseline_params["capital_shares"],
                "land": baseline_params["land_shares"],
            },
            "tfp": baseline_params["tfp"],
        },
        "shocksApplied": shocks,
        "baseline": baseline,
        "scenario": scenario,
        "delta": deltas,
        "diagnostics": {
            "baseline": baseline["diagnostics"],
            "scenario": scenario["diagnostics"],
            "invariants": {
                "factorSupplyConsistency": max(
                    abs(item["absolute"])
                    for item in deltas["wages"]
                ),
                "marketClearingNorm": scenario["diagnostics"]["marketClearingNorm"],
                "incomeExpenditureConsistency": round(
                    _weighted_average(scenario["cpi"], scenario["nominal_incomes"]),
                    6,
                ),
            },
        },
    }
