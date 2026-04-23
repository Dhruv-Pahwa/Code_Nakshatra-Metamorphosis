import { runLocalOptimization } from './analyticsEngine';

// Simulation API service — calls backend and normalizes payload to frontend contract.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const REQUIRED_RESULT_KEYS = ['analysisSummary', 'macro', 'distribution', 'personas', 'causal', 'policyLab', 'scenarios'];

const isPlainObject = (value) => value != null && typeof value === 'object' && !Array.isArray(value);

const normalizePolicyType = (candidate = '') => {
  const value = String(candidate || '').toLowerCase();
  if (value === 'tax' || value === 'subsidy' || value === 'transfer') return value;
  return 'tax';
};

const normalizePolicyTemplate = (template = {}) => ({
  id: String(template.id || template.ruleId || `rule-template-${Date.now()}`),
  label: String(template.label || template.name || 'Rule Template'),
  description: String(template.description || ''),
  type: normalizePolicyType(template.type),
  ruleId: String(template.ruleId || template.id || ''),
  ruleVersion: String(template.ruleVersion || 'v1'),
  sourceFile: String(template.sourceFile || ''),
  tags: Array.isArray(template.tags) ? template.tags : [],
  triggerConditions: Array.isArray(template.triggerConditions) ? template.triggerConditions : [],
});

const createDefaultNarrative = () => ({
  mode: '',
  summary: '',
  driverSentences: [],
  sourceSnippets: [],
  frozenNumbers: {},
  guardrail: '',
  numberCheckPassed: false,
});

export const createDefaultResults = () => ({
  analysisSummary: {
    netFiscalImpact: '',
    confidenceInterval: '',
    iterativeDepth: '',
    modelDrift: '',
    latency: '',
    insightTitle: '',
    insightImplication: '',
    userIntent: '',
  },
  macro: {
    insightTitle: '',
    insightImplication: '',
    contextBridge: '',
    userIntent: '',
    currentMacroTarget: '',
    fiscalYearBaseline: '',
    wowDelta: '',
    sectors: [],
    sideMetrics: [],
    activeSimulations: [],
    regionalImpactMap: null,
    factorPrices: { wages: [], rentalRate: '', landRent: '' },
    tradeBalance: '',
    investmentSavings: '',
    narrative: createDefaultNarrative(),
  },
  distribution: {
    insightTitle: '',
    insightImplication: '',
    contextBridge: '',
    userIntent: '',
    segments: [],
    ledger: [],
    giniDelta: '',
    methodologyNote: '',
    equivalentVariation: [],
    incomeDecomposition: [],
    consumptionShifts: [],
    narrative: createDefaultNarrative(),
  },
  personas: {
    insightTitle: '',
    insightImplication: '',
    contextBridge: '',
    userIntent: '',
    description: '',
    personas: [],
    narrative: createDefaultNarrative(),
  },
  causal: {
    insightTitle: '',
    insightImplication: '',
    contextBridge: '',
    userIntent: '',
    nodes: [],
    edges: [],
    channelContributions: [],
    marketClearingChecks: [],
    diagnostic: {
      selectedVariable: '',
      primaryDriver: { name: '', value: '', label: '' },
      downstreamOutcome: { name: '', value: '', label: '' },
      explanation: '',
    },
    narrative: createDefaultNarrative(),
  },
  policyLab: {
    insightTitle: '',
    insightImplication: '',
    contextBridge: '',
    userIntent: '',
    simulationStatus: '',
    deltaMetrics: [],
    refinements: [],
    comparisonMatrix: [],
    confidence: '',
    stochasticDrift: '',
    narrative: createDefaultNarrative(),
  },
  scenarios: {
    title: '',
    insightImplication: '',
    contextBridge: '',
    userIntent: '',
    description: '',
    step: '',
    stepLabel: '',
    metrics: [],
    tradeoffData: [],
    verdict: { summary: '', detail: '' },
    reformALabel: '',
    reformBLabel: '',
    scenarioColumns: [],
    savedScenarioCount: 0,
  },
});

const mergeWithDefaults = (defaultValue, incomingValue) => {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(incomingValue) ? incomingValue : defaultValue;
  }

  if (isPlainObject(defaultValue)) {
    if (!isPlainObject(incomingValue)) return defaultValue;

    const merged = { ...defaultValue };
    Object.keys(defaultValue).forEach((key) => {
      merged[key] = mergeWithDefaults(defaultValue[key], incomingValue[key]);
    });

    Object.keys(incomingValue).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(merged, key)) {
        merged[key] = incomingValue[key];
      }
    });

    return merged;
  }

  return incomingValue == null ? defaultValue : incomingValue;
};

export const normalizeSimulationResults = (payload, options = {}) => {
  const { source = 'backend', error = null } = options;
  const defaults = createDefaultResults();

  if (!isPlainObject(payload)) {
    return {
      results: defaults,
      meta: {
        source,
        isPartial: true,
        missingKeys: [...REQUIRED_RESULT_KEYS],
        error,
      },
    };
  }

  const missingKeys = [];
  const results = {};

  REQUIRED_RESULT_KEYS.forEach((key) => {
    const hasKey = Object.prototype.hasOwnProperty.call(payload, key) && payload[key] != null;
    if (!hasKey) missingKeys.push(key);
    results[key] = mergeWithDefaults(defaults[key], hasKey ? payload[key] : undefined);
  });

  return {
    results,
    meta: {
      source,
      isPartial: missingKeys.length > 0,
      missingKeys,
      error,
    },
  };
};

export const simulationService = {
  async listPolicyTemplates() {
    try {
      const res = await fetch(`${BASE_URL}/policy/templates`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Template endpoint error (${res.status})`);
      }

      const payload = await res.json();
      const templates = Array.isArray(payload?.templates) ? payload.templates : [];
      return templates.map(normalizePolicyTemplate);
    } catch {
      return [];
    }
  },

  async simulate(policyArtifactOrPolicies, options = {}) {
    const { savedScenarios = [], comparisonScenarioIds = [] } = options;
    const requestBody = Array.isArray(policyArtifactOrPolicies)
      ? { policies: policyArtifactOrPolicies }
      : {
        policyBlock: policyArtifactOrPolicies,
        savedScenarios,
        comparisonScenarioIds,
      };

    try {
      const res = await fetch(`${BASE_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`Backend error (${res.status})`);
      }

      const payload = await res.json();
      const normalized = normalizeSimulationResults(payload, { source: 'backend' });
      return {
        ...normalized,
        payload,
        activeRunSnapshot: payload?.activeRunSnapshot || null,
      };
    } catch (error) {
      const normalized = normalizeSimulationResults(null, {
        source: 'fallback',
        error: error?.message || 'Backend unavailable',
      });
      return {
        ...normalized,
        payload: null,
        activeRunSnapshot: null,
      };
    }
  },

  async optimizePolicies({ policies = [], results = {}, objective = 'balanced' } = {}) {
    try {
      const res = await fetch(`${BASE_URL}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policies, results, objective }),
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload && typeof payload === 'object') {
          return {
            source: 'backend',
            ...payload,
          };
        }
      }
    } catch {
      // Fall through to local heuristic optimization.
    }

    return runLocalOptimization({ policies, results, objective });
  },

  async queryPersona(query, context, selectedRegion = null, mode = 'persona') {
    try {
      const res = await fetch(`${BASE_URL}/api/persona/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context, selectedRegion, mode }),
      });

      if (!res.ok) {
        throw new Error(`AI Engine error (${res.status})`);
      }

      return await res.json();
    } catch (error) {
      throw error;
    }
  },
};
