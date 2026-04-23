import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import InsightHeader from '../components/ui/InsightHeader';
import FlowTransition from '../components/ui/FlowTransition';
import PolicyBlockCard from '../components/policy/PolicyBlockCard';
import Button from '../components/ui/Button';
import useSimulationStore from '../store/useSimulationStore';
import { POLICY_PRESETS, POLICY_TYPES } from '../data/policyRegistry';
import { simulationService } from '../services/simulationService';
import { 
  AlertTriangle, 
  Sparkles, 
  Info, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Download,
  FileJson
} from 'lucide-react';

const parseSignedNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const numeric = Number.parseFloat(String(value || '').replace(/[^0-9+-.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const toSignedPercent = (value, digits = 1) => {
  const numeric = parseSignedNumber(value);
  const sign = numeric > 0 ? '+' : '';
  return `${sign}${numeric.toFixed(digits)}%`;
};

const ImpactChip = ({ label, dir, val }) => {
  const isUp = dir === 'up';
  const isDown = dir === 'down';
  const color = isUp ? 'text-accent-positive' : isDown ? 'text-accent-negative' : 'text-text-muted';
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-bg-card border border-border rounded-full text-xs font-semibold whitespace-nowrap">
      <span className="text-text-secondary">{label}</span>
      {val && (
        <span className={`flex items-center gap-1 ${color}`}>
          {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : null}
          {val}
        </span>
      )}
      {!val && (isUp || isDown) && (
        <span className={`${color}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        </span>
      )}
    </div>
  );
};

const buildFallbackTemplates = () => POLICY_PRESETS.map((preset) => ({
  id: preset.id,
  label: preset.label,
  description: preset.description,
  type: preset.type,
  overrides: preset.overrides,
  ruleId: preset.id,
  ruleVersion: 'v1',
  sourceFile: 'frontend-policy-registry',
  tags: Array.isArray(preset?.overrides?.tags) ? preset.overrides.tags : ['LEGACY-PRESET'],
}));

const PolicyStudio = () => {
  const navigate = useNavigate();
  const {
    policies,
    results,
    simulationMeta,
    addPolicy,
    removePolicy,
    updatePolicy,
    runSimulation,
    isSimulating,
    simulationProgress,
    policyArtifactDraft,
    lastRunPolicyArtifact,
    exportPolicyArtifact,
    nextStep,
    addToast,
  } = useSimulationStore();

  const [selectedPolicyType, setSelectedPolicyType] = useState('tax');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [showArtifactPreview, setShowArtifactPreview] = useState(false);
  const [policyTemplates, setPolicyTemplates] = useState(buildFallbackTemplates);
  const [templateSource, setTemplateSource] = useState('fallback');

  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      const templates = await simulationService.listPolicyTemplates();
      if (!isMounted) return;

      if (Array.isArray(templates) && templates.length > 0) {
        setPolicyTemplates(templates);
        setTemplateSource('rules');
      } else {
        setPolicyTemplates(buildFallbackTemplates());
        setTemplateSource('fallback');
      }
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  const presetsForType = policyTemplates.filter((preset) => preset.type === selectedPolicyType);
  const selectedTemplate = presetsForType.find((preset) => preset.id === selectedPresetId) || null;
  const policiesList = Array.isArray(policies) ? policies : [];
  const activePolicyArtifact = lastRunPolicyArtifact || policyArtifactDraft;
  const activeArtifactJson = JSON.stringify(activePolicyArtifact, null, 2);

  const handleProceed = async () => {
    if (isSimulating) return;
    await runSimulation();
    nextStep();
    navigate('/macro');
  };

  const handleExportArtifact = () => {
    const exported = exportPolicyArtifact(activePolicyArtifact);
    addToast({
      message: `${exported.name || 'Policy artifact'} exported as JSON.`,
      type: 'success',
    });
  };

  const getUIInsights = (policiesCount) => {
    const hasLiveResults = simulationMeta?.source === 'backend' || simulationMeta?.source === 'saved-scenario';
    const analysisSummary = results?.analysisSummary || {};
    const macro = results?.macro || {};
    const distribution = results?.distribution || {};
    const causal = results?.causal || {};
    const segments = Array.isArray(distribution?.segments) ? distribution.segments : [];

    if (hasLiveResults) {
      const gdpTarget = parseSignedNumber(macro.currentMacroTarget);
      const fiscalImpact = parseSignedNumber(analysisSummary.netFiscalImpact);
      const giniDelta = parseSignedNumber(distribution.giniDelta);
      const sortedSegments = [...segments].sort((a, b) => parseSignedNumber(b?.delta) - parseSignedNumber(a?.delta));
      const topSegment = sortedSegments[0];
      const midSegment = sortedSegments[Math.floor(sortedSegments.length / 2)] || topSegment;
      const bottomSegment = sortedSegments[sortedSegments.length - 1] || topSegment;

      return {
        title: `${analysisSummary.insightTitle || 'Simulation run completed.'} ${analysisSummary.insightImplication || ''}`,
        gdp: { dir: gdpTarget >= 0 ? 'up' : 'down', val: toSignedPercent(gdpTarget) },
        ineq: { dir: giniDelta <= 0 ? 'down' : 'up', val: toSignedPercent(giniDelta, 3) },
        bottom40: {
          dir: parseSignedNumber(bottomSegment?.delta) >= 0 ? 'up' : 'down',
          val: toSignedPercent(bottomSegment?.delta),
        },
        sector: {
          label: topSegment?.name || 'Macro Leader',
          dir: parseSignedNumber(topSegment?.delta) >= 0 ? 'up' : 'down',
          val: toSignedPercent(topSegment?.delta),
        },
        interaction:
          policiesCount > 1
            ? {
                level: Math.min(3, policiesCount),
                type: fiscalImpact >= 0 ? 'Synergy' : 'Conflict',
                text:
                  causal?.insightImplication ||
                  'Multi-policy stack is now interpreted through solved macro and distribution channels.',
              }
            : null,
        causal:
          Array.isArray(causal?.nodes) && causal.nodes.length > 0
            ? causal.nodes.slice(0, 4).map((node) => node?.data?.label || 'Node').join(' → ')
            : 'Solved-state causal chain available after run.',
        dist: {
          top: toSignedPercent(topSegment?.delta),
          mid: toSignedPercent(midSegment?.delta),
          bot: toSignedPercent(bottomSegment?.delta),
        },
        tradeoff: {
          level: fiscalImpact >= 0 ? 'MEDIUM' : 'HIGH',
          label: 'Growth vs Equality',
          val: Math.max(10, Math.min(90, 50 + Math.round(gdpTarget * 10))),
        },
        keyInsight:
          macro?.contextBridge ||
          'Live simulation outputs are now available across macro, distribution, personas, and causal stages.',
      };
    }

    if (!hasLiveResults) {
      return {
        title: policiesCount === 0
          ? 'Define your policy stack, then execute a run to generate results.'
          : 'Policies are configured. Execute a run to generate simulation results.',
        gdp: { dir: 'neutral', val: '0%' },
        ineq: { dir: 'neutral', val: '0%' },
        bottom40: { dir: 'neutral', val: '0%' },
        sector: { label: 'Neutral', dir: 'neutral', val: '0%' },
        interaction: null,
        causal: 'Run simulation to generate first-order effect chains.',
        dist: { top: '0%', mid: '0%', bot: '0%' },
        tradeoff: { level: 'PENDING', label: 'Awaiting run', val: 50 },
        keyInsight: 'No outcomes are shown until a simulation run is executed.'
      };
    }
  };
  
  const uiInsights = getUIInsights(policiesList.length);

  // Helper for inline rendering
  const renderTitleMarkup = (htmlStr) => {
    return htmlStr.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk);
  };

  return (
    <MainLayout>
      <div className="page-enter">
        {/* Main content — full width workspace */}
        <div className="page-content pt-8 px-10">
          
          <div className="mb-10 max-w-5xl">
             <h1 className="text-3xl font-bold tracking-tight text-text-primary leading-snug mb-4 max-w-4xl">{renderTitleMarkup(uiInsights.title)}</h1>
             
             {/* Impact Preview Strip */}
             <div className="flex flex-wrap gap-2 mt-4">
               <ImpactChip label="GDP Impact" dir={uiInsights.gdp.dir} val={uiInsights.gdp.val} />
               <ImpactChip label="Inequality" dir={uiInsights.ineq.dir} val={uiInsights.ineq.val} />
               <ImpactChip label="Bottom 40% Welfare" dir={uiInsights.bottom40.dir} val={uiInsights.bottom40.val} />
               <ImpactChip label={`Key Sector: ${uiInsights.sector.label}`} dir={uiInsights.sector.dir} val={uiInsights.sector.val} />
             </div>
          </div>

          {/* Workspace: left authoring + right summary */}
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start pb-20">
            <div className="min-w-0 flex-1">
              
              <div className="flex justify-between items-end mb-4">
                 <h2 className="text-lg font-bold">Policy Stack</h2>
                 <button
                    onClick={() => addPolicy({ type: selectedPolicyType, presetId: selectedPresetId || null, template: selectedTemplate })}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                  >
                    + Add Module
                 </button>
              </div>

              {policiesList.map((policy) => (
                <PolicyBlockCard
                  key={policy.id}
                  policy={policy}
                  presetOptions={policyTemplates.filter((preset) => preset.type === policy.policyType)}
                  onUpdate={(updates) => updatePolicy(policy.id, updates)}
                  onRemove={() => removePolicy(policy.id)}
                />
              ))}

              {/* Interaction Indicator & Causal Flow (if multiple policies or active interactions) */}
              {(uiInsights.interaction || policiesList.length > 0) && (
                <div className={`mt-6 p-4 rounded-lg border flex gap-4 ${uiInsights.interaction?.type === 'Conflict' ? 'bg-bg-subtle border-accent-negative/40' : uiInsights.interaction?.type === 'Synergy' ? 'bg-bg-subtle border-accent-positive/40' : 'bg-bg-card border-border'}`}>
                  <div className="pt-1">
                     {uiInsights.interaction?.type === 'Conflict' ? (
                       <AlertTriangle className="text-accent-negative" size={18} />
                     ) : uiInsights.interaction?.type === 'Synergy' ? (
                       <Sparkles className="text-accent-positive" size={18} />
                     ) : (
                       <Info className="text-text-muted" size={18} />
                     )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-text-primary">{uiInsights.interaction?.type || 'Simulation'} {uiInsights.interaction?.type === 'Conflict' || uiInsights.interaction?.type === 'Synergy' ? 'Detected' : 'Staging'}</span>
                      {uiInsights.interaction?.level && <span className="text-[10px] font-semibold bg-bg-card border border-border px-1.5 py-0.5 rounded text-text-muted">Interaction Level {uiInsights.interaction.level}</span>}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-4 max-w-3xl">
                      {uiInsights.interaction?.text || 'Review your policy stack and proceed to simulate the net interaction effects.'}
                    </p>
                    
                    {/* Causal Chain Template */}
                    <div className="text-[11px] font-mono tracking-wider flex items-center gap-2 px-3 py-1.5 bg-bg-main border border-border rounded inline-flex text-text-secondary whitespace-nowrap overflow-x-auto max-w-full">
                        {uiInsights.causal.split('→').map((node, i, arr) => {
                           const isUp = node.includes('↑') || node.includes('↗');
                           const isDown = node.includes('↓') || node.includes('↘');
                           const cleanNode = node.replace(/[↑↗↓↘]/g, '').trim();
                           
                           return (
                             <span key={i} className="flex items-center gap-2">
                                <span className={`flex items-center gap-1 ${isUp ? 'text-accent-positive' : isDown ? 'text-accent-negative' : 'text-text-primary'}`}>
                                  {cleanNode}
                                  {isUp && <TrendingUp size={10} />}
                                  {isDown && <TrendingDown size={10} />}
                                </span>
                                {i < arr.length - 1 && <ArrowRight size={10} className="text-text-muted" />}
                             </span>
                           );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Policy Authoring Controls Dropdown block */}
              <div className="mt-8 border border-border rounded-lg bg-bg-card p-4">
                <p className="label mb-3">AUTHOR ADDITIONAL POLICY</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <label>
                  <span className="label-muted mb-1 block">Policy Type</span>
                  <select
                    value={selectedPolicyType}
                    onChange={(e) => {
                      setSelectedPolicyType(e.target.value);
                      setSelectedPresetId('');
                    }}
                    className="w-full border border-border rounded bg-bg-main px-2 py-2 text-sm text-text-primary"
                  >
                    {POLICY_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="label-muted mb-1 block">Rule Template</span>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full border border-border rounded bg-bg-main px-2 py-2 text-sm text-text-primary"
                  >
                    <option value="">Custom</option>
                    {presetsForType.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </select>
                </label>
                </div>

                <p className="text-[11px] text-text-muted mb-3">
                  Template source: {templateSource === 'rules' ? 'runtime rules registry' : 'frontend fallback presets'}
                </p>

                {selectedPresetId && (
                  <p className="text-xs text-text-secondary mb-3">
                    {presetsForType.find((preset) => preset.id === selectedPresetId)?.description || ''}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      addPolicy({ type: selectedPolicyType });
                      addToast({ message: `${selectedPolicyType.toUpperCase()} policy module added.`, type: 'success' });
                    }}
                  >
                    ADD CUSTOM MODULE
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      addPolicy({ type: selectedPolicyType, presetId: selectedPresetId || null, template: selectedTemplate });
                      addToast({ message: selectedPresetId ? 'Preset policy added.' : 'Policy module added.', type: 'success' });
                    }}
                    disabled={!selectedPresetId}
                  >
                    ADD PRESET
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Insight Panel */}
            <aside className="w-full xl:w-80 xl:shrink-0 xl:sticky xl:top-6 border border-border rounded-lg p-5 bg-bg-sidebar">
              <p className="label mb-5 font-bold tracking-widest text-text-primary border-b border-border pb-3">INSIGHT PANEL</p>

              <div className="mb-6 border-b border-border pb-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="label flex items-center gap-2">
                    <FileJson size={13} />
                    POLICY ARTIFACT
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border text-text-muted">
                    {activePolicyArtifact?.version || 'policyblock-v1'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-text-secondary">Name</span>
                    <span className="text-text-primary text-right">{activePolicyArtifact?.name || 'Policy Studio Run'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-text-secondary">Run ID</span>
                    <span className="font-mono text-[11px] text-text-primary text-right truncate max-w-[170px]">
                      {activePolicyArtifact?.runId || 'pending'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-text-secondary">Shocks</span>
                    <span className="font-mono text-text-primary">{activePolicyArtifact?.shocks?.length || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowArtifactPreview((value) => !value)}
                    className="flex-1 py-2 bg-bg-card border border-border rounded text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showArtifactPreview ? 'Hide JSON' : 'Preview JSON'}
                  </button>
                  <button
                    onClick={handleExportArtifact}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-card border border-border rounded text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Download size={13} />
                    Export
                  </button>
                </div>

                {showArtifactPreview && (
                  <pre className="mt-3 max-h-72 overflow-auto rounded border border-border bg-bg-main p-3 text-[10px] leading-relaxed text-text-secondary">
                    {activeArtifactJson}
                  </pre>
                )}
              </div>

              {/* Distributional Impact */}
              <div className="mb-6">
                <p className="label mb-3">DISTRIBUTIONAL IMPACT</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-border border-dashed pb-2">
                    <span className="text-text-secondary">Top 10%</span>
                    <span className={`font-mono text-xs ${uiInsights.dist.top.startsWith('+') ? 'text-accent-positive bg-accent-positive/10 px-1.5 py-0.5 rounded' : uiInsights.dist.top.startsWith('-') ? 'text-accent-negative bg-accent-negative/10 px-1.5 py-0.5 rounded' : 'text-text-muted'}`}>{uiInsights.dist.top}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-border border-dashed pb-2">
                    <span className="text-text-secondary">Middle 50%</span>
                    <span className={`font-mono text-xs ${uiInsights.dist.mid.startsWith('+') ? 'text-accent-positive bg-accent-positive/10 px-1.5 py-0.5 rounded' : uiInsights.dist.mid.startsWith('-') ? 'text-accent-negative bg-accent-negative/10 px-1.5 py-0.5 rounded' : 'text-text-muted'}`}>{uiInsights.dist.mid}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Bottom 40%</span>
                    <span className={`font-mono text-xs ${uiInsights.dist.bot.startsWith('+') ? 'text-accent-positive bg-accent-positive/10 px-1.5 py-0.5 rounded' : uiInsights.dist.bot.startsWith('-') ? 'text-accent-negative bg-accent-negative/10 px-1.5 py-0.5 rounded' : 'text-text-muted'}`}>{uiInsights.dist.bot}</span>
                  </div>
                </div>
                
                {policiesList.length > 0 && (
                   <button className="w-full mt-3 py-2 bg-bg-card border border-border rounded text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">
                     View Detailed Distribution
                   </button>
                )}
              </div>

              {/* Tradeoff Meter */}
              <div className="mb-6">
                <p className="label mb-3">SYSTEMIC TENSION</p>
                <div className="flex justify-between text-[10px] text-text-secondary font-semibold uppercase tracking-wider mb-2">
                  <span>Growth Focus</span>
                  <span>Equality Focus</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden flex relative">
                  <div className="bg-text-secondary h-full transition-all duration-500" style={{ width: `${uiInsights.tradeoff.val}%` }} />
                  <div className="bg-accent-negative h-full transition-all duration-500" style={{ width: `${100 - uiInsights.tradeoff.val}%` }} />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-bg-sidebar" />
                </div>
                <p className={`text-[10px] font-bold text-center mt-3 tracking-wider ${uiInsights.tradeoff.level === 'HIGH' ? 'text-accent-negative' : 'text-text-muted'}`}>
                  {uiInsights.tradeoff.level} TRADEOFF
                </p>
              </div>

              <div className="section-divider my-6" />

              {/* Key Insight */}
              <div className="mb-6">
                <p className="label mb-3">STRATEGIC ANALYSIS</p>
                <p className="text-xs text-text-secondary leading-relaxed p-0">
                  {uiInsights.keyInsight}
                </p>
              </div>

              {policiesList.length > 0 && (
                <Button variant="primary" onClick={handleProceed} disabled={isSimulating} className="w-full justify-center mt-6 py-3 shadow-md shadow-accent-primary/20 hover:shadow-lg hover:shadow-accent-primary/40">
                  {isSimulating ? `SIMULATING... ${Math.round(simulationProgress)}%` : 'Execute Policy'}
                </Button>
              )}
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PolicyStudio;
