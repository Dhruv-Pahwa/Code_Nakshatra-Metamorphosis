const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const OBJECTIVE_WEIGHTS = {
  balanced: { growth: 0.34, equity: 0.33, stability: 0.33 },
  growth: { growth: 0.6, equity: 0.2, stability: 0.2 },
  equity: { growth: 0.2, equity: 0.6, stability: 0.2 },
  stability: { growth: 0.2, equity: 0.2, stability: 0.6 },
};

const TYPE_VECTOR = {
  tax: { growth: 0.8, equity: -0.2, stability: -0.1 },
  subsidy: { growth: 0.45, equity: 0.55, stability: -0.15 },
  transfer: { growth: 0.12, equity: 0.9, stability: 0.2 },
  default: { growth: 0.3, equity: 0.3, stability: 0.3 },
};

const STATUS_MULTIPLIER = {
  ACTIVE: 1,
  STAGING: 0.88,
  DRAFT: 0.72,
};

const pairKey = (a, b) => [a, b].sort().join(':');

const INTERACTION_BASE = {
  'subsidy:tax': 0.34,
  'tax:transfer': -0.26,
  'subsidy:transfer': 0.18,
  'tax:tax': -0.1,
  'subsidy:subsidy': -0.04,
  'transfer:transfer': -0.06,
};

const formatDelta = (value) => {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded >= 0 ? '+' : '';
  return `${sign}${rounded}%`;
};

const getPolicyVector = (policyType) => TYPE_VECTOR[policyType] || TYPE_VECTOR.default;

const getObjectiveWeights = (objective) => OBJECTIVE_WEIGHTS[objective] || OBJECTIVE_WEIGHTS.balanced;

const buildPolicyContribution = ({ policy, confidenceFactor, driftFactor }) => {
  const type = policy.policyType || 'tax';
  const vector = getPolicyVector(type);
  const statusMultiplier = STATUS_MULTIPLIER[policy.status] || 0.8;
  // Prefer signedIntensity (-1..+1) if the policy carries it;
  // fall back to raw (sliderValue/100) treated as positive.
  const signedRaw = policy.signedIntensity ?? policy.primaryParam?.signedIntensity;
  const intensity = signedRaw != null
    ? clamp(parseNumber(signedRaw, 0), -1, 1)
    : clamp((parseNumber(policy.sliderValue, 0)) / 100, 0, 1);

  const leverage = (0.32 + (0.98 * intensity)) * statusMultiplier * confidenceFactor;

  const growth = vector.growth * leverage;
  const equity = vector.equity * leverage;
  const stability = vector.stability * leverage;

  const impactScore = clamp(Math.round(52 + (growth * 28) + (equity * 20) + (stability * 18)), 0, 100);
  const riskScore = clamp(Math.round((Math.abs(intensity - 0.5) * 92) + (driftFactor * 2200) + (policy.status === 'DRAFT' ? 9 : 0)), 0, 100);

  return {
    policyId: policy.id,
    policyName: policy.name,
    policyType: type,
    intensity,
    impactScore,
    riskScore,
    growthContribution: growth,
    equityContribution: equity,
    stabilityContribution: stability,
  };
};

const buildInteractions = (contributions) => {
  const interactions = [];

  for (let i = 0; i < contributions.length; i += 1) {
    for (let j = i + 1; j < contributions.length; j += 1) {
      const left = contributions[i];
      const right = contributions[j];
      const base = INTERACTION_BASE[pairKey(left.policyType, right.policyType)] ?? 0;
      const intensityAffinity = 1 - Math.abs(left.intensity - right.intensity);
      const score = Math.round(((base * 100) + (intensityAffinity * 18)) * 10) / 10;

      const interactionType = score >= 15 ? 'synergy' : score <= -15 ? 'conflict' : 'neutral';
      if (interactionType === 'neutral') continue;

      const recommendation = interactionType === 'synergy'
        ? `Couple ${left.policyName} with ${right.policyName} to amplify transmission strength.`
        : `Sequence ${left.policyName} and ${right.policyName} to avoid channel interference.`;

      interactions.push({
        id: `${left.policyId}-${right.policyId}`,
        leftPolicyId: left.policyId,
        rightPolicyId: right.policyId,
        leftPolicyName: left.policyName,
        rightPolicyName: right.policyName,
        type: interactionType,
        score,
        recommendation,
      });
    }
  }

  return interactions.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 8);
};

