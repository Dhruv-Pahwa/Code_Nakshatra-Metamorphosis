# What Each Page Shows After the Full CGE System Is Built

A CGE (Computable General Equilibrium) model solves for a full economy in equilibrium. When you shock it with a policy, it produces **prices**, **quantities**, **incomes**, **welfare measures**, **government accounts**, and **trade outcomes** — all interconnected, all internally consistent.

The question is: how do you take this rich but dense economic output and present it across 7 pages so that it tells one continuous, comprehensible story?

---

## The Narrative Arc Across Pages

```
 Policy Studio     "Here is what I'm doing to the economy"
       ↓
 Macro Impact      "Here is what happened to the WHOLE economy"
       ↓
 Distribution      "Here is WHO won and WHO lost"
       ↓
 Personas          "Here is what it FEELS LIKE for real people"
       ↓
 Causal Explorer   "Here is WHY these outcomes occurred"
       ↓
 Policy Lab        "Here is how we can do BETTER"
       ↓
 Comparison        "Here is the DECISION"
```

Each page should feel like a natural question after the previous one. "The economy grew? OK, but who benefited? OK, but why did that group lose? Can we fix it?"

---

## Page 1: Policy Studio (`/policy`)

### Purpose
"Here is what I'm doing to the economy" — input configuration, not results.

### What It Shows

#### Before Simulation Run:
| Element | Source | What The User Sees |
|:---|:---|:---|
| **Policy Module Cards** | Local state | Tax/subsidy/transfer instruments with sliders and parameters |
| **Compiled Shock Preview** | Local → `toShock()` | What the CGE model will actually receive: tax rate deltas per sector, subsidy rates, labor/capital supply shifts |
| **Input Validation Status** | Local | Are all required fields filled? Are values in valid ranges? |
| **Template Library** | `GET /policy/templates` | Pre-configured policy packages (Carbon Tax, Rural Transfer, etc.) |

#### After Simulation Run (summary bar):
| Element | CGE Source | What The User Sees |
|:---|:---|:---|
| **Quick GDP Delta** | `delta.gdp.percent` | "+2.4% GDP" as a confidence badge |
| **Quick Fiscal Impact** | `delta.tax_revenue.percent` | "+8.3% Revenue" or "-2.1% Revenue" |
| **Run Status** | Solver diagnostics | "Converged ✓" or "Approximate ⚠" |

> [!NOTE]
> Policy Studio is 90% input-side. It should NOT show heavy results — just enough to confirm "your simulation ran and here's the headline." The results belong on subsequent pages.

---

## Page 2: Macro Impact (`/macro`)

### Purpose
"Here is what happened to the WHOLE economy" — the aggregate national picture.

### The Story This Page Tells
*"Your carbon tax + rural transfer policy grew GDP by 2.4%, but it raised consumer prices by 1.8% and shifted employment across sectors. Here's the full picture."*

### What It Shows

#### Hero Section: The Headline Numbers
| Element | CGE Source | Visual | Why It Matters |
|:---|:---|:---|:---|
| **Real GDP Change** | `delta.gdp.percent` | Big number: "+2.4%" | THE headline metric for any policy |
| **Consumer Price Index** | Weighted average of `delta.cpi` across households | Badge: "+1.8%" | Tells you if growth is real or inflated |
| **Government Revenue** | `delta.tax_revenue.percent` | Badge: "+8.3%" | Is the policy fiscally sustainable? |
| **Trade Balance** | Net exports delta (if open economy) | Badge: "-0.4%" | Are we importing more than exporting? |

#### Tradeoff Summary Bar
A compact row showing direction arrows:
- **Growth**: ↑ or ↓ (from GDP delta)
- **Prices**: ↑ or ↓ (from CPI delta — up is BAD here)
- **Revenue**: ↑ or ↓ (from tax revenue delta)
- **Employment**: ↑ or ↓ (from labor demand delta)

#### Sectoral Output Table
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Output by sector** | `delta.value_added[sector].percent` | Bar chart showing % change per sector |
| **Sector names** | `parameters.sectors` (Industrial, Services, Agriculture) | Labels |
| **Price change by sector** | `delta.prices[sector].percent` | Inline with output — shows if growth is price-driven or real |

This is the chart that answers "which sectors grew and which contracted."

