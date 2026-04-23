// ============================================================
// MOCK DATA — Indian Economic Context
// Insight copy: analytical, decisive, guiding interpretation
// ============================================================

export const mockPolicies = [
  {
    id: 'pol-001',
    module: '01',
    layer: 'FISCAL LAYER',
    name: 'CORPORATE TAX RATIONALISATION',
    status: 'ACTIVE',
    primaryParam: { label: 'EFFECTIVE TAX RATE', value: '22', unit: '%' },
    sliderValue: 35,
    secondaryParams: [
      { label: 'THRESHOLD', value: '₹1.5 Cr' },
      { label: 'DECAY RATE', value: '0.03 / yr' },
      { label: 'SMOOTHING', value: 'LINEAR' },
    ],
  },
  {
    id: 'pol-002',
    module: '02',
    layer: 'REDISTRIBUTION LAYER',
    name: 'RURAL INCOME SUPPORT SCHEME',
    status: 'STAGING',
    primaryParam: { label: 'TARGET GINI OFFSET', value: '0.82', unit: '' },
    sliderValue: 60,
    secondaryParams: [
      { label: 'CAP FLOOR', value: '₹18,000' },
      { label: 'AUDIT CYCLE', value: 'QUARTERLY' },
      { label: 'ALLOCATION', value: 'AUTOMATED' },
    ],
  },
];

export const mockAnalysisSummary = {
  netFiscalImpact: '+3.8',
  confidenceInterval: '97.2',
  iterativeDepth: '14,000 steps',
  modelDrift: '0.002%',
  latency: '38ms',
  insightTitle:
    'You\'ve defined a 2-policy fiscal framework targeting corporate tax rationalization and rural redistribution.',
  insightImplication:
    'This stack is projected to produce a +3.8% net fiscal surplus with 97.2% confidence. Proceed to see the macro-level effects.',
  userIntent:
    'Configure and refine your policy modules, then commit to run the simulation.',
};

// ── Macro Impact ──────────────────────────────────────────
export const mockMacro = {
  insightTitle:
    'GDP stabilises at +2.4% — your policy stack accelerates growth without triggering inflationary pressure.',
  insightImplication:
    'Industrial production leads the trajectory. Agricultural output shows minor contraction worth monitoring before moving to distributional analysis.',
  contextBridge:
    'Based on your Corporate Tax Rationalisation + Rural Income Support policies...',
  userIntent:
    'Review the aggregate economic outcome and assess whether the macro trajectory warrants proceeding to distributional analysis.',
  currentMacroTarget: '2.4',
  fiscalYearBaseline: '₹295.8T',
  wowDelta: '+0.74% WoW',
  sectors: [
    { name: 'Industrial Production', subtitle: 'MANUFACTURING INDEX', value: 54.2, delta: '+1.2%' },
    { name: 'Service Sector', subtitle: 'NON-MANUFACTURING PMI', value: 58.9, delta: '+0.4%' },
    { name: 'Agricultural Output', subtitle: 'KHARIF SEASON DATA', value: 61.5, delta: '-0.8%' },
  ],
  sideMetrics: [
    { label: 'PRICE INDEX (CPI)', value: '4.1', unit: '%', note: 'Inflation pressure within RBI tolerance band.' },
    { label: 'YIELD CURVE', value: '7.2', unit: '%', note: 'Benchmark 10-yr G-sec benchmark stability.' },
  ],
  activeSimulations: [
    { name: 'Expansionary Alpha', status: 'RUNNING' },
    { name: 'Contractionary Beta', status: 'IDLE' },
    { name: 'Status Quo Gamma', status: 'COMPLETE' },
  ],
};