const buildDecomposition = (contributions) => {
  const sumAbs = (key) => contributions.reduce((acc, item) => acc + Math.abs(item[key]), 0) || 1;

  const growthTotal = sumAbs('growthContribution');
  const equityTotal = sumAbs('equityContribution');
  const stabilityTotal = sumAbs('stabilityContribution');

  return contributions
    .map((item) => ({
      policyId: item.policyId,
      policyName: item.policyName,
      impactScore: item.impactScore,
      riskScore: item.riskScore,
      growthPct: Math.round((Math.abs(item.growthContribution) / growthTotal) * 100),
      equityPct: Math.round((Math.abs(item.equityContribution) / equityTotal) * 100),
      stabilityPct: Math.round((Math.abs(item.stabilityContribution) / stabilityTotal) * 100),
    }))
    .sort((a, b) => b.impactScore - a.impactScore);
};

const buildSuggestions = ({ policies, contributions, objective }) => {
  const weights = getObjectiveWeights(objective);

  return policies
    .map((policy) => {
      const contribution = contributions.find((item) => item.policyId === policy.id);
      if (!contribution) return null;

      const typeVector = getPolicyVector(policy.policyType);
      const alignment = (typeVector.growth * weights.growth)
        + (typeVector.equity * weights.equity)
        + (typeVector.stability * weights.stability);

      const currentSlider = clamp(parseNumber(policy.sliderValue, 0), 0, 100);
      const delta = alignment >= 0.2
        ? Math.round(6 + (alignment * 8))
        : -Math.round(5 + ((0.2 - alignment) * 8));

      const targetSliderValue = clamp(currentSlider + delta, 0, 100);
      const change = targetSliderValue - currentSlider;

      const priority = Math.abs(change) > 10 ? 'high' : Math.abs(change) > 5 ? 'medium' : 'low';

      return {
        id: `suggest-${policy.id}`,
        policyId: policy.id,
        title: `${change >= 0 ? 'Increase' : 'Reduce'} ${policy.name}`,
        rationale: `Alignment score ${alignment.toFixed(2)} against objective '${objective}'.`,
        currentSliderValue: currentSlider,
        targetSliderValue,
        expectedGdpDelta: formatDelta(change * 0.05),
        expectedEquityDelta: formatDelta((typeVector.equity * change) * 0.08),
        expectedStabilityDelta: formatDelta((typeVector.stability * change) * 0.08),
        priority,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const weight = { high: 3, medium: 2, low: 1 };
      return weight[b.priority] - weight[a.priority];
    })
    .slice(0, 6);
};

const buildScorecard = ({ contributions, objective, results }) => {
  const weights = getObjectiveWeights(objective);
  const growthBase = parseNumber(results?.macro?.currentMacroTarget, 2);
  const giniDelta = parseNumber(results?.distribution?.giniDelta, -0.01);
  const inflation = parseNumber(
    results?.policyLab?.deltaMetrics?.find((metric) => metric.label === 'INFLATION')?.value,
    -0.3
  );

  const growthSignal = contributions.reduce((acc, item) => acc + item.growthContribution, 0);
  const equitySignal = contributions.reduce((acc, item) => acc + item.equityContribution, 0);
  const stabilitySignal = contributions.reduce((acc, item) => acc + item.stabilityContribution, 0);

  const growthScore = clamp(Math.round(50 + (growthBase * 8) + (growthSignal * 24)), 0, 100);
  const equityScore = clamp(Math.round(52 + (Math.abs(giniDelta) * 480) + (equitySignal * 22)), 0, 100);
  const stabilityScore = clamp(Math.round(50 + ((-inflation) * 18) + (stabilitySignal * 24)), 0, 100);

  const composite = Math.round(
    (growthScore * weights.growth)
    + (equityScore * weights.equity)
    + (stabilityScore * weights.stability)
  );

  return {
    growthScore,
    equityScore,
    stabilityScore,
    compositeScore: clamp(composite, 0, 100),
  };
};

export const runLocalOptimization = ({ policies = [], results = {}, objective = 'balanced' }) => {
  const confidenceRaw = parseNumber(results?.policyLab?.confidence, 98.2);
  const confidenceFactor = clamp(confidenceRaw / 100, 0.5, 1.1);
  const driftFactor = parseNumber(results?.policyLab?.stochasticDrift, 0.04) / 100;

  const contributions = policies.map((policy) => buildPolicyContribution({
    policy,
    confidenceFactor,
    driftFactor,
  }));

  const interactions = buildInteractions(contributions);
  const decomposition = buildDecomposition(contributions);
  const suggestions = buildSuggestions({ policies, contributions, objective });
  const scorecard = buildScorecard({ contributions, objective, results });

  return {
    source: 'local-heuristic',
    objective,
    interactions,
    decomposition,
    suggestions,
    scorecard,
  };
};
