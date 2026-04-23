# 🎯 VISION SPEC v2 — REFACTORING GUIDE
### *Policy → Consequences: Causal, Auditable, India-Focused*

> **Purpose**: Refactor the existing "Insight Shell" into a **credible, causal decision assistant** for hackathon demo. Minimal UI changes. Maximum pipeline integrity.

---

## 🔐 CORE IDENTITY (LOCKED)

Your product is:
> **A structured policy simulation system that uses a hybrid engine (mock rules now, CGE later) to generate macroeconomic outcomes, translates those into distributional and individual impacts, explains them through traceable causal chains, and enables economists to iteratively refine policies—with LLMs generating narrative insights, not numbers.**

**Non-negotiables**:
- ✅ Policy is the single source of truth (not sliders)
- ✅ Every number has a driver sentence + provenance
- ✅ Personas are computed from distribution, not cosmetic
- ✅ Causal chain is auditable, not decorative
- ✅ LLMs = narrative only; never compute numbers

---

## ⚙️ ARCHITECTURE (HYBRID MOCK → CGE)

```txt
Policy Input (PolicyBlocks)
   ↓
Mock Engine (rule-based propagation) ← [CGE placeholder]
   ↓
Macro KPIs + Distribution Metrics (hardcoded but consistent)
   ↓
Persona Context (Nemotron profile + distributional changes)
   ↓
LLM Narrative Layer (insights only, numbers frozen)
   ↓
Causal Chain (predefined edge list + magnitudes)
   ↓
PolicyLab Suggestions (rule-based variants + LLM plain-English tradeoffs)
   ↓
Exportable Policy Artifact (JSON/PDF)
```

### 🔹 Mock Engine Strategy (Now)
- **Format**: JSON rule registry (`rules/*.json`)
- **Logic**: Deterministic, India-calibrated, climate/equity focused
- **Placeholder**: Each rule includes `"cge_ready": true` flag + schema for future model injection

**Example Rule** (`rules/carbon_tax_india.json`):
```json
{
  "policy_id": "carbon_tax_v1",
  "trigger_conditions": ["fuel_tax_increase", "energy_subsidy_removal"],
  "macro_effects": {
    "gdp_change": "-0.4%",
    "cpi_change": "+2.1%",
    "sectoral_output": {"manufacturing": "-3%", "services": "+0.5%", "agriculture": "-1%"}
  },
  "distribution_effects": {
    "poor": {"real_income": "-5%", "copc_change": "+8%", "wage_index": "-2%"},
    "middle": {"real_income": "-2%", "copc_change": "+3%", "wage_index": "-0.5%"},
    "rich": {"real_income": "-0.5%", "copc_change": "+1%", "wage_index": "0%"}
  },
  "causal_chain": [
    {"step": "Carbon Tax ↑", "effect": "Energy Price ↑15%", "magnitude": "high"},
    {"step": "Energy Price ↑15%", "effect": "Manufacturing Cost ↑3%", "magnitude": "medium"},
    {"step": "Manufacturing Cost ↑3%", "effect": "Wages ↓1.2%", "magnitude": "low"},
    {"step": "Wages ↓1.2% + CPI ↑2.1%", "effect": "Poor Real Income ↓5%", "magnitude": "high"}
  ],
  "cge_placeholder": {
    "required_inputs": ["sectoral_io_table", "household_expenditure_matrix"],
    "expected_outputs": ["price_vector", "wage_vector", "output_vector"]
  }
}
```

### 🔹 LLM Integration Blueprint
| Layer | LLM Role | Input (Frozen) | Output (Narrative) | Guardrail |
|-------|----------|----------------|-------------------|-----------|
| MacroImpact | Driver sentences | KPI changes + sectoral contributors | "Growth slows slightly as higher energy costs temper industrial output…" | "Use only provided numbers" |
| DistributionImpact | Equity framing | Rich/poor/middle metrics | "The poor bear 5x the burden due to higher energy share in budget" | "No new metrics invented" |
| PersonaExperience | Lived-experience narrative | Nemotron profile + distributional changes | "Ramesh, a marginal farmer, reduces non-food spending to cope…" | "Ground in baseline consumption basket" |
| CausalExplorer | Plain-English chain explanation | Causal edge list + magnitudes | "The tax raises energy costs, which ripple through manufacturing…" | "Preserve edge order + magnitude labels" |
| PolicyLab | Tradeoff phrasing + refinement suggestions | Rule-based variants + outcome deltas | "Adding a rural transfer offsets 80% of poor income loss, at 0.2% GDP cost" | "Suggestions must reference concrete deltas" |