// ── Distribution Impact ───────────────────────────────────
export const mockDistribution = {
  insightTitle:
    'Your tax restructuring is progressive: burden shifts upward while lower quintiles gain +7.2% purchasing power.',
  insightImplication:
    'The Gini coefficient improves by -0.014, confirming a net redistributive effect. Consider reinvestment weighting before examining individual-level effects.',
  contextBridge:
    'The +2.4% GDP growth from your macro analysis translates into uneven distributional effects across income groups.',
  userIntent:
    'Assess whether the distributional balance across income segments supports your policy objectives.',
  segments: [
    {
      id: 'lower',
      segmentLabel: 'LOWER QUINTILE',
      name: 'Consumer Resilience',
      delta: '+7.2',
      description: 'Disposable Income Delta',
      netImpact: '+₹11,400 / yr',
    },
    {
      id: 'median',
      segmentLabel: 'MEDIAN HOUSEHOLD',
      name: 'Market Equilibrium',
      delta: '+1.4',
      description: 'Disposable Income Delta',
      netImpact: '+₹3,800 / yr',
    },
    {
      id: 'upper',
      segmentLabel: 'UPPER DECILE',
      name: 'Capital Correction',
      delta: '-4.1',
      description: 'Disposable Income Delta',
      netImpact: '-₹1,82,000 / yr',
    },
  ],
  ledger: [
    { name: 'Standard Deduction Expansion', delta: '+2.3%' },
    { name: 'Surcharge on High-Income Earners', delta: '-0.6%' },
    { name: 'Capital Gains Tier Adjustment', delta: '-2.1%' },
  ],
  giniDelta: '-0.014',
  methodologyNote:
    'The current projection assumes static behavioural responses across all deciles. Secondary market effects including capital flight or labour supply adjustments are not factored into this view.',
};

// ── Persona Experience ────────────────────────────────────
export const mockPersonas = {
  insightTitle:
    'Urban professionals benefit most (+₹1.04L). Rural cohorts face marginal contraction — targeted offsets may be warranted.',
  insightImplication:
    'The largest beneficiary receives 27x the impact of the most affected negative cohort. This asymmetry is typical for broad fiscal policy but should inform refinements.',
  contextBridge:
    'The distributional shifts identified above manifest as specific changes to individual purchasing power across demographic profiles.',
  userIntent:
    'Identify which demographic cohorts are most affected and whether the impact distribution aligns with your policy goals.',
  description:
    'Aggregated simulation data suggests a concentrated benefit within mid-to-high income brackets, primarily driven by property tax indexing and energy rebates.',
  personas: [
    {
      id: 'p1',
      name: 'Priya Sharma',
      region: 'Karnataka',
      sector: 'Urban Professional, Tech Sector',
      description:
        'Impacted primarily by removal of regional transport levy and introduction of the tech-sector specific tax holiday. Offset by rising residential utility costs in metro areas.',
      netImpact: '+₹1,04,200',
      tag: 'Top 5th Percentile Beneficiary',
      tagType: 'positive',
      breakdown: {
        taxAdjustments: '+₹38,000 / yr',
        costOfLiving: '-₹15,600 / yr',
        rebateCredit: '+₹81,800 / yr',
      },
    },
    {
      id: 'p2',
      name: 'Rajesh Kumar',
      region: 'Uttar Pradesh',
      sector: 'Public Sector, Education',
      description:
        'Negative impact due to reduction in municipal pension matching and increased cess on educational materials, only partially mitigated by the general energy credit.',
      netImpact: '-₹18,200',
      tag: 'Moderate Negative Variance',
      tagType: 'negative',
      breakdown: {
        taxAdjustments: '-₹8,400 / yr',
        costOfLiving: '+₹2,200 / yr',
        rebateCredit: '-₹12,000 / yr',
      },
    },
    {
      id: 'p3',
      name: 'Meena Pillai',
      region: 'Maharashtra',
      sector: 'Small Business Owner, Logistics',
      description:
        'Significant gains realised through SME fuel subsidy programme and revised corporate threshold adjustments. High sensitivity to potential logistics tariff changes.',
      netImpact: '+₹72,400',
      tag: 'Upper Quartile Growth',
      tagType: 'positive',
      breakdown: {
        taxAdjustments: '+₹42,000 / yr',
        costOfLiving: '-₹8,000 / yr',
        rebateCredit: '+₹38,400 / yr',
      },
    },
    {
      id: 'p4',
      name: 'Arjun Singh',
      region: 'Delhi',
      sector: 'Rural Resident, Agriculture',
      description:
        'Marginal contraction due to removal of rural-specific broadband subsidies and rising logistics costs for agricultural distribution.',
      netImpact: '-₹3,800',
      tag: 'Low Negative Variance',
      tagType: 'negative',
      breakdown: {
        taxAdjustments: '-₹1,200 / yr',
        costOfLiving: '+₹600 / yr',
        rebateCredit: '-₹3,200 / yr',
      },
    },
  ],
};