#### Factor Market Panel
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Wage changes by skill** | `delta.wages[labor_type].percent` | Two rows: "Unskilled wages: +1.2%", "Skilled wages: +0.8%" |
| **Capital rental rate** | `delta.rental_rate.percent` | Row: "Capital returns: -0.4%" |
| **Land rent** | `delta.land_rent.percent` | Row: "Land rent: +0.3%" |

This answers "how did factor prices change" — critical for understanding distribution later.

#### Investment & Savings
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Aggregate savings** | Sum of household savings from scenario solve | Card |
| **Investment** | Government + private investment absorption | Card |

#### GDP Growth Projection Chart
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Trajectory** | Extrapolated from GDP delta over quarters | Line chart (6 quarters) |

#### Confidence & Diagnostics Sidebar
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Solver status** | `diagnostics.scenario.status` | Badge: "Converged" or "Approximate" |
| **Residual norm** | `diagnostics.scenario.residualNorm` | Small number |
| **Market clearing norm** | `diagnostics.scenario.marketClearingNorm` | Small number |
| **Model version** | Run metadata | Label |

---

## Page 3: Distribution Impact (`/distribution`)

### Purpose
"Here is WHO won and WHO lost" — the equity and welfare story.

### The Story This Page Tells
*"GDP grew +2.4%, but the lower quintile gained +3.1% real income while the upper quintile lost -0.6%. The Gini coefficient improved by -0.011. Here's why."*

### What It Shows

#### Hero Section: The Equity Headline
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Gini Delta** | Computed from real income distribution shifts | Big badge: "-0.011 Gini" (improvement) |
| **Equity verdict** | Derived from direction of Gini | "Policy is PROGRESSIVE" or "Policy is REGRESSIVE" |

#### Household Income Cards (one per group: Lower, Middle, Upper)
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Real income change** | `delta.real_incomes[household].percent` | Hero number per card: "+3.1%" |
| **Nominal income change** | `delta.nominal_incomes[household].percent` | Sub-number: "Nominal: +4.8%" |
| **CPI for this household** | `delta.cpi[household].percent` | Sub-number: "Price effect: +1.7%" |
| **Equivalent Variation (EV)** | Computed: willingness to pay to avoid/accept policy | "EV: ₹4,200/year" — THE proper welfare metric |

> [!IMPORTANT]
> **EV (Equivalent Variation) is what makes this a real CGE system, not just a growth calculator.** EV answers: "How much money would this household need to be as well-off as before the policy?" A positive EV means the policy made them better off. This is the gold standard welfare measure in CGE economics.

#### Income Decomposition (Why did their income change?)
For each household group, a waterfall/stacked bar showing:
| Channel | CGE Source | What It Means |
|:---|:---|:---|
| **Wage income change** | Factor distribution shares × wage deltas | "Unskilled wages went up, and lower quintile earns mostly from unskilled labor" |
| **Capital income change** | Factor distribution shares × rental rate delta | "Upper quintile owns most capital, and capital returns fell" |
| **Land income change** | Factor distribution shares × land rent delta | "Agriculture-dependent households gained from land rent increase" |
| **Transfer change** | Government transfer deltas | "Direct cash transfer cushioned the lower quintile" |
| **Cost of living effect** | Household-specific CPI | "But prices rose too, eating into gains" |

This waterfall is the key visual — it EXPLAINS why different groups had different outcomes.

#### Fiscal Redistribution Ledger
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Tax channel** | Revenue raised from each tax instrument | Row: "Carbon tax raised ₹X" |
| **Transfer channel** | Transfers distributed to each group | Row: "Rural transfer paid ₹Y to lower quintile" |
| **Net fiscal flow** | Tax paid minus transfers received, per household | Table showing who is net payer vs net receiver |

#### Consumption Pattern Shifts
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Consumption by sector × household** | From household demand in scenario solve | Heatmap: rows = households, columns = sectors, cells = % change |

*"Lower quintile shifted consumption away from Industrial goods (now more expensive) toward Agriculture (relatively cheaper)."*

---

## Page 4: Persona Experience (`/personas`)

### Purpose
"Here is what it FEELS LIKE for real people" — humanizing the distribution numbers.

### The Story This Page Tells
*"Ramesh, a daily wage laborer in Bihar, gains ₹4,200/year because unskilled wages rose and he receives the rural transfer. Meanwhile, Priya, a Bangalore tech worker, sees her gains eaten by higher consumer prices."*

### What It Shows

