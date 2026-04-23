import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FactorPricesPanel from '../components/macro/FactorPricesPanel';
import useSimulationStore from '../store/useSimulationStore';
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Globe
} from 'lucide-react';
import RegionalImpactMap from '../components/macro/RegionalImpactMap';

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

const directionFromNumeric = (value) => {
  const numeric = parseSignedNumber(value);
  if (numeric > 0) return 'up';
  if (numeric < 0) return 'down';
  return 'neutral';
};

const MacroImpact = () => {
  const navigate = useNavigate();
  const { results, isSimulating, nextStep } = useSimulationStore();
  const macro = results?.macro || {};
  const analysisSummary = results?.analysisSummary || {};
  const distribution = results?.distribution || {};
  const sectors = Array.isArray(macro.sectors) ? macro.sectors : [];
  const sideMetrics = Array.isArray(macro.sideMetrics) ? macro.sideMetrics : [];
  const factorPrices = macro?.factorPrices || {};
  const solverStatus = macro?.activeSimulations?.[0]?.status || 'UNKNOWN';
  const narrative = macro?.narrative || {};
  const driverSentences = Array.isArray(narrative.driverSentences) ? narrative.driverSentences : [];

  const cpiMetric = sideMetrics.find((metric) => String(metric?.label || '').toUpperCase().includes('CPI'));
  const realIncomeMetric = sideMetrics.find((metric) => String(metric?.label || '').toUpperCase().includes('REAL INCOME'));

  const gdpTarget = parseSignedNumber(macro.currentMacroTarget);
  const sectorWithWorstDelta =
    sectors
      .map((sector) => ({ ...sector, numericDelta: parseSignedNumber(sector?.delta) }))
      .sort((a, b) => a.numericDelta - b.numericDelta)[0] || null;

  const avgSectorDelta =
    sectors.length > 0
      ? sectors.reduce((acc, sector) => acc + parseSignedNumber(sector?.delta), 0) / sectors.length
      : 0;

  const volatilityLabel = Math.abs(avgSectorDelta) >= 1.5 ? 'Elevated' : Math.abs(avgSectorDelta) >= 0.7 ? 'Moderate' : 'Contained';
  const confidence = parseSignedNumber(analysisSummary.confidenceInterval || '95');

  const handleNextStep = () => {
    nextStep();
    navigate('/distribution');
  };

  const regionalData = macro?.regionalImpactMap || {};

  const mockInsights = {
    headline: narrative.summary || `${macro.insightTitle || 'Macro simulation complete.'} ${macro.insightImplication || ''}`,
    tradeoffs: [
      {
        label: 'Growth',
        value: directionFromNumeric(gdpTarget) === 'up' ? '↑' : directionFromNumeric(gdpTarget) === 'down' ? '↓' : '↔',
        color: directionFromNumeric(gdpTarget) === 'up' ? 'text-accent-positive' : directionFromNumeric(gdpTarget) === 'down' ? 'text-accent-negative' : 'text-text-muted',
      },
      {
        label: 'Inflation',
        value:
          directionFromNumeric(cpiMetric?.value) === 'up'
            ? '↑'
            : directionFromNumeric(cpiMetric?.value) === 'down'
              ? '↓'
              : '↔',
        color:
          directionFromNumeric(cpiMetric?.value) === 'up'
            ? 'text-accent-negative'
            : directionFromNumeric(cpiMetric?.value) === 'down'
              ? 'text-accent-positive'
              : 'text-text-muted',
      },
      {
        label: 'Real Income',
        value:
          directionFromNumeric(realIncomeMetric?.value) === 'up'
            ? '↑'
            : directionFromNumeric(realIncomeMetric?.value) === 'down'
              ? '↓'
              : '↔',
        color: directionFromNumeric(realIncomeMetric?.value) === 'down' ? 'text-accent-negative' : 'text-accent-positive',
      },
      {
        label: 'Fiscal Impact',
        value:
          directionFromNumeric(analysisSummary?.netFiscalImpact) === 'up'
            ? '↑'
            : directionFromNumeric(analysisSummary?.netFiscalImpact) === 'down'
              ? '↓'
              : '↔',
        color: directionFromNumeric(analysisSummary?.netFiscalImpact) === 'down' ? 'text-accent-negative' : 'text-accent-positive',
      },
    ],
    vsBaseline: [
      { label: 'GDP', value: toSignedPercent(gdpTarget) },
      { label: 'CPI', value: toSignedPercent(cpiMetric?.value) },
      { label: 'Real Income', value: toSignedPercent(realIncomeMetric?.value) },
    ],
    growthDrivers: (sectors.length > 0
      ? sectors.map((sector) => ({
        name: sector?.name || 'Unnamed sector',
        effect: toSignedPercent(sector?.delta),
        isNegative: parseSignedNumber(sector?.delta) < 0,
        driver: driverSentences.find((sentence) => sentence.includes(sector?.name)) || driverSentences[1] || macro.contextBridge || 'Matched rule and CGE baseline determine this contribution.',
      }))
      : [
        { name: 'Industrial Production', effect: '+0.0%', isNegative: false },
        { name: 'Services Output', effect: '+0.0%', isNegative: false },
      ]),
    confidence: {
      riskLevel: confidence >= 97 ? 'LOW' : confidence >= 90 ? 'MEDIUM' : 'ELEVATED',
      volatility: volatilityLabel,
      overall: `${confidence.toFixed(1)}%`,
    },
    sectorRisk: {
      title: 'Sector Risk Highlight',
      sector: sectorWithWorstDelta?.name || 'No high-risk sector detected',
      delta: toSignedPercent(sectorWithWorstDelta?.delta),
      warning:
        parseSignedNumber(sectorWithWorstDelta?.delta) < 0
          ? 'This channel has the weakest solved performance and should be monitored in policy refinements.'
          : 'All tracked sectors are non-negative in the latest solved state.',
    },
    causalPathway: [
      'Policy Inputs',
      macro.contextBridge || 'Transmission',
      distribution.insightImplication || 'Distribution Effects',
      gdpTarget >= 0 ? 'GDP ↑' : 'GDP ↓',
    ],
    decision: {
      status: parseSignedNumber(gdpTarget) >= 0 ? 'STABLE' : 'WARNING',
      text: driverSentences[0] || macro.userIntent || 'Review macro diagnostics, then proceed to distribution analysis.',
    },
  };

  const trajectoryData = Array.from({ length: 6 }).map((_, idx) => ({
    period: `Q${idx + 1}`,
    growth: Number(((gdpTarget * (idx + 1)) / 6).toFixed(2)),
  }));

  const sectorDeltaData =
    sectors.length > 0
      ? sectors.map((sector) => ({
        sector: sector?.name || 'Unknown',
        delta: Number(parseSignedNumber(sector?.delta).toFixed(2)),
      }))
      : [
        { sector: 'Industrial Production', delta: 0 },
        { sector: 'Services Output', delta: 0 },
      ];

  const renderTitleMarkup = (htmlStr) => {
    return htmlStr.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk);
  };

  return (
    <MainLayout>
      <div className="page-enter">
        <div className="page-content pt-8 px-10 pb-20">

          {isSimulating && (
            <div className="mb-6 rounded border border-border bg-bg-card px-4 py-3">
              <p className="label-muted">SIMULATION STATUS</p>
              <p className="text-sm text-text-secondary mt-1">Refreshing macro indicators...</p>
            </div>
          )}

          {/* Top Section: Headline and Summaries */}
          <div className="mb-10 max-w-6xl">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary leading-snug mb-5 max-w-4xl">
              {renderTitleMarkup(mockInsights.headline)}
            </h1>

            {/* Tradeoff Summary */}
            <div className="flex items-center gap-6 mb-6">
              <span className="text-[10px] font-bold tracking-widest uppercase text-text-secondary">Tradeoff Summary</span>
              {mockInsights.tradeoffs.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="text-text-secondary">{item.label}:</span>
                  <span className={`flex items-center gap-1 ${item.color}`}>
                    {item.value.includes('↑') && <TrendingUp size={12} />}
                    {item.value.includes('↓') && <TrendingDown size={12} />}
                    {item.value.includes('↔') && <Minus size={12} />}
                    {item.value.replace(/[↑↓↔]/g, '').trim()}
                  </span>
                </div>
              ))}
            </div>

            {/* VS Baseline horizontal block */}
            <div className="inline-block border border-border rounded bg-bg-card p-3">
              <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mb-1">VS Baseline</p>
              <div className="flex gap-4">
                {mockInsights.vsBaseline.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-sm font-bold text-text-primary"
                    title={driverSentences[idx] || narrative.sourceSnippets?.[idx] || 'Computed backend value'}
                  >
                    <span className="text-text-secondary font-semibold mr-1">{item.label}</span>
                    <span className={item.value.startsWith('+') ? 'text-accent-positive' : item.value.startsWith('-') ? 'text-accent-negative' : ''}>{item.value}</span>
                    {driverSentences[idx] && (
                      <span className="block text-[10px] font-medium text-text-muted mt-1 max-w-[180px] truncate">
                        Driver: {driverSentences[idx]}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Regional Impact Section - Full Width Heatmap */}
          <div className="mb-12 border-y border-border/50 bg-bg-card/30 -mx-10 px-10 py-10 shadow-inner">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Globe className="text-accent-primary" size={20} />
                  <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">Regional Economic Impact Heatmap</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-bg-card border border-border rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-positive" />
                    <span className="text-[10px] font-black text-text-secondary uppercase">36 Entities Solved</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-8">
                {/* Full Width Map Container */}
                <div className="w-full min-h-[600px] bg-bg-card border border-border rounded-2xl shadow-2xl relative z-10 overflow-hidden">
                  <RegionalImpactMap regionalData={regionalData} />
                </div>

                {/* Horizontal Insight Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-bg-card border border-border p-5 rounded-xl shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-accent-primary mb-3">Model Intelligence</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      High-fidelity CGE engine has solved the production equilibrium across Indian states. 
                      Visualizing supply chain ripples triggered by current policy shocks.
                    </p>
                  </div>
                  
                  <div className="bg-bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Max Regional Expansion</p>
                    <p className="text-2xl font-black text-accent-positive tracking-tight">
                      {Object.entries(regionalData).length > 0 
                        ? `+${Math.max(...Object.values(regionalData).map(d => d.gdp_delta || 0)).toFixed(2)}%` 
                        : '+0.00%'}
                    </p>
                  </div>

                  <div className="bg-bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Max Regional Contraction</p>
                    <p className="text-2xl font-black text-accent-negative tracking-tight">
                      {Object.entries(regionalData).length > 0 
                        ? `${Math.min(...Object.values(regionalData).map(d => d.gdp_delta || 0)).toFixed(2)}%` 
                        : '-0.00%'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 items-start">

            {/* Left Column (Growth Drivers, Causal, and Charts) */}
            <div className="min-w-0 flex-1 flex flex-col gap-6">

              {/* Growth Drivers / Policy Attribution */}
              <Card className="bg-bg-card p-5">
                <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Growth Drivers</p>
                {driverSentences.length > 0 && (
                  <p className="text-xs text-text-secondary leading-relaxed mb-4 border-b border-border border-dashed pb-3">
                    {driverSentences[0]}
                  </p>
                )}
                <div className="space-y-3">
                  {mockInsights.growthDrivers.map((driver, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-border border-dashed last:border-0 last:pb-0"
                      title={driver.driver}
                    >
                      <span className="text-sm font-medium text-text-primary">{driver.name}</span>
                      <span className={`text-sm font-bold ${driver.isNegative ? 'text-accent-negative' : 'text-accent-positive'}`}>{driver.effect}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FactorPricesPanel factorPrices={factorPrices} solverStatus={solverStatus} />

                <Card className="bg-bg-card p-5">
                  <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Solver Snapshot</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
                      <span className="text-sm text-text-secondary">Status</span>
                      <span className="text-sm font-bold text-text-primary">{solverStatus}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
                      <span className="text-sm text-text-secondary">Fiscal Impact</span>
                      <span className={directionFromNumeric(analysisSummary?.netFiscalImpact) === 'down' ? 'text-sm font-bold text-accent-negative' : 'text-sm font-bold text-accent-positive'}>
                        {analysisSummary?.netFiscalImpact || '0.0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
                      <span className="text-sm text-text-secondary">Trade Balance</span>
                      <span className="text-sm font-bold text-text-primary">{macro?.tradeBalance || '0.0'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-text-secondary">Investment / Savings</span>
                      <span className="text-sm font-bold text-text-primary">{macro?.investmentSavings || '0.0'}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts Section: Line and Bar preserved */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card padding="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">GDP Growth Projection</p>
                    <p className="text-xs text-text-muted">6 Quarters</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trajectoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border-default)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <Line type="monotone" dataKey="growth" stroke="var(--text-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card padding="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">Sector Delta</p>
                    <p className="text-xs text-text-muted">Change %</p>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sectorDeltaData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                      <CartesianGrid stroke="var(--border-default)" strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="sector" 
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} 
                        interval={0} 
                        angle={-25} 
                        textAnchor="end" 
                        axisLine={false} 
                        tickLine={false}
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'var(--bg-subtle)', fillOpacity: 0.1 }}
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="delta" radius={[4, 4, 0, 0]} barSize={40}>
                        {sectorDeltaData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.delta < 0 ? 'var(--accent-negative)' : 'var(--accent-positive, #4ade80)'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Causal Pathway */}
              <Card className="bg-bg-card p-5">
                <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Causal Pathway</p>
                <div className="flex items-center flex-wrap gap-2 text-xs font-mono font-bold tracking-tight">
                  {mockInsights.causalPathway.map((node, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded bg-bg-main border border-border ${node.includes('↑') ? 'text-accent-positive' : node.includes('↓') ? 'text-accent-negative' : 'text-text-primary'}`}>
                        {node.replace(/[↑↓]/g, '').trim()}
                        {node.includes('↑') && <TrendingUp size={10} />}
                        {node.includes('↓') && <TrendingDown size={10} />}
                      </span>
                      {idx < mockInsights.causalPathway.length - 1 && <ArrowRight size={10} className="text-text-muted" />}
                    </div>
                  ))}
                </div>
              </Card>

            </div>

            {/* Right Column (Confidence, Risk, Decision) */}
            <div className="w-full xl:w-80 shrink-0 flex flex-col gap-5">

              {/* System Confidence */}
              <Card className="bg-bg-sidebar p-5 border-border">
                <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">System Confidence</p>

                <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
                  <span className="text-sm text-text-secondary">Risk Level</span>
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${mockInsights.confidence.riskLevel === 'LOW' ? 'bg-accent-positive/10 text-accent-positive border-accent-positive/30' : 'bg-accent-negative/10 text-accent-negative border-accent-negative/30'}`}>
                    {mockInsights.confidence.riskLevel}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
                  <span className="text-sm text-text-secondary">Volatility</span>
                  <span className="text-sm font-semibold border border-border bg-bg-card px-2 py-0.5 rounded text-text-primary">{mockInsights.confidence.volatility}</span>
                </div>

                <div className="flex justify-between items-center pt-3">
                  <span className="text-sm font-bold text-text-primary">Overall Confidence</span>
                  <span className="text-xl font-bold text-text-primary">{mockInsights.confidence.overall}</span>
                </div>
              </Card>

              {/* Sector Risk Highlight */}
              <div className="bg-risk-negative border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-accent-negative" size={14} />
                  <p className="text-xs font-bold text-accent-negative tracking-widest uppercase">{mockInsights.sectorRisk.title}</p>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {mockInsights.sectorRisk.sector} shows contraction <span className="font-bold text-accent-negative">{mockInsights.sectorRisk.delta}</span>. {mockInsights.sectorRisk.warning}
                </p>
              </div>

              {/* Decision Signal & Proceed */}
              <div className="bg-bg-sidebar border border-border rounded-lg p-5 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-accent-positive" size={14} />
                  <p className="text-xs font-bold text-accent-positive tracking-widest uppercase">Decision Signal</p>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {mockInsights.decision.text}
                </p>
                <Button variant="primary" onClick={handleNextStep} className="w-full justify-center py-3">
                  Next Step
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MacroImpact;
