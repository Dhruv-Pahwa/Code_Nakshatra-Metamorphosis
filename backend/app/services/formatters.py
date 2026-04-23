def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def coerce_float(value: object, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def signed_number(value: float, decimals: int = 1) -> str:
    return f"{value:+.{decimals}f}"


def signed_percent(value: float, decimals: int = 1) -> str:
    return f"{value:+.{decimals}f}%"


def inr_per_year(value: float) -> str:
    prefix = "+" if value >= 0 else "-"
    return f"{prefix}INR {abs(round(value))} / yr"


def inr_total(value: float) -> str:
    prefix = "+" if value >= 0 else "-"
    return f"{prefix}INR {abs(round(value))}"


def parse_signed_number(value: object, default: float = 0.0) -> float:
    text = str(value).replace("%", "").replace("+", "").replace("INR", "")
    text = text.replace("/ yr", "").replace(",", "").strip()
    return coerce_float(text, default)