// ── Causal Explorer ───────────────────────────────────────
export const mockCausal = {
  insightTitle:
    'Corporate Tax adjustments drive GDP gains through a fiscal multiplier. The causal chain is direct and high-confidence.',
  insightImplication:
    'Employment elasticity in manufacturing clusters shows the strongest downstream response. This is the primary transmission channel for your policy effects.',
  contextBridge:
    'The persona-level impacts above are driven by the causal relationships mapped here — understanding these chains clarifies why specific cohorts gain or lose.',
  userIntent:
    'Trace the causal chain from your policy inputs to economic outcomes. Identify which transmission channels are strongest.',
  nodes: [
    { id: 'n1', type: 'instrument', position: { x: 80, y: 200 }, data: { label: 'Interest Rates', sublabel: 'INSTRUMENT' } },
    { id: 'n2', type: 'variable', position: { x: 320, y: 80 }, data: { label: 'Consumer Spend', sublabel: 'VARIABLE' } },
    { id: 'n3', type: 'activeChoice', position: { x: 200, y: 380 }, data: { label: 'Corporate Tax', sublabel: 'ACTIVE CHOICE' } },
    { id: 'n4', type: 'multiplier', position: { x: 480, y: 320 }, data: { label: 'Fiscal Multiplier', sublabel: 'MULTIPLIER' } },
    { id: 'n5', type: 'variable', position: { x: 680, y: 180 }, data: { label: 'GDP Growth', sublabel: 'OUTCOME' } },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', type: 'active' },
    { id: 'e2', source: 'n3', target: 'n4', type: 'active' },
    { id: 'e3', source: 'n2', target: 'n4', type: 'latent', animated: true },
    { id: 'e4', source: 'n4', target: 'n5', type: 'active' },
    { id: 'e5', source: 'n1', target: 'n4', type: 'latent', animated: true },
  ],
  diagnostic: {
    selectedVariable: 'Fiscal Multiplier',
    primaryDriver: { name: 'Corporate Tax Adjustment', value: '+0.22', label: 'Marginal Impact' },
    downstreamOutcome: { name: 'Regional Employment', value: '94%', label: 'Statistical Confidence' },
    explanation:
      'The current policy adjustment lowers the effective tax floor for regional SMEs, triggering a direct increase in liquidity. This liquidity is funnelled into labour-intensive capital expenditures, resulting in elevated employment elasticity across manufacturing clusters.',
  },
};