#### Persona Cards Grid
Each persona card maps one individual from the 1,080-person dataset. For each:

| Element | CGE Source → Persona Mapping | Visual |
|:---|:---|:---|
| **Name, State, Sector, Occupation** | Raw persona dataset metadata | Card header |
| **Net Impact (₹/year)** | Computed from: their factor endowments × factor price changes + transfer eligibility | Hero number: "+₹4,200" or "-₹1,800" |
| **Impact Tag** | Thresholded from net impact | Badge: "Beneficiary" / "Neutral" / "Adversely Affected" |
| **Breakdown** |  |  |
| → Tax Adjustments | Their sector's tax rate change × their income share from that sector | "+₹1,200" |
| → Cost of Living | Their consumption basket × sector price changes | "-₹800" |
| → Rebate/Transfer | Transfer eligibility based on household group | "+₹3,800" |
| **Explanation** | Generated narrative linking their profile to CGE channels | "As a low-skilled agricultural worker, Ramesh benefits from rising unskilled wages (+1.2%) and qualifies for the full rural transfer." |

#### Impact Distribution
| Element | Source | Visual |
|:---|:---|:---|
| **Histogram of net impacts** | All 1,080 personas | Distribution chart showing how many benefit vs lose |
| **Geographic heatmap** | Persona impacts aggregated by state | India map with state-level color coding |

#### Filter/Sort Controls
- By state, by sector, by income group, by impact direction
- Search by name/occupation

---

## Page 5: Persona Chat (`/persona-chat`)

### Purpose
Interactive Q&A grounded in simulation data — "Ask our personas anything."

### What It Shows (mostly unchanged, but better grounded)

| Element | Source | Visual |
|:---|:---|:---|
| **India map background** | GeoJSON + persona impacts by state | Choropleth map |
| **Chat interface** | `POST /api/persona/query` → LLM | Chat bubbles with persona opinions |
| **Grounding citations** | Narrative source snippets from all CGE sections | Citation bar |
| **Regional comparison** | LLM-generated state-level scores | Map overlay + sortable table |

> [!NOTE]
> The chat experience doesn't change structurally. What changes is that the LLM context now contains REAL CGE outputs instead of hardcoded numbers. The answers become economically grounded.

---

## Page 6: Causal Explorer (`/causality`)

### Purpose
"Here is WHY these outcomes occurred" — the transmission mechanism.

### The Story This Page Tells
*"The carbon tax raised producer prices in Industry (+2.1%), which reduced industrial output (-1.4%), which lowered demand for skilled labor, which reduced skilled wages (-0.8%), which is why the upper quintile lost income. Meanwhile, the transfer channel directly boosted lower quintile income."*

### What It Shows

#### Causal Transmission Graph
A directed acyclic graph (DAG) showing the chain:

```
Policy Shock ──→ Tax Rate Changes ──→ Producer Prices ──→ Output Changes
                                            ↓
                                      Consumer Prices ──→ Real Income ──→ Welfare (EV)
                                            ↓
                                      Factor Demand ──→ Wages & Rents ──→ Household Income
```

| Element | CGE Source | Visual |
|:---|:---|:---|
| **Instrument node** | `shocksApplied.tax_rates`, `.subsidies` | Left-side node: "Carbon Tax: +6% on Industry" |
| **Price transmission nodes** | `delta.prices[sector]` | Middle nodes: "Industry price: +2.1%" |
| **Quantity adjustment nodes** | `delta.value_added[sector]` | Middle nodes: "Industry output: -1.4%" |
| **Factor price nodes** | `delta.wages`, `delta.rental_rate` | Right-middle nodes: "Skilled wages: -0.8%" |
| **Welfare outcome nodes** | EV by household, real income deltas | Right-side nodes: "Lower EV: +₹4,200" |
| **Edge magnitudes** | Percent changes flowing through each link | Edge labels: "+2.1%" with thickness proportional to magnitude |

#### Decomposition Panel
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Channel contributions to GDP** | Decompose GDP delta by shock type | Stacked bar: "Tax channel: -0.8%, Transfer channel: +0.2%, Factor supply: +3.0%" |
| **Channel contributions to welfare** | Decompose EV by source | Stacked bar per household group |

#### Diagnostic Panel
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Selected variable deep-dive** | User clicks a node → shows upstream drivers and downstream effects | Detail card |
| **Primary driver** | Largest contributing channel to that variable | "Primary driver: Tax rate increase" |
| **Downstream outcome** | What this variable most affects | "Downstream: Lower quintile real income" |
| **Marginal effect** | Sensitivity: dOutput/dShock | "Marginal effect: 0.22" |