**Prompt Template Pattern**:
```
You are a policy analyst explaining simulation results to an economist.

COMPUTED INPUTS (DO NOT CHANGE):
{hardcoded_metrics_json}

TASK: {specific_narrative_task}
CONSTRAINT: Use only the numbers provided. Do not invent new data, metrics, or causal links.
TONE: Professional, concise, India-context aware.
```

---

## 🧭 MINIMAL UI CHANGES (ONLY WHAT'S NECESSARY)

> 🚫 Do NOT redesign pages. ✅ Add only the hooks that enable causal integrity.

### 🔹 PolicyStudio.jsx
- **Add**: PolicyBlock metadata panel (name, version, description, export JSON button)
- **Add**: "Policy Artifact Preview" toggle (shows the JSON spec that drives the run)
- **Keep**: Existing sliders/cards, but wrap them in `PolicyBlock` objects

### 🔹 MacroImpact.jsx
- **Add**: One-sentence "Driver Summary" below each KPI card (pulled from LLM or rule)
- **Add**: Hover tooltip showing "Top contributors" (e.g., "Energy price +15% → GDP -0.4%")
- **Keep**: Existing charts; just attach narrative hooks

### 🔹 DistributionImpact.jsx
- **Add**: "Why this group?" expandable panel per income quintile (shows top 2 causal channels from rule)
- **Add**: Toggle: % change vs ₹ change (default to % for hackathon clarity)
- **Keep**: Existing Gini/segment charts

### 🔹 PersonaExperience.jsx
- **Add**: "Computed Impact" badge on each persona card (shows real_income Δ, wage Δ, copc Δ)
- **Add**: LLM-generated "Lived Experience" snippet (2 sentences max) below persona bio
- **Keep**: Existing map + card layout; just ground the content

### 🔹 CausalExplorer.jsx
- **Add**: Edge labels showing magnitude (e.g., "↑15%") + confidence badge (e.g., "high")
- **Add**: Click-to-highlight: clicking a node shows "What-if: remove this shock?" counterfactual preview (mocked)
- **Keep**: Existing graph visual; just make edges informative

### 🔹 PolicyLab.jsx
- **Add**: "Why this variant?" panel per suggestion (shows policy delta + outcome improvement + tradeoff in plain English)
- **Add**: "Apply this refinement" button that pre-fills PolicyStudio with the variant
- **Keep**: Existing variant cards; just add accountability hooks

### 🔹 Global Additions
- **Run Status**: Add a 2-step progress indicator ("Calibrating linkages…", "Computing impacts…") with 3-5 sec animation
- **Confidence Badge**: Top-right of results: "Illustrative Scenario | Simplified CGE Logic | Baseline: NSSO 2023"
- **Export Policy Brief**: One-click PDF/JSON export with headline, top 3 impacts, causal chain, persona story, recommendation

---

## 🔄 REFACTORING PRIORITIES (ORDER OF OPERATIONS)

1. **PolicyBlock Schema** (Day 1)
   - Wrap existing inputs in `{id, name, shocks[], metadata}` structure
   - Add export JSON function (this becomes the "single source of truth")

2. **Mock Rule Registry** (Day 1-2)
   - Create `rules/` folder with 2-3 India/climate demo rules
   - Build simple rule engine: `policyBlocks → matching rule → effects object`

3. **Narrative Hooks** (Day 2)
   - Add driver sentence placeholder to MacroImpact cards
   - Add "Why this group?" panel to DistributionImpact
   - Ground PersonaExperience with computed metrics + LLM snippet

4. **Causal Chain Data Flow** (Day 3)
   - Ensure rule's `causal_chain` array flows to CausalExplorer
   - Add edge labels + magnitude badges (minimal visual tweak)

5. **LLM Integration Scaffold** (Day 3-4)
   - Create prompt template utility with guardrails
   - Wire LLM calls to narrative layers (mock response fallback for demo)

6. **Exportable Artifact** (Day 4)
   - Build "Policy Brief" generator (HTML→PDF or JSON download)
   - Include: policy spec, top outcomes, causal chain, persona story, recommendation

7. **Demo Polish** (Day 5)
   - Add run animation + confidence badge
   - Pre-load one compelling scenario (Carbon Tax + Rural Transfer)
   - Script 90-second demo narrative (see below)

