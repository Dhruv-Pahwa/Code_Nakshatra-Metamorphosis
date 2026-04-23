import csv
from pathlib import Path
from typing import Any


def _matrix_from_rows(
    rows: list[dict[str, Any]],
    row_keys: list[str],
    column_keys: list[str],
    row_field: str,
    column_field: str,
    value_field: str,
    default: float = 0.0,
) -> list[list[float]]:
    matrix = [
        [default for _ in column_keys]
        for _ in row_keys
    ]
    row_index = {key: index for index, key in enumerate(row_keys)}
    column_index = {key: index for index, key in enumerate(column_keys)}
    for row in rows:
        row_key = row.get(row_field)
        column_key = row.get(column_field)
        if row_key in row_index and column_key in column_index:
            matrix[row_index[row_key]][column_index[column_key]] = float(row.get(value_field, default))
    return matrix


def load_sam_csv(csv_path: str | Path) -> dict[str, Any]:
    path = Path(csv_path)
    with path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    sections: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        section = row.get("section", "").strip()
        if section:
            sections.setdefault(section, []).append(row)
    return sections


def load_sam(model_config: dict, csv_path: str | Path | None = None) -> dict[str, Any]:
    if csv_path:
        csv_sections = load_sam_csv(csv_path)
        return {
            **model_config["sam"],
            **csv_sections,
        }
    return model_config["sam"]


def build_cge_model_from_sam(model_config: dict, csv_path: str | Path | None = None) -> dict[str, Any]:
    sam = load_sam(model_config, csv_path)
    defaults = model_config["sam_defaults"]
    sectors = sam.get("sectors") or defaults["sectors"]
    labor_types = sam.get("labor_types") or defaults["labor_types"]
    households = sam.get("households") or defaults["households"]

    sector_rows = {
        row["sector"]: row
        for row in sam.get("sector_accounts", [])
        if row.get("sector")
    }
    baseline_output = [
        float(sector_rows.get(sector, {}).get("output", defaults["sector_output"]))
        for sector in sectors
    ]
    capital_by_sector = [
        float(sector_rows.get(sector, {}).get("capital", defaults["capital_payment"]))
        for sector in sectors
    ]
    land_by_sector = [
        float(sector_rows.get(sector, {}).get("land", defaults["land_payment"]))
        for sector in sectors
    ]
    tax_rates = [
        float(sector_rows.get(sector, {}).get("tax_rate", defaults["tax_rate"]))
        for sector in sectors
    ]
    labor_by_sector = _matrix_from_rows(
        sam.get("labor_payments", []),
        sectors,
        labor_types,
        "sector",
        "labor_type",
        "value",
        defaults["labor_payment"],
    )
    factor_distribution = _matrix_from_rows(
        sam.get("factor_distribution", []),
        labor_types + ["capital", "land"],
        households,
        "factor",
        "household",
        "share",
        defaults["factor_distribution_share"],
    )
    consumption_matrix = _matrix_from_rows(
        sam.get("consumption_shares", []),
        sectors,
        households,
        "sector",
        "household",
        "share",
        defaults["consumption_share"],
    )
    savings_by_household = {
        row["household"]: float(row.get("rate", defaults["savings_rate"]))
        for row in sam.get("savings_rates", [])
        if row.get("household")
    }
    transfers_by_household = {
        row["household"]: float(row.get("value", defaults["transfer"]))
        for row in sam.get("transfers", [])
        if row.get("household")
    }

    return {
        "sectors": sectors,
        "labor_types": labor_types,
        "households": households,
        "baseline_output": baseline_output,
        "labor_by_sector": labor_by_sector,
        "capital_by_sector": capital_by_sector,
        "land_by_sector": land_by_sector,
        "tax_rates": tax_rates,
        "factor_distribution": factor_distribution,
        "hhd_consumption_matrix": consumption_matrix,
        "hhd_savings_rates": [
            savings_by_household.get(household, defaults["savings_rate"])
            for household in households
        ],
        "hhd_gov_transfers": [
            transfers_by_household.get(household, defaults["transfer"])
            for household in households
        ],
    }
