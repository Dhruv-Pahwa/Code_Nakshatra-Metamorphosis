import { create } from 'zustand';
import {
  createDefaultResults,
  normalizeSimulationResults,
  simulationService,
} from '../services/simulationService';
import {
  createPolicyFromTemplate,
  normalizePolicyFromRegistry,
  syncPolicyPrimaryWithSlider,
} from '../data/policyRegistry';

export const STEPS = [
  { id: 0, label: 'Policy Studio', path: '/policy', description: 'Define your policy framework' },
  { id: 1, label: 'Macro Impact', path: '/macro', description: 'Review aggregate economic outcomes' },
  { id: 2, label: 'Distribution', path: '/distribution', description: 'Examine distributional effects across income groups' },
  { id: 3, label: 'Personas', path: '/personas', description: 'See individual-level impact through real profiles' },
  { id: 4, label: 'Causality', path: '/causality', description: 'Understand why these outcomes occurred' },
  { id: 5, label: 'Policy Lab', path: '/policy-lab', description: 'Evaluate refinement opportunities' },
  { id: 6, label: 'Compare', path: '/compare', description: 'Compare scenarios and make your decision' },
];

const POLICY_BLOCK_VERSION = 'policyblock-v1';

const CARBON_TAX_TEMPLATE = {
  id: 'carbon_tax_india_v1',
  label: 'Carbon Tax (15% Fuel/Energy)',
  description: '15% excise on liquid fuels and coal-based power generation.',
  type: 'tax',
  ruleId: 'carbon_tax_india_v1',
  ruleVersion: 'v1',
  sourceFile: 'carbon_tax_india_v1.json',
  tags: ['RULE-BACKED', 'CLIMATE', 'TAX'],
  overrides: {
    status: 'ACTIVE',
    primaryValue: 17,
  },
};

const RURAL_TRANSFER_TEMPLATE = {
  id: 'rural_transfer_overlay_v1',
  label: 'Targeted Rural Cash Transfer',
  description: 'PM-KISAN style targeted transfer to cushion regressivity from fuel-energy taxation.',
  type: 'transfer',
  ruleId: 'carbon_plus_transfer_v1',
  ruleVersion: 'v1',
  sourceFile: 'carbon_plus_transfer_v1.json',
  tags: ['RULE-BACKED', 'RURAL', 'TRANSFER'],
  overrides: {
    status: 'ACTIVE',
    primaryValue: 0.92,
  },
};

const cloneData = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const generateRunId = () => {
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `run-${randomPart}`;
};

const buildArtifactName = (policies = []) => {
  if (policies.length === 0) return 'Baseline Policy Studio Run';
  if (policies.length === 1) return policies[0]?.name || 'Single Policy Studio Run';
  return `${policies.length}-Module India Policy Stack`;
};

const buildInitialPolicies = () => ([
  createPolicyFromTemplate({
    moduleNumber: 1,
    type: 'tax',
    ruleTemplate: CARBON_TAX_TEMPLATE,
  }),
  createPolicyFromTemplate({
    moduleNumber: 2,
    type: 'transfer',
    ruleTemplate: RURAL_TRANSFER_TEMPLATE,
  }),
]);

const createPristineRunState = () => ({
  results: createDefaultResults(),
  activeRunSnapshot: null,
  simulationMeta: {
    source: 'not-run',
    isPartial: true,
    missingKeys: [],
    error: null,
  },
  runState: 'idle',
  runStatusText: 'Awaiting first simulation run',
  lastRunAt: null,
  lastRunError: null,
});

const INITIAL_POLICIES = buildInitialPolicies();