#### Solver Diagnostics
| Element | CGE Source | Visual |
|:---|:---|:---|
| **Market clearing checks** | Goods market, factor market residuals | Table with ✓/⚠ per market |
| **Walras' law check** | Sum of excess demands ≈ 0 | Verification badge |
| **Convergence status** | Solver norm, iterations | "Converged in 1 iteration, residual: 0.00042" |

---

## Page 7: Policy Lab (`/policy-lab`)

### Purpose
"Here is how we can do BETTER" — optimization and refinement.

### The Story This Page Tells
*"Your current policy scores 72/100 for growth and 81/100 for equity. If you increase the transfer by 15%, equity improves to 89/100 with only a 2-point growth cost. Here are the top refinements."*

### What It Shows

#### Current Policy Scorecard
| Dimension | CGE Source | How It's Computed |
|:---|:---|:---|
| **Growth Score** | GDP delta, sectoral output | 0-100 normalized from GDP % change |
| **Equity Score** | Gini delta, EV distribution | 0-100 normalized from Gini improvement + EV spread |
| **Stability Score** | CPI delta, fiscal balance | 0-100 normalized from inflation control + budget balance |
| **Composite Score** | Weighted average | Based on user's chosen objective (balanced/growth/equity) |

#### Delta Metrics (vs Baseline)
| Metric | CGE Source | Visual |
|:---|:---|:---|
| **GDP Growth** | `delta.gdp.percent` | Card: "+2.4%" with trend arrow |
| **Inflation (CPI)** | Weighted CPI delta | Card: "+1.8%" with warning if high |
| **Employment** | Labor demand change | Card: "+98k jobs" |
| **Fiscal Balance** | Tax revenue − transfers | Card: "+₹X crore" |

#### Refinement Suggestions
Generated from CGE sensitivity analysis:

| Suggestion | Method | Visual |
|:---|:---|:---|
| "Increase rural transfer by 15%" | Re-run CGE with modified transfer → compare EV | Card with expected impact: "Equity +7, Growth -2" |
| "Reduce industrial tax by 3pp" | Re-run CGE with modified tax → compare GDP | Card with expected impact: "Growth +4, Revenue -5" |
| "Add agricultural subsidy" | New shock → compare sectoral output | Card with tradeoffs |

#### Comparison Matrix
| Metric | Status Quo | Current Policy | Suggested Variant |
|:---|:---|:---|:---|
| GDP Growth | 0% | +2.4% | +2.1% |
| Gini Delta | 0 | -0.011 | -0.018 |
| Fiscal Balance | 0 | +8.3% | +5.1% |

#### Policy Interaction Analysis
| Element | Source | Visual |
|:---|:---|:---|
| **Synergies** | Policies that amplify each other's effects | "Carbon tax + Rural transfer: synergy score 34" |
| **Conflicts** | Policies that undermine each other | "Tax + Subsidy on same sector: conflict" |

---

## Page 8: Scenario Comparison (`/compare`)

### Purpose
"Here is the DECISION" — compare alternatives and choose.

### The Story This Page Tells
*"You've run 3 scenarios. Reform A maximizes growth (+3.1% GDP) but worsens equity. Reform B maximizes equity (Gini -0.022) but costs growth. The balanced option is Reform A with the transfer add-on."*

### What It Shows

#### Comparison Metrics Table
Side-by-side comparison of saved scenarios:

| Metric | CGE Source | Baseline | Scenario A | Scenario B | Scenario C |
|:---|:---|:---|:---|:---|:---|
| **Real GDP (% Δ)** | `delta.gdp.percent` | 0% | +3.1% | +1.8% | +2.4% |
| **CPI (% Δ)** | Weighted CPI | 0% | +2.4% | +0.9% | +1.8% |
| **Gini (Δ)** | Gini computation | 0 | -0.006 | -0.022 | -0.011 |
| **Govt Revenue (% Δ)** | `delta.tax_revenue.percent` | 0% | +12.1% | +3.2% | +8.3% |
| **Lower Quintile EV** | EV computation | ₹0 | +₹2,100 | +₹5,800 | +₹4,200 |
| **Upper Quintile EV** | EV computation | ₹0 | -₹4,300 | -₹1,200 | -₹1,800 |

