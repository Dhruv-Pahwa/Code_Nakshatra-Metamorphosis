import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  Sankey,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from 'recharts';
import MainLayout from '../layouts/MainLayout';
import FlowTransition from '../components/ui/FlowTransition';
import CausalGraphContainer from '../components/causal/CausalGraphContainer';
import ObsidianGraph from '../components/causal/ObsidianGraph';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useSimulationStore from '../store/useSimulationStore';
import { 
  Beaker, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  ArrowRight
} from 'lucide-react';

const VIEWS = ['Graph', 'Flow', 'Contribution', 'Story', 'Obsidian Network'];

const parseSignedNumber = (value) => {
   if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
   const numeric = Number.parseFloat(String(value || '').replace(/[^0-9+-.]/g, ''));
   return Number.isFinite(numeric) ? numeric : 0;
};

const CausalExplorer = () => {
  const navigate = useNavigate();
  const { results, isSimulating, runStatusText, nextStep } = useSimulationStore();
  const [activeView, setActiveView] = useState('Graph');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const causal = results?.causal || {};
   const macro = results?.macro || {};
   const distribution = results?.distribution || {};
   const scenarios = results?.scenarios || {};
  const nodes = Array.isArray(causal.nodes) ? causal.nodes : [];
  const edges = Array.isArray(causal.edges) ? causal.edges : [];
   const narrative = causal?.narrative || {};
  const driverSentences = Array.isArray(narrative.driverSentences) ? narrative.driverSentences : [];
   const channelContributions = Array.isArray(causal.channelContributions) ? causal.channelContributions : [];
   const marketClearingChecks = Array.isArray(causal.marketClearingChecks) ? causal.marketClearingChecks : [];
   const scenarioMetrics = Array.isArray(scenarios.metrics) ? scenarios.metrics : [];

   const nodeIdToLabel = new Map(
      nodes.map((node) => [
         node?.id,
         node?.data?.label || node?.id || 'Node',
      ])
   );

   const derivedNodeDictionary = Object.fromEntries(
      nodes.map((node) => {
         const label = node?.data?.label || node?.id || 'Node';
         const incoming = edges
            .filter((edge) => edge?.target === node?.id)
            .map((edge) => nodeIdToLabel.get(edge?.source) || edge?.source)
            .filter(Boolean);
         const outgoing = edges
            .filter((edge) => edge?.source === node?.id)
            .map((edge) => nodeIdToLabel.get(edge?.target) || edge?.target)
            .filter(Boolean);

         return [
            label,
            {
               impact: `${parseSignedNumber(macro.currentMacroTarget) >= 0 ? '+' : ''}${parseSignedNumber(macro.currentMacroTarget).toFixed(1)}%`,
               contribution: `${Math.max(5, Math.round((outgoing.length + 1) * 20))}%`,
               upstream: incoming.length > 0 ? incoming : ['Policy Inputs'],
               downstream: outgoing.length > 0 ? outgoing : ['Outcome Layer'],
               edgeEvidence: edges
                  .filter((edge) => edge?.source === node?.id || edge?.target === node?.id)
                  .map((edge) => `${edge?.magnitude || 'medium'} / ${edge?.confidence || 'medium'}`),
            },
         ];
      })
   );

   const pathwayLabels =
      nodes.length > 0
         ? nodes.slice(0, 5).map((node) => node?.data?.label || node?.id || 'Node')
         : ['Policy Inputs', 'Transmission', 'Income Channel', 'Welfare Effects', 'Outcome'];

  const mockInsights = {
      primaryStory: pathwayLabels.join(' → '),
      dominantPathwayText:
         narrative.summary ||
         causal?.insightImplication ||
         'The dominant cascade is generated from the solved-state policy transmission graph.',
    
    counterfactual: {
         title: `If ${causal?.diagnostic?.selectedVariable || 'primary driver'} is suppressed:`,
         text:
            parseSignedNumber(distribution?.giniDelta) <= 0
               ? 'Distribution improvement weakens and downstream welfare gains compress across exposed cohorts.'
               : 'Inequality pressure worsens and downstream welfare losses deepen in vulnerable segments.',
    },
    
      sensitivity:
         scenarioMetrics.length > 0
            ? scenarioMetrics.slice(0, 3).map((metric) => ({
                  label: metric?.name || 'Scenario Metric',
                  result: metric?.reformADelta || 'N/A',
               }))
            : [
                  { label: 'Scenario A Shift', result: '+0.0%' },
                  { label: 'Scenario B Shift', result: '+0.0%' },
                  { label: 'Policy Stress', result: 'Stable' },
               ],

    fragility: {
          title: 'Fragile Link Highlight',
          text:
             driverSentences[0] ||
             (edges.length <= 1
                ? 'Transmission graph is sparse; minor channel disruption can materially alter outcomes.'
                : `${causal?.diagnostic?.selectedVariable || 'Primary transmission variable'} remains the highest sensitivity channel in this run.`),
    },

      nodeDictionary:
         Object.keys(derivedNodeDictionary).length > 0
            ? derivedNodeDictionary
            : {
                  Transmission: { impact: '+0.0%', contribution: '0%', upstream: ['Policy Inputs'], downstream: ['Outcomes'] },
               },
  };

   const sankeyNodes =
      nodes.length > 0
         ? nodes.map((node) => ({ name: node?.data?.label || node?.id || 'Node' }))
         : pathwayLabels.map((label) => ({ name: label }));

   const fallbackLinks = pathwayLabels.slice(0, -1).map((_, idx) => ({
      source: idx,
      target: idx + 1,
      value: 20,
   }));

   const sankeyLinks =
      edges.length > 0 && nodes.length > 0
         ? edges
               .map((edge) => {
                  const sourceIndex = nodes.findIndex((node) => node?.id === edge?.source);
                  const targetIndex = nodes.findIndex((node) => node?.id === edge?.target);
                  if (sourceIndex < 0 || targetIndex < 0) return null;
                  return {
                     source: sourceIndex,
                     target: targetIndex,
                     value: edge?.type === 'latent' ? 15 : 30,
                  };
               })
               .filter(Boolean)
         : fallbackLinks;

  const sankeyData = {
      nodes: sankeyNodes,
      links: sankeyLinks,
  };

   const contributionData =
      channelContributions.length > 0
         ? channelContributions.map((item) => ({
              channel: item?.channel || 'Channel',
              value: Math.max(1, Math.abs(parseSignedNumber(item?.gdpContribution))),
            }))
         : nodes.length > 0
           ? nodes.slice(0, 4).map((node) => {
              const label = node?.data?.label || node?.id || 'Node';
              const outgoing = edges.filter((edge) => edge?.source === node?.id).length;
              return {
                channel: label,
                value: Math.max(5, outgoing * 20),
              };
            })
           : [
               { channel: 'Transmission Pathway', value: 40 },
               { channel: 'Income Channel', value: 30 },
               { channel: 'Price Channel', value: 20 },
               { channel: 'Residual Effects', value: 10 },
             ];

  // Helper to resolve currently selected diagnostic context
  const activeDiagnostic = selectedNodeId 
      ? mockInsights.nodeDictionary[selectedNodeId] || { impact: "—", contribution: "—", upstream: [], downstream: [] }
      : null;

  const handleNextStep = () => {
    nextStep();
    navigate('/policy-lab');
  };

   const renderStoryView = () => (
    <div className="h-full flex flex-col items-center justify-center py-10 px-6 overflow-y-auto w-full">
       <div className="max-w-2xl w-full relative">
          <div className="absolute left-6 top-8 bottom-8 w-1 bg-border rounded" />
          
          {pathwayLabels.slice(0, 4).map((label, i) => (
             <div key={i} className="flex relative items-start gap-8 mb-10 last:mb-0 group cursor-default">
                <div className="w-12 h-12 shrink-0 rounded-full bg-bg-card border-2 border-accent-primary flex items-center justify-center font-bold text-text-primary z-10 shadow-lg group-hover:bg-accent-primary group-hover:text-bg-main transition-colors">
                   {i + 1}
                </div>
                <div className="pt-2">
                   <h3 className="text-lg font-bold text-text-primary mb-2">{label}</h3>
                   <p className="text-text-secondary leading-relaxed">
                     {i === 0
                       ? 'Policy instruments initialize the transmission chain.'
                       : i === 3
                         ? 'The final outcome node aggregates downstream solved-state effects.'
                         : 'Intermediate channel propagates deterministic effects to the next layer.'}
                   </p>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="page-enter h-full flex flex-col pb-0 mb-0">
        
        {/* Top Story Summary */}
        <div className="bg-bg-sidebar py-4 px-8 border-b border-border z-10 shrink-0">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mb-1">Primary Causal Story</p>
                  <div className="flex items-center flex-wrap gap-2 text-sm font-mono font-bold tracking-tight text-text-primary">
                              {pathwayLabels.slice(0, 5).map((label, idx, arr) => {
                                 const isPositive = parseSignedNumber(macro.currentMacroTarget) >= 0;
                                 return (
                                    <div key={`${label}-${idx}`} className="flex items-center gap-2">
                                 <span className={`${isPositive ? 'text-accent-positive' : 'text-accent-negative'} bg-bg-card px-2 py-0.5 rounded border border-border flex items-center gap-1`}>
                                          {label}
                                          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                       </span>
                                       {idx < arr.length - 1 && <ArrowRight size={14} className="text-text-muted" />}
                                     </div>
                                 );
                              })}
                  </div>
                  {edges.length > 0 && (
                     <p className="text-[10px] text-text-secondary mt-2">
                        Edge evidence: {edges.slice(0, 3).map((edge) => `${edge.magnitude || 'medium'} confidence ${edge.confidence || 'medium'}`).join(' · ')}
                     </p>
                  )}
              </div>
              
              {/* View Toggle */}
              <div className="flex bg-bg-main border border-border rounded p-1 shrink-0">
                 {VIEWS.map(view => (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${
                        activeView === view ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                       {view}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Master Workspace Split */}
        <div className="flex-1 flex overflow-hidden">
           
           {/* Left/Center Canvas: Core Visualization */}
           <div className="flex-1 bg-bg-main border-r border-border relative flex flex-col min-w-0">
              
              {isSimulating && (
                <div className="absolute top-4 left-4 z-20 rounded border border-border bg-bg-card px-4 py-2 shadow-sm">
                  <p className="text-[10px] font-bold text-accent-positive tracking-widest uppercase">Calculating</p>
                  <p className="text-xs text-text-secondary">{runStatusText}</p>
                </div>
              )}

              {/* View Rendering Block */}
              <div className="flex-1 overflow-hidden relative">
                 {activeView === 'Graph' && (
                    <CausalGraphContainer
                      nodes={nodes}
                      edges={edges}
                                 diagnostic={causal?.diagnostic || {}} 
                      onNodeClick={(node) => setSelectedNodeId(node?.data?.label || null)}
                    />
                 )}

                 {activeView === 'Obsidian Network' && (
                    <div className="w-full h-full">
                       <ObsidianGraph 
                         nodesData={nodes} 
                         edgesData={edges} 
                         onNodeClick={(node) => setSelectedNodeId(node?.data?.label || null)}
                       />
                    </div>
                 )}
                 
                 {activeView === 'Flow' && (
                    <div className="w-full h-full p-8 flex flex-col pointer-events-none">
                       <p className="label-muted mb-4">CAUSAL IMPACT FLOW (SANKEY VISUALIZATION)</p>
                       <ResponsiveContainer width="100%" height="90%" className="pointer-events-auto">
                          <Sankey 
                             data={sankeyData}
                             node={{ stroke: 'var(--border-default)', strokeWidth: 1, fill: 'var(--bg-card)' }}
                             link={{ fill: 'var(--accent-primary)', fillOpacity: 0.3 }}
                             margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                             onClick={(e) => {
                                if (e && e.name) setSelectedNodeId(e.name);
                             }}
                          >
                             <RechartsTooltip 
                                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px' }}
                             />
                          </Sankey>
                       </ResponsiveContainer>
                    </div>
                 )}

                 {activeView === 'Contribution' && (
                    <div className="w-full h-full p-10 flex flex-col justify-center max-w-4xl mx-auto">
                       <p className="label-muted mb-8 text-center uppercase">Path Contribution Breakdown (% of Total Welfare Impact)</p>
                       <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={contributionData} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-default)" />
                             <XAxis type="number" tick={{fontSize: 12, fill: "var(--text-muted)"}} axisLine={false} tickLine={false} />
                             <YAxis dataKey="channel" type="category" tick={{fontSize: 12, fontWeight: 600, fill: "var(--text-primary)"}} width={140} axisLine={false} tickLine={false} />
                             <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }} />
                             <Bar dataKey="value" radius={[0, 4, 4, 0]} onClick={(e) => { if(e && e.channel) setSelectedNodeId("Manufacturing") }} cursor="pointer">
                                {contributionData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={index === 0 ? "var(--accent-primary)" : "var(--border-hover)"} />
                                ))}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 )}

                 {activeView === 'Story' && renderStoryView()}
              </div>
           </div>

           {/* Right Pane: Diagnostic Engine */}
           <aside className="w-80 lg:w-96 bg-bg-sidebar shrink-0 p-6 overflow-y-auto flex flex-col gap-6">
              
              {/* Node Detail Selected State */}
              <Card padding="p-5" className="border-border">
                 <div className="flex items-center justify-between border-b border-border border-dashed pb-3 mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Node Diagnostics</p>
                    {selectedNodeId && (
                       <button onClick={() => setSelectedNodeId(null)} className="text-[10px] text-text-secondary hover:text-text-primary px-1">CLEAR</button>
                    )}
                 </div>

                 {selectedNodeId ? (
                    <div>
                       <h3 className="text-xl font-bold text-text-primary mb-4">{selectedNodeId}</h3>
                       <div className="grid grid-cols-2 gap-4 mb-5">
                          <div className="bg-bg-main border border-border p-3 rounded">
                             <p className="text-[10px] text-text-secondary uppercase mb-1 font-bold">Impact</p>
                             <p className={`text-lg font-bold ${activeDiagnostic.impact.startsWith('+') ? 'text-accent-positive' : 'text-accent-negative'}`}>
                                {activeDiagnostic.impact}
                             </p>
                          </div>
                          <div className="bg-bg-main border border-border p-3 rounded">
                             <p className="text-[10px] text-text-secondary uppercase mb-1 font-bold">Contribution</p>
                             <p className="text-lg font-bold text-text-primary">{activeDiagnostic.contribution}</p>
                          </div>
                       </div>
                       
                       <div className="mb-3">
                          <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Upstream Drivers</p>
                          <div className="flex gap-2 flex-wrap">
                             {activeDiagnostic.upstream.map((u, i) => <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded bg-bg-card border border-border text-text-secondary">{u}</span>)}
                          </div>
                       </div>
                       <div>
                          <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Downstream Effects</p>
                          <div className="flex gap-2 flex-wrap">
                             {activeDiagnostic.downstream.map((d, i) => <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded bg-bg-card border border-border text-text-secondary">{d}</span>)}
                          </div>
                       </div>
                       <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-[10px] uppercase font-bold text-text-muted mb-1">What-if remove this shock?</p>
                          <p className="text-xs text-text-secondary leading-relaxed">
                             Removing this node would interrupt {activeDiagnostic.downstream.slice(0, 2).join(' and ') || 'the downstream chain'} and lower confidence in the selected pathway. Edge evidence: {(activeDiagnostic.edgeEvidence || ['medium / medium']).slice(0, 2).join(', ')}.
                          </p>
                       </div>
                    </div>
                 ) : (
                    <div className="py-6 text-center">
                        <Beaker size={24} className="mb-2 text-text-muted opacity-50 mx-auto" />
                       <p className="text-sm font-medium text-text-secondary text-balance">
                         Interact with the graph, flow, or charts to reveal mathematical drivers.
                       </p>
                    </div>
                 )}
              </Card>

              {/* Fragility Highlight */}
              <div className="border border-[#f59e0b]/40 bg-[#2b1d0d] rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-[#f59e0b]" size={14} />
                   <p className="text-[10px] font-bold text-[#f59e0b] tracking-widest uppercase">{mockInsights.fragility.title}</p>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {mockInsights.dominantPathwayText}
                </p>
              </div>

              {/* Counterfactual Frame */}
              <div className="bg-[#1f2029] border border-border rounded-lg p-5">
                 <p className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold mb-2">Counterfactual Mode</p>
                 <p className="text-xs font-mono font-bold text-[#cbd5e1] mb-2">{mockInsights.counterfactual.title}</p>
                 <p className="text-sm text-[#94a3b8] leading-relaxed italic">{mockInsights.counterfactual.text}</p>
              </div>

              {marketClearingChecks.length > 0 && (
                <Card padding="p-5" className="border-border">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-4">Market Clearing Checks</p>
                  <div className="space-y-3">
                    {marketClearingChecks.map((check, idx) => (
                      <div key={`${check?.name || 'check'}-${idx}`} className="flex justify-between items-center py-2 border-b border-border border-dashed last:border-0">
                        <span className="text-sm text-text-secondary">{check?.name || 'Check'}</span>
                        <span className="text-sm font-bold text-text-primary">{check?.value || '0.0'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Sensitivity Visualization */}
              <Card padding="p-5" className="border-border">
                 <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-4">Parameter Sensitivity</p>
                 <div className="space-y-3">
                    {mockInsights.sensitivity.map((sens, idx) => (
                       <div key={idx} className="flex justify-between items-center py-2 border-b border-border border-dashed last:border-0 last:pb-0">
                          <span className="text-sm font-medium text-text-secondary">{sens.label}</span>
                          <span className={`text-sm font-bold ${sens.result.includes('+') ? 'text-accent-positive' : 'text-text-muted'}`}>{sens.result}</span>
                       </div>
                    ))}
                 </div>
              </Card>

              <div className="mt-auto pt-6">
                 <Button variant="primary" onClick={handleNextStep} className="w-full justify-center py-3">
                   Proceed Framework Review
                 </Button>
              </div>
           </aside>
        </div>
      </div>
    </MainLayout>
  );
};

export default CausalExplorer;