const toShock = (policy = {}, index = 0) => {
  const sliderValue = Number.isFinite(Number(policy.sliderValue)) ? Number(policy.sliderValue) : 0;
  const primaryParam = policy.primaryParam || {};
  const secondaryParams = Array.isArray(policy.secondaryParams) ? policy.secondaryParams : [];
  const direction = primaryParam.direction === 'NEGATIVE' ? -1 : 1;
  const normalizedSlider = Math.min(100, Math.max(0, sliderValue));
  const rawIntensity = normalizedSlider / 100;
  const signedIntensity = Number((rawIntensity * direction).toFixed(4));

  // Extract targeting from secondary params for the backend
  const sectorTargetsParam = secondaryParams.find((p) => p.key === 'sectorTargets');
  const householdTargetsParam = secondaryParams.find((p) => p.key === 'householdTargets');

  return {
    id: policy.id || `shock-${index + 1}`,
    name: policy.name || `Policy Shock ${index + 1}`,
    policyType: policy.policyType || 'tax',
    status: policy.status || 'STAGING',
    sliderValue,
    intensity: rawIntensity,
    signedIntensity,
    primaryParam: {
      label: primaryParam.label || '',
      value: primaryParam.value ?? null,
      unit: primaryParam.unit || '',
      min: primaryParam.min,
      max: primaryParam.max,
      step: primaryParam.step,
      direction: primaryParam.direction || 'POSITIVE',
      ...(Array.isArray(sectorTargetsParam?.value) && { sector_targets: sectorTargetsParam.value }),
      ...(Array.isArray(householdTargetsParam?.value) && { household_targets: householdTargetsParam.value }),
    },
    secondaryParams: secondaryParams.map((param) => ({
      key: param.key || param.label,
      label: param.label || param.key,
      value: param.value ?? null,
      unit: param.unit || '',
    })),
    metadata: {
      module: policy.module || String(index + 1).padStart(2, '0'),
      layer: policy.layer || '',
      templateId: policy.templateId || null,
      ruleTemplateId: policy.ruleTemplateId || null,
      ruleId: policy.ruleId || null,
      ruleVersion: policy.ruleVersion || null,
      tags: policy.tags || [],
    },
  };
};

export const buildPolicyArtifact = (policies = [], seed = {}) => {
  const normalizedPolicies = Array.isArray(policies)
    ? policies.map((policy, index) => normalizePolicyFromRegistry(policy, index))
    : [];
  const createdAt = seed.createdAt || new Date().toISOString();
  const runId = seed.runId || generateRunId();

  return {
    id: seed.id || `policyblock-${runId}`,
    name: seed.name || buildArtifactName(normalizedPolicies),
    version: seed.version || POLICY_BLOCK_VERSION,
    createdAt,
    runId,
    shocks: normalizedPolicies.map(toShock),
    metadata: {
      source: 'PolicyStudio',
      country: 'India',
      currency: 'INR',
      modelVersion: 'LENS-V4-CAUSAL',
      policyCount: normalizedPolicies.length,
      activePolicyIds: normalizedPolicies.map((policy) => policy.id),
    },
    assumptions: [
      'Policy Studio modules are serialized as PolicyBlock shocks before every run.',
      'Slider intensity is normalized to 0..1 for deterministic CGE shock mapping.',
      'Primary and secondary parameters are retained for audit even when the current solver uses intensity.',
    ],
  };
};