---

## 🎯 HACKATHON DEMO NARRATIVE (90 SECONDS)

```
[0:00] "We start with a policy: Carbon Tax + Rural Cash Transfer."
[0:10] PolicyStudio: Show composable blocks, export JSON preview

[0:20] "Run the simulation…"
[0:25] Progress animation: "Calibrating sectoral linkages…"

[0:30] "Macro impact: GDP dips slightly, but services hold steady."
[0:35] MacroImpact: Show GDP card with driver sentence + contributor tooltip

[0:40] "But look at distribution: the poor lose 5x more than the rich."
[0:45] DistributionImpact: Show diverging bars + "Why this group?" panel

[0:50] "Meet Ramesh, a marginal farmer. His real income drops 5%."
[0:55] PersonaExperience: Show computed impact badge + LLM narrative snippet

[1:00] "Why? Trace the chain: Tax → Energy → Manufacturing → Wages → Income."
[1:10] CausalExplorer: Animate chain with magnitude labels

[1:15] "Can we do better? The Policy Lab suggests adding a targeted transfer."
[1:20] PolicyLab: Show variant with "Why this works?" panel

[1:25] "Export the brief. One page. Auditable. Ready for stakeholders."
[1:30] Show Policy Brief PDF + close

KEY INSIGHT: "A carbon tax hurts the poor 5x more—but a targeted transfer flips the outcome."
```

---

## 📏 SUCCESS CRITERIA (HACKATHON JUDGING)

✅ **Credibility**: Every number has a driver sentence + causal link  
✅ **Coherence**: Policy → Macro → Distribution → Persona → Causal chain feels computed, not cosmetic  
✅ **Actionability**: One-click export produces a stakeholder-ready brief  
✅ **India Focus**: Uses Indian data sources, policy names, state variation  
✅ **LLM Discipline**: LLMs generate narrative only; numbers are rule-based  
✅ **Demo Polish**: 90-second flow feels intentional, not rushed  

---

## 🧱 EXISTING COMPONENT REFACTORING CHEAT SHEET

| Component | Current Issue | Minimal Fix | Data Hook |
|-----------|--------------|-------------|-----------|
| `PolicyBlockCard.jsx` | Visual only | Add metadata panel + export JSON | `policyBlock.spec` |
| `MetricCard.jsx` | Snapshot numbers | Add driver sentence prop + contributor tooltip | `metric.driver_sentence`, `metric.contributors[]` |
| `DistributionCard.jsx` | Presentational | Add "Why this group?" expandable panel | `group.top_causal_channels[]` |
| `PersonaCard.jsx` | Cosmetic story | Add computed impact badge + LLM narrative snippet | `persona.computed_impact`, `persona.narrative` |
| `CausalGraphContainer.jsx` | Decorative edges | Add edge labels (magnitude) + confidence badge | `edge.magnitude`, `edge.confidence` |
| `PolicyLab.jsx` | Variant cards w/o accountability | Add "Why this variant?" panel + apply button | `variant.policy_delta`, `variant.outcome_improvement` |
| `TopBar / Run Control` | Instant results | Add 2-step progress animation + confidence badge | `run.status`, `run.confidence_note` |

---

## 🇮🇳 INDIA CALIBRATION NOTES (MOCK)

- **Baseline Sources** (cite in footnotes):
  - Consumption shares: NSSO 77th Round (2019-20)
  - Sectoral output: RBI Annual Report 2023-24
  - CPI weights: MOSPI Consumer Expenditure Survey
- **Policy Terminology**:
  - "PM-KISAN-style direct transfer"
  - "Perform, Achieve, Trade (PAT) scheme linkage"
  - "National Green Hydrogen Mission co-benefit"
- **State Variation** (if time permits):
  - Show Gujarat (industrial) vs Bihar (agrarian) impact delta
  - Use simple rule: `if state.industrial_share > 0.4 → manufacturing_impact *= 1.5`

---

## 🚀 FINAL ONE-LINER (FOR PITCH SLIDE)

> **"We don't just show policy outcomes—we trace them, explain them, and help you improve them. Built for India. Ready for decisions."**

---

This spec is **refactoring-ready**: it tells you exactly what to add, where to add it, and what to leave alone. It bridges your existing UI with the causal pipeline vision—without rebuilding from scratch.

**Next step**: Pick the top 3 refactoring priorities (I recommend: PolicyBlock Schema → Mock Rule Registry → Narrative Hooks) and start coding.