// ── Policy Lab ────────────────────────────────────────────
export const mockPolicyLab = {
  insightTitle:
    'Proposed refinements yield +2.4% GDP growth with -0.6% inflation cooling — a net positive trajectory for labour markets.',
  insightImplication:
    'Short-term fiscal contraction is the trade-off. The confidence interval of 98.2% suggests this is a reliable projection worth acting on.',
  contextBridge:
    'Based on the causal analysis, the system has identified refinement opportunities to strengthen your policy stack\'s outcomes.',
  userIntent:
    'Evaluate proposed refinements and decide whether to accept, modify, or reject the system\'s optimization suggestions.',
  simulationStatus: 'Active',
  deltaMetrics: [
    { label: 'GDP GROWTH', value: '+2.4', unit: '%', note: 'Projected acceleration driven by capital gains reinvestment.', trend: 'up' },
    { label: 'INFLATION', value: '-0.6', unit: '%', note: 'Marginal cooling of consumer price index expected by Q3.', trend: 'down', type: 'warning' },
    { label: 'EMPLOYMENT', value: '+98k', unit: '', note: 'Net new positions in high-tech manufacturing sector.', trend: 'up' },
  ],
  refinements: [
    { name: 'Corporate Levy Structuring', priority: 'PRIORITY A', progress: 75 },
    { name: 'R&D Tax Incentive Buffer', priority: 'PENDING REVIEW', progress: 25 },
  ],
  comparisonMatrix: [
    { metric: 'Marginal Utility per Capita', statusQuo: '4.22', simX: '4.89', simY: '4.45', variance: '+15.8%', varType: 'positive' },
    { metric: 'Asset Liquidity Ratio', statusQuo: '0.64', simX: '0.61', simY: '0.62', variance: '-4.6%', varType: 'negative' },
    { metric: 'External Debt Exposure', statusQuo: '₹2.1T', simX: '₹1.8T', simY: '₹2.0T', variance: '-14.2%', varType: 'positive' },
  ],
  confidence: '98.2%',
  stochasticDrift: '0.04%',
};

// ── Scenario Comparison ───────────────────────────────────
export const mockScenarios = {
  title: 'Reform A maximises short-term output but creates structural fiscal overhang by year 7. A hybrid path is recommended.',
  insightImplication:
    'The analytical verdict suggests a tertiary approach: combine Reform A\'s velocity with Reform B\'s stability for optimal outcomes.',
  contextBridge:
    'All scenarios below are derived from the same policy stack you defined, analysed through macro, distributional, persona, and causal lenses.',
  userIntent:
    'Compare reform scenarios side-by-side and commit the optimal policy path for implementation.',
  description:
    'A comparative analysis of economic trajectory across baseline and proposed fiscal reforms to determine the optimal policy path.',
  step: '07',
  stepLabel: 'FINAL REVIEW',
  metrics: [
    { name: 'GDP Growth Rate', sub: 'Annualised percentage', baseline: '2.1%', reformA: '3.4%', reformADelta: '↑1.3%', reformB: '1.4%', reformBDelta: '↓0.7%', reformAType: 'positive', reformBType: 'negative' },
    { name: 'Debt-to-GDP Ratio', sub: 'Projected 10yr average', baseline: '82%', reformA: '90%', reformADelta: '↑8.0%', reformB: '74%', reformBDelta: '↓8.0%', reformAType: 'negative', reformBType: 'positive' },
    { name: 'Unemployment', sub: 'Structural average', baseline: '7.4%', reformA: '6.8%', reformADelta: '↓0.6%', reformB: '7.9%', reformBDelta: '↑0.5%', reformAType: 'positive', reformBType: 'negative' },
    { name: 'Consumer Price Index', sub: 'Inflation target variance', baseline: '4.0%', reformA: '4.8%', reformADelta: '↑0.8%', reformB: '3.7%', reformBDelta: '↓0.3%', reformAType: 'negative', reformBType: 'positive' },
  ],
  tradeoffData: [
    { name: 'Status Quo', growth: 40, debt: 35 },
    { name: 'Reform A', growth: 72, debt: 72 },
    { name: 'Reform B', growth: 25, debt: 18 },
  ],
  verdict: {
    summary: '"Reform A maximises short-term output but creates a structural fiscal overhang by year 7."',
    detail:
      'The trade-off suggests a Tertiary Alpha path: a hybrid approach may yield the stability of Reform B with the velocity of Reform A.',
  },
  reformALabel: 'REFORM A — Fiscal Stimulus',
  reformBLabel: 'REFORM B — Austerity Plus',
};