const downloadJson = (filename, payload) => {
  if (typeof document === 'undefined') return;

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const useSimulationStore = create((set, get) => ({
  // ── Helpers ─────────────────────────────────────────────
  cloneData,

  // ── Policies ────────────────────────────────────────────
  policies: INITIAL_POLICIES,
  policyArtifactDraft: buildPolicyArtifact(INITIAL_POLICIES),
  lastRunPolicyArtifact: null,

  refreshPolicyArtifactDraft: () =>
    set((state) => ({
      policyArtifactDraft: buildPolicyArtifact(state.policies),
    })),

  getCurrentPolicyArtifact: () => {
    const state = get();
    if (state.policyArtifactDraft) return cloneData(state.policyArtifactDraft);
    return buildPolicyArtifact(state.policies);
  },

  exportPolicyArtifact: (artifact = null) => {
    const payload = artifact || get().lastRunPolicyArtifact || get().policyArtifactDraft || buildPolicyArtifact(get().policies);
    downloadJson(`${payload.id || 'policyblock'}.json`, payload);
    return payload;
  },

  exportPolicyBrief: () => {
    const state = get();
    const results = state.results;
    if (!results || !state.lastRunAt) {
      state.addToast({ message: 'Run a simulation first to export the brief.', type: 'error' });
      return;
    }

    const { macro, distribution, personas, causal, scenarios, analysisSummary } = results;
    
    const brief = {
      title: "Executive Policy Brief",
      generatedAt: new Date().toISOString(),
      runStatus: state.runState,
      confidence: `${analysisSummary?.confidenceInterval || 95}%`,
      baselineSource: Array.isArray(scenarios?.provenance?.sourceMetadata?.baselineSources) 
        ? scenarios.provenance.sourceMetadata.baselineSources.join(' · ') 
        : 'MOSPI / PLFS 2022-23',
      topImpacts: [
        { metric: "GDP Target", value: macro?.currentMacroTarget ? `${macro.currentMacroTarget}%` : 'N/A' },
        { metric: "Gini Delta", value: distribution?.giniDelta ? `${distribution.giniDelta > 0 ? '+' : ''}${distribution.giniDelta}%` : 'N/A' },
        { metric: "Net Fiscal Impact", value: analysisSummary?.netFiscalImpact ? `${analysisSummary.netFiscalImpact > 0 ? '+' : ''}${analysisSummary.netFiscalImpact}%` : 'N/A' }
      ],
      causalChain: Array.isArray(causal?.nodes) ? causal.nodes.map((n) => n.data?.label || '').filter(Boolean) : [],
      personaStory: personas?.narrative?.summary || personas?.personas?.[0]?.explanation || 'Persona insights unavailable.',
      recommendation: scenarios?.verdict?.summary || 'No clear recommendation.'
    };

    downloadJson(`policy-brief-${Date.now()}.json`, brief);
    state.addToast({ message: 'Policy brief exported (JSON)', type: 'success' });
  },


  // ── UI toasts ───────────────────────────────────────────
  toasts: [],

  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: Date.now(),
          title: toast.title || '',
          message: toast.message || toast.text || toast,
          type: toast.type || 'info',
          duration: toast.duration || 4000,
        },
      ],
    })),

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  addPolicy: ({ type = 'tax', presetId = null, template = null } = {}) =>
    set((state) => {
      const policies = [
        ...state.policies,
        createPolicyFromTemplate({
          moduleNumber: state.policies.length + 1,
          type,
          presetId,
          ruleTemplate: template,
        }),
      ];
      return {
        policies,
        policyArtifactDraft: buildPolicyArtifact(policies),
        lastRunPolicyArtifact: null,
        ...createPristineRunState(),
      };
    }),

  removePolicy: (id) =>
    set((state) => {
      const policies = state.policies
        .filter((p) => p.id !== id)
        .map((policy, index) => normalizePolicyFromRegistry(policy, index));
      return {
        policies,
        policyArtifactDraft: buildPolicyArtifact(policies),
        lastRunPolicyArtifact: null,
        ...createPristineRunState(),
      };
    }),

  updatePolicy: (id, updates) =>
    set((state) => {
      const policies = state.policies.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...updates };
        const parsedModule = Number.parseInt(String(p.module || '1'), 10);
        const moduleIndex = Number.isFinite(parsedModule) ? parsedModule - 1 : 0;
        return normalizePolicyFromRegistry(syncPolicyPrimaryWithSlider(merged), moduleIndex);
      });
      return {
        policies,
        policyArtifactDraft: buildPolicyArtifact(policies),
        lastRunPolicyArtifact: null,
        ...createPristineRunState(),
      };
    }),

  applyPolicyVariant: (variant = {}) =>
    set((state) => {
      const title = String(variant.name || variant.title || 'Applied Refinement');
      const detail = String(variant.policyDelta || variant.detail || variant.note || '');
      const haystack = `${title} ${detail}`.toLowerCase();
      const type = haystack.includes('subsidy') || haystack.includes('transit')
        ? 'subsidy'
        : haystack.includes('transfer') || haystack.includes('benefit') || haystack.includes('cash')
          ? 'transfer'
          : 'tax';
      const policy = createPolicyFromTemplate({
        moduleNumber: state.policies.length + 1,
        type,
      });
      const appliedPolicy = normalizePolicyFromRegistry({
        ...policy,
        name: title.toUpperCase(),
        status: 'STAGING',
        tags: ['APPLIED VARIANT', 'RULE-LINKED'],
        secondaryParams: policy.secondaryParams,
      }, state.policies.length);
      const policies = [...state.policies, appliedPolicy];
      return {
        policies,
        policyArtifactDraft: buildPolicyArtifact(policies),
        lastRunPolicyArtifact: null,
        ...createPristineRunState(),
      };
    }),

  // ── Simulation Results (empty until first run) ──────
  ...createPristineRunState(),
  isSimulating: false,
  simulationProgress: 0,

  runSimulation: async () => {
    const policyArtifact = get().getCurrentPolicyArtifact();

    // start
    set({
      isSimulating: true,
      simulationProgress: 12,
      runState: 'running',
      runStatusText: 'Submitting policy stack...',
      lastRunError: null,
      policyArtifactDraft: policyArtifact,
      lastRunPolicyArtifact: policyArtifact,
    });

    const { addToast } = get();

    try {
      addToast({ message: 'Simulation started', type: 'info' });
      
      // Phase 7: Two-step run animation
      set({ runStatusText: 'Calibrating causal linkages...', simulationProgress: 35 });
      await new Promise(r => setTimeout(r, 600));
      
      set({ runStatusText: 'Computing persona impacts...', simulationProgress: 65 });
      await new Promise(r => setTimeout(r, 600));

      const {
        results,
        meta,
        activeRunSnapshot,
      } = await simulationService.simulate(policyArtifact, {
        savedScenarios: get().savedScenarios,
        comparisonScenarioIds: get().comparisonScenarioIds,
      });

      set({ runStatusText: 'Validating simulation output...', simulationProgress: 84 });

      const sourceIsFallback = meta.source === 'fallback';
      const runState = sourceIsFallback ? 'error' : meta.isPartial ? 'partial' : 'success';
      const runStatusText = sourceIsFallback
        ? 'Completed (empty fallback)'
        : meta.isPartial
          ? 'Completed (partial data)'
          : 'Completed';

      set({
        isSimulating: false,
        simulationProgress: 100,
        runState,
        runStatusText,
        lastRunAt: Date.now(),
        lastRunError: meta.error || null,
        simulationMeta: meta,
        results,
        activeRunSnapshot,
        lastRunPolicyArtifact: policyArtifact,
      });
      if (sourceIsFallback) {
        addToast({
          message: 'Backend is unavailable. Showing empty fallback state.',
          type: 'error',
          duration: 5000,
        });
      } else if (meta.isPartial) {
        const missing = meta.missingKeys.slice(0, 3).join(', ');
        const suffix = meta.missingKeys.length > 3 ? '...' : '';
        addToast({
          message: `Simulation completed with defaults for: ${missing}${suffix}`,
          type: 'info',
          duration: 5000,
        });
      } else {
        addToast({ message: 'Simulation completed', type: 'success' });
      }
    } catch (err) {
      const message = err?.message || 'Unknown error';
      const fallback = createDefaultResults();

      set({
        isSimulating: false,
        simulationProgress: 100,
        runState: 'error',
        runStatusText: 'Failed (empty fallback loaded)',
        lastRunAt: Date.now(),
        lastRunError: message,
        simulationMeta: {
          source: 'fallback',
          isPartial: true,
          missingKeys: ['analysisSummary', 'macro', 'distribution', 'personas', 'causal', 'policyLab', 'scenarios'],
          error: message,
        },
        results: fallback,
        activeRunSnapshot: null,
        lastRunPolicyArtifact: policyArtifact,
      });

      addToast({ message: `Simulation failed: ${message}. Loaded empty fallback state.`, type: 'error' });
    }
  },

  // ── Saved Scenarios ─────────────────────────────────────
  savedScenarios: [],
  comparisonScenarioIds: [],

  saveScenario: (name) =>
    set((state) => {
      const scenarioId = Date.now();
      const normalizedName = (name || '').trim() || `Scenario ${state.savedScenarios.length + 1}`;
      const nextScenario = {
        id: scenarioId,
        name: normalizedName,
        results: state.cloneData(state.results),
        activeRunSnapshot: state.cloneData(state.activeRunSnapshot),
        policies: state.cloneData(state.policies),
        policyArtifact: state.cloneData(state.lastRunPolicyArtifact || state.policyArtifactDraft),
      };

      return {
        savedScenarios: [...state.savedScenarios, nextScenario],
        comparisonScenarioIds: state.comparisonScenarioIds.includes(scenarioId)
          ? state.comparisonScenarioIds
          : [...state.comparisonScenarioIds, scenarioId].slice(-4),
      };
    }),

  renameSavedScenario: (id, name) =>
    set((state) => ({
      savedScenarios: state.savedScenarios.map((scenario) => {
        if (scenario.id !== id) return scenario;
        const nextName = (name || '').trim();
        return {
          ...scenario,
          name: nextName || scenario.name,
        };
      }),
    })),

  removeSavedScenario: (id) =>
    set((state) => ({
      savedScenarios: state.savedScenarios.filter((s) => s.id !== id),
      comparisonScenarioIds: state.comparisonScenarioIds.filter((scenarioId) => scenarioId !== id),
    })),

  toggleScenarioForComparison: (id) =>
    set((state) => {
      const isSelected = state.comparisonScenarioIds.includes(id);
      if (isSelected) {
        return {
          comparisonScenarioIds: state.comparisonScenarioIds.filter((scenarioId) => scenarioId !== id),
        };
      }

      return {
        comparisonScenarioIds: [...state.comparisonScenarioIds, id].slice(-4),
      };
    }),

  clearScenarioComparison: () => set({ comparisonScenarioIds: [] }),

  restoreScenario: (id) =>
    set((state) => {
      const sc = state.savedScenarios.find((s) => s.id === id);
      if (!sc) return {};

      const { results, meta } = normalizeSimulationResults(sc.results, { source: 'saved-scenario' });

      const policies = Array.isArray(sc.policies)
        ? state.cloneData(sc.policies).map((policy, idx) => normalizePolicyFromRegistry(policy, idx))
        : state.policies;
      const policyArtifact = sc.policyArtifact
        ? state.cloneData(sc.policyArtifact)
        : buildPolicyArtifact(policies);

      return {
        results,
        activeRunSnapshot: sc.activeRunSnapshot ? state.cloneData(sc.activeRunSnapshot) : null,
        policies,
        policyArtifactDraft: policyArtifact,
        lastRunPolicyArtifact: policyArtifact,
        simulationMeta: meta,
        runState: 'success',
        runStatusText: 'Scenario restored',
        lastRunAt: Date.now(),
      };
    }),

  // ── Navigation / Step ───────────────────────────────────
  currentStep: 0,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, STEPS.length - 1),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  // ── Global AI Sidebar ───────────────────────────────────
  isSidebarOpen: false,
  sidebarMessages: [
    {
      role: 'assistant',
      content: "I'm your AI Policy Assistant. I can explain the data on this screen or help you analyze persona impacts. What would you like to know?"
    }
  ],
  isSidebarTyping: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  sendSidebarMessage: async (userInput, contextOverrides = {}) => {
    if (!userInput?.trim()) return;

    set((state) => ({
      sidebarMessages: [...state.sidebarMessages, { role: 'user', content: userInput }],
      isSidebarTyping: true,
    }));

    try {
      const state = get();
      const context = {
        ...state.results,
        currentStep: STEPS[state.currentStep]?.label,
        ...contextOverrides,
      };

      const data = await simulationService.queryPersona(userInput, context, null, 'assistant');
      const responseData = data.response || {};

      set((state) => ({
        sidebarMessages: [...state.sidebarMessages, {
          role: 'assistant',
          content: responseData.summary || "I've synthesized the policy insights based on your query.",
          opinions: responseData.opinions || [],
          regional_comparison: responseData.regional_comparison || null,
          suggested_questions: responseData.suggested_questions || [],
        }],
      }));
    } catch (error) {
      set((state) => ({
        sidebarMessages: [...state.sidebarMessages, {
          role: 'assistant',
          content: "Sorry, I had trouble connecting to the insights engine. Please try again later."
        }],
      }));
    } finally {
      set({ isSidebarTyping: false });
    }
  },
}));

export default useSimulationStore;
