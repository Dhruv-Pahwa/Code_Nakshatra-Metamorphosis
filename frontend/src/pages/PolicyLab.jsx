import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';
import useSimulationStore from '../store/useSimulationStore';
import { 
  CheckCircle, 
  Rocket, 
  Star, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp
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

const PolicyLab = () => {
  const navigate = useNavigate();
   const { results, isSimulating, runStatusText, addToast, applyPolicyVariant } = useSimulationStore();
  const [activeVariant, setActiveVariant] = useState('balanced');

   const policyLab = results?.policyLab || {};
   const scenarios = results?.scenarios || {};
   const deltaMetrics = Array.isArray(policyLab.deltaMetrics) ? policyLab.deltaMetrics : [];
   const scenarioMetrics = Array.isArray(scenarios.metrics) ? scenarios.metrics : [];
  const refinements = Array.isArray(policyLab.refinements) ? policyLab.refinements : [];
  const comparisonRows = Array.isArray(policyLab.comparisonMatrix) ? policyLab.comparisonMatrix : [];
  const scorecard = policyLab?.scorecard || {};
  const narrative = policyLab?.narrative || {};
   const driverSentences = Array.isArray(narrative.driverSentences) ? narrative.driverSentences : [];

   const readDeltaMetric = (token, fallback = '0') => {
      const hit = deltaMetrics.find((metric) =>
         String(metric?.label || '').toUpperCase().includes(token.toUpperCase())
      );
      return hit?.value || fallback;
   };

   const readScenarioMetric = (metricToken, key, fallback = '0') => {
      const hit = scenarioMetrics.find((metric) =>
         String(metric?.name || '').toUpperCase().includes(metricToken.toUpperCase())
      );
      return hit?.[key] || fallback;
   };
  
  // Weights for live feedback mock
  const [weightGrowth, setWeightGrowth] = useState(40);
  const [weightEquity, setWeightEquity] = useState(40);
  const [weightStability, setWeightStability] = useState(20);

  const variants = {
    balanced: {
      id: 'balanced', 
      title: 'Balanced Variant',
      isRecommended: true,
         metrics: {
            growth: toSignedPercent(readDeltaMetric('GDP', scenarios?.metrics?.[0]?.reformA || '0')),
            equity: toSignedPercent(readScenarioMetric('GINI', 'reformA', readDeltaMetric('REAL INCOME', '0'))),
            inflation: `${readDeltaMetric('INFLATION', '0')}%`,
         },
      warning: policyLab.insightImplication || 'Monitor channel sensitivity in low-performing segments.',
      policyDelta: comparisonRows[0]?.simY || policyLab.contextBridge || '',
      why: [
            driverSentences[0] || policyLab.contextBridge || 'Refinements are generated from solved causal bottlenecks.',
            comparisonRows[0]?.simX || policyLab.userIntent || 'Review and accept deterministic optimization options.',
            comparisonRows[0]?.variance || 'Combined policy stack maintains contract-compliant output stability.',
      ],
         confidence: policyLab.confidence || '95.0%', 
         scatterPoint: {
            growth: parseSignedNumber(readDeltaMetric('GDP', '0')),
            equity: parseSignedNumber(readDeltaMetric('REAL INCOME', '0')),
         },
    },
    growth: {
      id: 'growth', 
         title: refinements[0]?.name || scenarios.reformALabel || 'Growth Variant',
      isRecommended: false,
         metrics: {
            growth: readScenarioMetric('GDP', 'reformA', '+0.0%'),
            equity: readScenarioMetric('GINI', 'reformA', '+0.0%'),
            inflation: `${readDeltaMetric('INFLATION', '0')}%`,
         },
         warning: scenarios?.verdict?.detail || 'Higher systemic sensitivity under aggressive growth profile.',
      policyDelta: comparisonRows[0]?.simY || '',
      why: [
            comparisonRows[0]?.simY || 'Growth path emphasizes output acceleration in scenario A.',
            comparisonRows[0]?.simX || 'Distribution channel may experience wider spread across cohorts.',
            comparisonRows[0]?.variance || 'Use when growth objective dominates debt and equity constraints.',
      ],
         confidence: policyLab.confidence || '90.0%', 
         scatterPoint: {
            growth: parseSignedNumber(readScenarioMetric('GDP', 'reformA', '0')),
            equity: parseSignedNumber(readScenarioMetric('GINI', 'reformA', '0')),
         },
    },
    equity: {
      id: 'equity', 
         title: refinements[1]?.name || scenarios.reformBLabel || 'Equity Variant',
      isRecommended: false,
         metrics: {
            growth: readScenarioMetric('GDP', 'reformB', '+0.0%'),
            equity: readScenarioMetric('GINI', 'reformB', '+0.0%'),
            inflation: `${readDeltaMetric('INFLATION', '0')}%`,
         },
         warning: scenarios?.verdict?.summary || 'Slower economy with stronger equity stabilization.',
      policyDelta: comparisonRows[1]?.simY || '',
      why: [
            comparisonRows[1]?.simY || 'Scenario B prioritizes risk and debt moderation.',
            comparisonRows[1]?.simX || 'Distribution effects are usually more stable than high-growth path.',
            comparisonRows[1]?.variance || 'Use when resilience and inequality controls are primary objectives.',
      ],
         confidence: policyLab.confidence || '90.0%', 
         scatterPoint: {
            growth: parseSignedNumber(readScenarioMetric('GDP', 'reformB', '0')),
            equity: parseSignedNumber(readScenarioMetric('GINI', 'reformB', '0')),
         },
    }
  };

  const activeData = variants[activeVariant];

   const tradeoffData =
      Array.isArray(scenarios.tradeoffData) && scenarios.tradeoffData.length > 0
         ? scenarios.tradeoffData.map((point, index) => {
               const name = point?.name || `Option ${index + 1}`;
               return {
                  name,
                  growth: parseSignedNumber(point?.growth),
                  equity: parseSignedNumber(point?.debt),
                  isA: String(name).toLowerCase().includes('reform a') ? parseSignedNumber(point?.debt) : undefined,
                  isB: String(name).toLowerCase().includes('reform b') ? parseSignedNumber(point?.debt) : undefined,
                  isC: String(name).toLowerCase().includes('status') ? parseSignedNumber(point?.debt) : undefined,
               };
            })
         : [
               { name: 'Curve', growth: 1.0, equity: 9.5 },
               { name: 'Option C', growth: 1.5, equity: 8.5, isC: 8.5 },
               { name: 'Curve', growth: 2.0, equity: 7.8 },
               { name: 'Option A', growth: 2.4, equity: 7.2, isA: 7.2 },
               { name: 'Curve', growth: 3.0, equity: 5.0 },
               { name: 'Option B', growth: 3.8, equity: 2.1, isB: 2.1 },
               { name: 'Curve', growth: 4.5, equity: -1.0 },
            ];

  const handleApplyPolicy = () => {
    applyPolicyVariant({
      name: activeData.title,
      policyDelta: activeData.policyDelta,
      note: activeData.why.join(' '),
    });
    addToast({ message: `${activeData.title} staged in Policy Studio.`, type: "success" });
    navigate('/policy');
  };

  return (
    <MainLayout>
      <div className="page-enter h-full flex flex-col pb-0 mb-0">
        <div className="flex-1 flex overflow-hidden">
           
           {/* Left Pane: Live Feedback Controls */}
           <aside className="w-80 bg-bg-sidebar border-r border-border p-6 overflow-y-auto shrink-0 flex flex-col gap-8 dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <div>
                 <h3 className="font-extrabold tracking-widest text-text-secondary uppercase text-xs mb-6">Objective Tuner</h3>
                 
                 <div className="space-y-6">
                    {/* Growth Slider */}
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <label className="text-sm font-bold text-text-primary">Growth Prioritization</label>
                          <span className="text-xs font-mono font-bold text-accent-positive flex items-center gap-1">GDP <TrendingUp size={10} /> +{(weightGrowth / 12).toFixed(1)}%</span>
                       </div>
                       <input type="range" min="0" max="100" value={weightGrowth} onChange={(e)=>setWeightGrowth(e.target.value)} className="w-full accent-accent-primary" />
                    </div>
                    {/* Equity Slider */}
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <label className="text-sm font-bold text-text-primary">Equity Prioritization</label>
                          <span className="text-xs font-mono font-bold text-accent-positive flex items-center gap-1">Bottom40 <TrendingUp size={10} /> +{(weightEquity / 6).toFixed(1)}%</span>
                       </div>
                       <input type="range" min="0" max="100" value={weightEquity} onChange={(e)=>setWeightEquity(e.target.value)} className="w-full accent-[#10b981]" />
                    </div>
                    {/* Stability Slider */}
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <label className="text-sm font-bold text-text-primary">Stability Tolerance</label>
                          {weightStability > 50 ? (
                             <span className="text-xs font-mono font-bold text-accent-negative flex items-center gap-1">Inflation <TrendingUp size={10} /> +{(weightStability / 30).toFixed(1)}%</span>
                          ) : (
                             <span className="text-xs font-mono font-bold text-text-muted">Rigid Context</span>
                          )}
                       </div>
                       <input type="range" min="0" max="100" value={weightStability} onChange={(e)=>setWeightStability(e.target.value)} className="w-full accent-[#8b5cf6]" />
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-border">
                 <h3 className="font-extrabold tracking-widest text-text-secondary uppercase text-xs mb-4">Hard Constraints</h3>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center bg-bg-card border border-border shadow-sm rounded-md px-4 py-3">
                        <span className="text-sm font-bold text-text-primary">Max Inflation</span>
                        <span className="text-sm font-mono font-bold text-[#f85149]">≤ 4.5%</span>
                    </div>
                    <div className="flex justify-between items-center bg-bg-card border border-border shadow-sm rounded-md px-4 py-3">
                        <span className="text-sm font-bold text-text-primary">Fiscal Deficit</span>
                        <span className="text-sm font-mono font-bold text-[#f85149]">≤ 3.0%</span>
                    </div>
                 </div>
              </div>

              {isSimulating && (
                 <div className="mt-auto border border-accent-positive/40 bg-accent-positive/10 rounded p-4 text-center">
                    <p className="text-[10px] font-bold text-accent-positive tracking-widest uppercase mb-1">Recalculating</p>
                    <p className="text-xs text-text-secondary">{runStatusText}</p>
                 </div>
              )}
           </aside>

           {/* Central Workspace: The Advisor Decision Engine */}
           <main className="flex-1 bg-bg-main p-8 xl:p-12 overflow-y-auto flex flex-col gap-10">

              {/* THE HERO CARD: Center of Gravity */}
              <div className="relative rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 dark:from-[#0d1511] dark:to-[#121c17] dark:border-[#204433] shadow-[0_10px_40px_rgba(16,185,129,0.1)] p-8 xl:p-7">
                 {/* Top Label */}
                 <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)] text-white dark:text-bg-main">
                       <CheckCircle size={20} />
                    </div>
                    <h2 className="text-2xl font-extrabold text-emerald-900 dark:text-[#ecfdf5] tracking-tight">Recommended Policy: {activeData.title}</h2>
                 </div>

                 <div className="flex flex-col xl:flex-row gap-10">
                    
                    {/* Big Metrics */}
                    <div className="flex-1 flex gap-8 py-4 border-y border-emerald-200 dark:border-[#204433] xl:border-y-0 xl:py-0 xl:border-r items-center">
                       <div className="flex-1">
                          <p className="text-xs tracking-widest text-emerald-600 dark:text-[#6ee7b7] font-bold uppercase mb-1">Growth</p>
                          <p className="text-4xl lg:text-3xl font-black text-emerald-950 dark:text-white">{activeData.metrics.growth}</p>
                       </div>
                       <div className="flex-1">
                          <p className="text-xs tracking-widest text-emerald-600 dark:text-[#6ee7b7] font-bold uppercase mb-1">Equity</p>
                          <p className="text-4xl lg:text-3xl font-black text-emerald-950 dark:text-white">{activeData.metrics.equity}</p>
                       </div>
                       <div className="flex-1">
                          <p className="text-xs tracking-widest text-emerald-600 dark:text-[#6ee7b7] font-bold uppercase mb-1">Inflation</p>
                          <p className="text-3xl lg:text-3xl font-black text-emerald-600 dark:text-[#a7f3d0]">{activeData.metrics.inflation}</p>
                       </div>
                    </div>

                    {/* Why this works */}
                    <div className="w-full xl:w-96 shrink-0">
                       <p className="text-[11px] font-bold tracking-widest text-emerald-600 dark:text-[#6ee7b7] uppercase mb-3">Why this works:</p>
                       <ul className="space-y-3">
                          {activeData.why.map((point, idx) => (
                             <li key={idx} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-[#d1fae5] font-medium leading-tight">
                                <span className="text-[#34d399] mt-0.5">•</span>
                                {point}
                             </li>
                          ))}
                       </ul>
                       <p className="text-xs text-emerald-600 dark:text-[#a7f3d0] font-mono mt-4 pt-4 border-t border-emerald-200 dark:border-[#204433]">Confidence Score: <span className="font-bold text-emerald-950 dark:text-white">{activeData.confidence}</span></p>
                    </div>
                 </div>

                 {/* URGENT ACTION BUTTON */}
                 <div className="mt-8 pt-8 border-t border-emerald-200 dark:border-[#204433] flex justify-end">
                    <button 
                       onClick={handleApplyPolicy}
                       className="bg-[#10b981] hover:bg-[#059669] text-white px-8 py-4 rounded-lg font-black text-md tracking-widest shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-3"
                    >
                       <Rocket size={18} /> APPLY TO POLICY STUDIO
                    </button>
                 </div>
              </div>

              {/* COMPETING STRATEGIES ROW */}
              <div>
                 <h3 className="text-sm font-extrabold text-text-primary tracking-wider uppercase mb-5">Competing Strategies</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.values(variants).map(v => {
                       const isActive = activeVariant === v.id;
                       return (
                          <div 
                             key={v.id} 
                             onClick={() => setActiveVariant(v.id)}
                             className={`cursor-pointer border-2 rounded-xl p-6 transition-all relative overflow-hidden group
                                ${isActive ? 'bg-bg-subtle border-accent-primary shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-accent-primary' : 'bg-bg-card border-border hover:border-text-muted'}`}
                          >
                             {/* Recommended Tag */}
                             {v.isRecommended && (
                                <div className="absolute top-0 right-0 bg-[#204433] text-[#34d399] text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-bl-lg">
                                   <Star size={10} className="mr-1 inline" /> Recommended
                                </div>
                             )}

                             {isActive && !v.isRecommended && (
                                <div className="absolute top-0 right-0 bg-[#1e3a8a] text-accent-primary text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-bl-lg">
                                   <CheckCircle size={10} className="mr-1 inline" /> Active
                                </div>
                             )}

                             <h4 className={`text-lg font-extrabold mb-5 ${isActive ? 'text-accent-primary' : 'text-text-primary group-hover:text-text-primary'}`}>
                                {v.title}
                             </h4>

                             <div className="space-y-2 mb-5">
                                <div className="flex items-center justify-between">
                                   <span className="text-xs text-text-secondary font-bold">Growth</span>
                                   <span className="text-sm font-black text-text-primary">{v.metrics.growth}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                   <span className="text-xs text-text-secondary font-bold">Equity</span>
                                   <span className="text-sm font-black text-text-primary">{v.metrics.equity}</span>
                                </div>
                             </div>

                             <div className="pt-3 border-t border-dashed border-border flex items-start gap-2">
                                <AlertTriangle className="text-[#f85149]" size={14} />
                                <p className="text-[11px] font-bold text-[#f85149] uppercase leading-tight">{v.warning}</p>
                             </div>
                             <details className="mt-4 border-t border-border pt-3">
                                <summary className="text-[10px] font-black tracking-widest uppercase text-text-muted cursor-pointer">
                                   Why this variant?
                                </summary>
                                <p className="text-xs text-text-secondary leading-relaxed mt-2">
                                   {v.policyDelta || v.why[0]}
                                </p>
                             </details>
                          </div>
                       );
                    })}
                 </div>
              </div>

              {/* TRADEOFF GRAPH: The Canvas */}
              <div className="border border-border bg-bg-card rounded-xl p-8 flex flex-col h-[500px]">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h3 className="text-lg font-extrabold text-text-primary tracking-widest uppercase mb-1">Tradeoff Surface</h3>
                       <p className="text-sm font-semibold text-text-secondary">Visualizing the Efficient Frontier of Growth vs. Equity</p>
                    </div>
                    <div className="flex items-center gap-5">
                       <span className="text-xs font-bold text-text-secondary flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div> Option A</span>
                       <span className="text-xs font-bold text-text-secondary flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.8)]"></div> Option B</span>
                       <span className="text-xs font-bold text-text-secondary flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#a78bfa] shadow-[0_0_10px_rgba(167,139,250,0.8)]"></div> Option C</span>
                    </div>
                 </div>
                 
                 <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={tradeoffData} margin={{ top: 20, right: 30, bottom: 20, left: -10 }}>
                       <CartesianGrid stroke="var(--border-default)" strokeDasharray="4 4" />
                       <XAxis 
                         dataKey="growth" 
                         type="number" 
                         domain={[0, 5]} 
                         tick={{ fontSize: 13, fill: 'var(--text-secondary)', fontWeight: 'bold' }} 
                         tickLine={false}
                         axisLine={{ stroke: 'var(--border-default)' }}
                         label={{ value: "GDP GROWTH (%)", position: 'insideBottom', offset: -15, fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: '2px' }} 
                       />
                       <YAxis 
                         domain={[-2, 10]} 
                         tick={{ fontSize: 13, fill: 'var(--text-secondary)', fontWeight: 'bold' }}
                         tickLine={false}
                         axisLine={{ stroke: 'var(--border-default)' }}
                         label={{ value: "EQUITY GAIN (%)", angle: -90, position: 'insideLeft', offset: 25, fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: '2px' }}
                       />
                       
                       <RechartsTooltip 
                          cursor={{ strokeDasharray: '3 3', stroke: 'var(--text-muted)' }} 
                          contentStyle={{ 
                             backgroundColor: 'var(--bg-card)', 
                             border: '1px solid var(--border-default)', 
                             borderRadius: '8px', 
                             fontSize: '13px', 
                             fontWeight: 'bold', 
                             color: 'var(--text-primary)' 
                          }} 
                       />
                       
                       {/* The conceptual tradeoff curve */}
                       <Line type="monotone" dataKey="equity" stroke="var(--text-muted)" strokeWidth={3} dot={false} activeDot={false} />
                       
                       {/* Overlay Scatters corresponding to the variants along the curve */}
                       <Scatter dataKey="isA" name="Option A (Balanced)" fill="#10b981" r={16} className="cursor-pointer" onClick={() => setActiveVariant('balanced')} />  
                       <Scatter dataKey="isB" name="Option B (Growth)" fill="#38bdf8" r={16} className="cursor-pointer" onClick={() => setActiveVariant('growth')} />  
                       <Scatter dataKey="isC" name="Option C (Equity)" fill="#a78bfa" r={16} className="cursor-pointer" onClick={() => setActiveVariant('equity')} />  

                    </ComposedChart>
                 </ResponsiveContainer>
              </div>

              {/* Optimizations */}
              <div className="bg-amber-50 dark:bg-[#1f1d18] border border-amber-200 dark:border-[#a16207] rounded-xl p-6 mt-4 flex items-start gap-5 shadow-sm">
                 <Lightbulb size={24} className="text-[#eab308] shrink-0" />
                 <div>
                    <p className="text-[11px] uppercase font-bold text-[#eab308] tracking-widest mb-2">Mild System Optimization Suggestion</p>
                      <p className="text-amber-900 dark:text-[#d4d4d8] font-medium leading-relaxed max-w-5xl">
                       {narrative.summary || policyLab.insightImplication || 'Review the frozen metrics before applying a refinement.'}
                    </p>
                 </div>
              </div>

              {(scorecard.growth != null || scorecard.equity != null || scorecard.stability != null) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-border bg-bg-card rounded-xl p-5">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-2">Growth Score</p>
                    <p className="text-3xl font-black text-text-primary">{scorecard.growth ?? '--'}</p>
                  </div>
                  <div className="border border-border bg-bg-card rounded-xl p-5">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-2">Equity Score</p>
                    <p className="text-3xl font-black text-text-primary">{scorecard.equity ?? '--'}</p>
                  </div>
                  <div className="border border-border bg-bg-card rounded-xl p-5">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-2">Stability Score</p>
                    <p className="text-3xl font-black text-text-primary">{scorecard.stability ?? '--'}</p>
                  </div>
                </div>
              )}

           </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default PolicyLab;