#### Tradeoff Visualization
| Element | Source | Visual |
|:---|:---|:---|
| **Growth vs Equity scatter** | GDP delta vs Gini delta per scenario | Scatter plot with scenario labels |
| **Growth vs Fiscal Cost** | GDP delta vs revenue impact | Second scatter axis |
| **Pareto frontier** | Which scenarios are Pareto-optimal | Highlighted line |

#### Verdict
| Element | Source | Visual |
|:---|:---|:---|
| **Recommended scenario** | Scoring based on user's objective weights | "Reform A maximizes growth under configured constraints" |
| **Decision rationale** | Natural language from CGE metrics | "Hybrid path retains 91% of growth gains while cutting equity cost by 60%" |
| **Risk assessment** | From solver diagnostics + sensitivity | "Reform A is sensitive to capital supply assumptions" |

---

## Summary: CGE Data Flow → Page Mapping

| CGE Output Domain | Primary Page | Secondary Pages |
|:---|:---|:---|
| **GDP, aggregate output** | Macro Impact | Comparison, Policy Lab |
| **Sectoral output** | Macro Impact | Causal Explorer |
| **Producer / consumer prices** | Macro Impact | Causal Explorer, Distribution |
| **Factor prices (wages, rents)** | Macro Impact | Distribution, Causal Explorer |
| **Household real income** | Distribution | Personas, Comparison |
| **Household nominal income** | Distribution | Personas |
| **Household CPI** | Distribution | Personas |
| **Equivalent Variation (EV)** | Distribution | Comparison, Policy Lab |
| **Gini coefficient change** | Distribution | Comparison, Policy Lab |
| **Income decomposition (why income changed)** | Distribution | Causal Explorer |
| **Consumption by household × sector** | Distribution | — |
| **Tax revenue** | Macro Impact | Policy Lab, Comparison |
| **Fiscal redistribution (tax paid−transfer received)** | Distribution | Policy Lab |
| **Persona net impacts** | Personas | Persona Chat |
| **Persona breakdowns** | Personas | — |
| **Geographic aggregation** | Persona Chat | Personas |
| **Transmission channels (shock→price→quantity→welfare)** | Causal Explorer | — |
| **Decomposition (channel contributions)** | Causal Explorer | Policy Lab |
| **Solver diagnostics** | Causal Explorer | Macro Impact (sidebar) |
| **Market clearing checks** | Causal Explorer | — |
| **Policy scorecard** | Policy Lab | Comparison |
| **Refinement analysis** | Policy Lab | — |
| **Multi-scenario comparison** | Comparison | — |
| **Tradeoff frontier** | Comparison | — |

---

## What's NEW (didn't exist before) vs What's UPGRADED

### Entirely New Data Displays
These don't exist in the current UI at all:

1. **Equivalent Variation (EV) per household** → Distribution page — the defining feature of a real CGE welfare analysis
2. **Income decomposition waterfall** → Distribution page — WHY did this group win/lose
3. **Factor prices panel** (wages by skill, capital rental, land rent) → Macro page
4. **Consumption pattern shift heatmap** → Distribution page
5. **Fiscal redistribution ledger** (who pays, who receives) → Distribution page
6. **Transmission channel graph with real magnitudes** → Causal Explorer — currently template nodes, needs real CGE numbers
7. **Channel contribution decomposition** → Causal Explorer
8. **Market clearing diagnostic table** → Causal Explorer
9. **Pareto frontier in tradeoff chart** → Comparison page

### Upgraded Data Displays
These exist but will show REAL CGE numbers instead of hardcoded/heuristic values:

1. **GDP delta** → currently from `macro_coefficients.base_growth × intensity`, will be from CGE solver
2. **Sector deltas** → currently from hardcoded `intensity_weight`, will be from `delta.value_added`
3. **CPI** → currently a static side metric, will be from CGE consumer price computation
4. **Gini delta** → currently hardcoded `-0.011`, will be computed from real income distribution
5. **Persona net impacts** → currently from simple multipliers, will be from factor price changes × endowments
6. **Causal graph edge weights** → currently hardcoded `0.72`, will be from actual CGE transmission magnitudes
7. **Policy Lab scorecard** → currently from `analyticsEngine.js` heuristics, will be from CGE welfare measures
8. **Scenario comparison metrics** → currently from hardcoded Reform A/B, will be from actual re-runs
