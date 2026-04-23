import { useState } from 'react';
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
import Toggle from '../components/ui/Toggle';
import Button from '../components/ui/Button';
import EVCard from '../components/distribution/EVCard';
import IncomeWaterfall from '../components/distribution/IncomeWaterfall';
import useSimulationStore from '../store/useSimulationStore';
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight
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

const DistributionImpact = () => {
  const navigate = useNavigate();
  const { results, isSimulating, runStatusText, nextStep } = useSimulationStore();
  const [realToggle, setRealToggle] = useState(false);

  const distribution = results?.distribution || {};
  const causal = results?.causal || {};
  const segments = Array.isArray(distribution.segments) ? distribution.segments : [];
  const ledger = Array.isArray(distribution.ledger) ? distribution.ledger : [];
  const equivalentVariation = Array.isArray(distribution.equivalentVariation) ? distribution.equivalentVariation : [];
  const incomeDecomposition = Array.isArray(distribution.incomeDecomposition) ? distribution.incomeDecomposition : [];
  const consumptionShifts = Array.isArray(distribution.consumptionShifts) ? distribution.consumptionShifts : [];
  const narrative = distribution?.narrative || {};
  const driverSentences = Array.isArray(narrative.driverSentences) ? narrative.driverSentences : [];

  const handleNextStep = () => {
    nextStep();
    navigate('/personas');
  };

  const sortedByDelta = [...segments].sort((a, b) => parseSignedNumber(b?.delta) - parseSignedNumber(a?.delta));
  const negativeSegments = sortedByDelta.filter((segment) => parseSignedNumber(segment?.delta) < 0);
  const giniDelta = parseSignedNumber(distribution.giniDelta);

  const mockInsights = {
    headline: giniDelta > 0 
      ? `Policy shock widens class inequality, increasing wealth divergence across segments.`
      : giniDelta < 0 
        ? `Policy shock narrows class inequality, driving positive wealth redistribution.`
        : `Wealth distribution remains stable with no significant shifts in class inequality.`,
    inequality:
      giniDelta < 0
        ? `Improvement — Gini delta ${toSignedPercent(giniDelta, 3)}`
        : giniDelta > 0
          ? `Deterioration — Gini delta ${toSignedPercent(giniDelta, 3)}`
          : 'Neutral — no measurable Gini movement',
    netOutcome:
      sortedByDelta.length > 0
        ? sortedByDelta.slice(0, 3).map((segment, index) => {
          const delta = parseSignedNumber(segment?.delta);
          const channels = ledger.slice(index * 2, index * 2 + 2);
          return {
            label: segment?.segmentLabel || segment?.name || 'Segment',
            outcome: delta >= 2 ? 'Strong Gain' : delta > 0 ? 'Mild Gain' : delta <= -2 ? 'Significant Loss' : 'Mild Loss',
            value: realToggle ? (segment?.netImpact || 'INR 0 / yr') : toSignedPercent(delta),
            isPositive: delta >= 0,
            why: channels.length > 0
              ? channels.map((channel) => `${channel.name}: ${channel.delta}`).join(' · ')
              : driverSentences[0] || distribution.methodologyNote || 'Rule-linked segment channel.',
          };
        })
        : [
          { label: 'Bottom 40%', outcome: 'Neutral', value: '+0.0%', isPositive: true },
          { label: 'Middle 50%', outcome: 'Neutral', value: '+0.0%', isPositive: true },
          { label: 'Top 10%', outcome: 'Neutral', value: '+0.0%', isPositive: true },
        ],
    attribution:
      ledger.length > 0
        ? ledger.map((entry) => ({
          driver: entry?.name || 'Driver',
          effect: toSignedPercent(entry?.delta),
          isPositive: parseSignedNumber(entry?.delta) >= 0,
        }))
        : [
          { driver: 'No attribution available', effect: '+0.0%', isPositive: true },
        ],
    tailRisk: {
      title: 'Tail Risk',
      warnings:
        negativeSegments.length > 0
          ? negativeSegments.slice(0, 2).map((segment) => {
            const delta = toSignedPercent(segment?.delta);
            return `${segment?.segmentLabel || segment?.name || 'Segment'} records ${delta} real-income movement.`;
          })
          : ['No negative segment deltas detected in the current solved scenario.'],
    },
    fairnessSignal: {
      status: giniDelta <= 0 ? 'ACHIEVED' : 'WARNING',
      text:
        driverSentences[0] ||
        distribution.methodologyNote ||
        (giniDelta <= 0
          ? 'Equity objective met under current deterministic assumptions.'
          : 'Equity objective is not met; review redistribution and transfer sequencing.'),
    },
    causalPathway:
      Array.isArray(causal.nodes) && causal.nodes.length > 0
        ? causal.nodes.slice(0, 4).map((node) => node?.data?.label || 'Channel')
        : ['Policy Shock', 'Price Channel', 'Income Channel', 'Segment Outcomes'],
    decision: {
      text: distribution.userIntent || 'Proceed to persona-level impacts to inspect cohort-specific outcomes.',
    },
  };

  const baselineSeries = Array.from({ length: 4 }).map((_, idx) => ({
    period: `Q${idx + 1}`,
    value: Number((giniDelta * ((idx + 1) / 4)).toFixed(3)),
  }));

  const distributionTrendData = baselineSeries.map((entry, index) => {
    const adjustment = realToggle ? -0.2 + (index * 0.03) : 0;
    return {
      ...entry,
      value: Number((entry.value + adjustment).toFixed(3)),
    };
  });

  const segmentDeltaData =
    segments.length > 0
      ? segments.map((segment) => ({
        segment: segment?.segmentLabel || segment?.name || 'Segment',
        delta: Number(parseSignedNumber(segment?.delta).toFixed(2)),
      }))
      : [
        { segment: 'Bottom 20%', delta: 0 },
        { segment: 'Middle 50%', delta: 0 },
        { segment: 'Top 10%', delta: 0 },
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
              <p className="text-sm text-text-secondary mt-1">{runStatusText || 'Refreshing distribution analysis...'}</p>
            </div>
          )}

          {/* Top Section: Headline and Net Outcome */}
          <div className="mb-10 max-w-6xl">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary leading-snug mb-3 max-w-4xl">
              {renderTitleMarkup(mockInsights.headline)}
            </h1>

            <div className="flex flex-col gap-3 mb-6">
              <p className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase border border-border px-1.5 py-0.5 rounded">Inequality Impact</span>
                {mockInsights.inequality}
              </p>
              
              {sortedByDelta.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase border border-border px-1.5 py-0.5 rounded bg-bg-main">Class Divergence</span>
                    <span className="font-medium text-text-primary">{toSignedPercent(Math.abs(parseSignedNumber(sortedByDelta[0]?.delta) - parseSignedNumber(sortedByDelta[sortedByDelta.length - 1]?.delta)))} spread</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase border border-border px-1.5 py-0.5 rounded bg-bg-main">Top Gainer Class</span>
                    <span className="font-medium text-text-primary">{sortedByDelta[0]?.segmentLabel || sortedByDelta[0]?.name || 'N/A'} ({toSignedPercent(sortedByDelta[0]?.delta)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase border border-border px-1.5 py-0.5 rounded bg-bg-main">Vulnerable Class</span>
                    <span className="font-medium text-text-primary">{sortedByDelta[sortedByDelta.length - 1]?.segmentLabel || sortedByDelta[sortedByDelta.length - 1]?.name || 'N/A'} ({toSignedPercent(sortedByDelta[sortedByDelta.length - 1]?.delta)})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Net Outcome Summary Strip (replaces visual DistributionCard components) */}
            <div className="flex flex-wrap gap-4 mt-2">
              {mockInsights.netOutcome.map((item, idx) => (
                <div key={idx} className="px-4 py-3 border rounded-lg bg-bg-card border-border max-w-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">{item.label}</span>
                    <span className="w-px h-6 bg-border" />
                    <span className={`text-sm font-semibold ${item.isPositive ? 'text-accent-positive' : 'text-accent-negative'}`}>
                      {item.outcome} <span className="font-bold">({item.value})</span>
                    </span>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[10px] font-bold tracking-widest uppercase text-text-muted">
                      Why this group?
                    </summary>
                    <p className="text-xs text-text-secondary leading-relaxed mt-2">{item.why}</p>
                  </details>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 items-start">

            {/* Left Column (Charts and Pathways) */}
            <div className="min-w-0 flex-1 flex flex-col gap-6">

              {/* Causal Pathway Preview */}
              <Card className="bg-bg-card p-5 border-border">
                <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Redistribution Pathway</p>
                <div className="flex items-center flex-wrap gap-2 text-xs font-mono font-bold tracking-tight">
                  {mockInsights.causalPathway.map((node, idx) => {
                    const isUp = node.includes('↑');
                    const isDown = node.includes('↓');
                    const cleanNode = node.replace(/[↑↓]/g, '').trim();

                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded bg-bg-main border border-border ${isUp ? 'text-accent-positive' : isDown ? 'text-accent-negative' : 'text-text-primary'}`}>
                          {cleanNode}
                          {isUp && <TrendingUp size={10} />}
                          {isDown && <TrendingDown size={10} />}
                        </span>
                        {idx < mockInsights.causalPathway.length - 1 && <ArrowRight size={10} className="text-text-muted" />}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <Card padding="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">Distribution Trend</p>
                      <p className="text-xs text-text-muted">Gini Timeline Simulation (4Q)</p>
                    </div>
                    {/* Integrated Real vs Nominal toggle */}
                    <div className="scale-90 origin-top-right">
                      <Toggle
                        checked={realToggle}
                        onChange={setRealToggle}
                        label={realToggle ? 'INR' : '%'}
                      />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={distributionTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                        formatter={(value) => [`${value}% Growth`, 'Trend']}
                      />
                      <Line type="monotone" dataKey="value" stroke="var(--text-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card padding="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">Segment Impact</p>
                      <p className="text-xs text-text-muted">Decomposition by Wealth Quintile</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={segmentDeltaData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border-default)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="segment" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={0} angle={-15} textAnchor="end" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          fontSize: '12px'  
                        }}
                      />
                      <Bar dataKey="delta" radius={[2, 2, 0, 0]}>
                        {
                          segmentDeltaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.delta < 0 ? 'var(--accent-negative)' : 'var(--accent-primary)'} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {equivalentVariation.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {equivalentVariation.map((item) => (
                    <EVCard key={item?.household || Math.random()} item={item} />
                  ))}
                </div>
              )}

              {incomeDecomposition.length > 0 && (
                <IncomeWaterfall rows={incomeDecomposition} />
              )}

              {consumptionShifts.length > 0 && (
                <Card className="bg-bg-card p-5">
                  <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Consumption Shifts Heatmap</p>
                  <div className="space-y-3">
                    {Array.from(new Set(consumptionShifts.map((item) => item?.household || 'Household'))).map((household) => {
                      const cells = consumptionShifts.filter((item) => (item?.household || 'Household') === household);
                      return (
                        <div key={household} className="grid grid-cols-[140px_1fr] gap-3 items-center">
                          <span className="text-xs font-bold tracking-wide uppercase text-text-secondary">{household}</span>
                          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
                            {cells.map((item, idx) => {
                              const numeric = parseSignedNumber(item?.percent);
                              const intensity = Math.min(1, Math.abs(numeric) / 10);
                              const background = numeric >= 0
                                ? `rgba(16, 185, 129, ${0.15 + (intensity * 0.35)})`
                                : `rgba(239, 68, 68, ${0.12 + (intensity * 0.30)})`;
                              return (
                                <div
                                  key={`${household}-${item?.sector || idx}`}
                                  className="rounded border border-border p-2 min-h-[64px] flex flex-col justify-between"
                                  style={{ background }}
                                  title={`${item?.sector || 'Sector'}: ${toSignedPercent(numeric, 2)}`}
                                >
                                  <span className="text-[10px] font-bold tracking-wide uppercase text-text-secondary">{item?.sector || 'Sector'}</span>
                                  <span className={`text-sm font-bold ${numeric >= 0 ? 'text-accent-positive' : 'text-accent-negative'}`}>
                                    {toSignedPercent(numeric, 2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

            </div>

            {/* Right Column (Attribution, Risk, Evaluation) */}
            <div className="w-full xl:w-80 shrink-0 flex flex-col gap-5">

              {/* Fairness / Objective Signal */}
              <div className="border border-border bg-risk-positive rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-accent-positive" size={14} />
                  <p className="text-[10px] font-bold text-accent-positive tracking-widest uppercase">Fairness Objective</p>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {mockInsights.fairnessSignal.text}
                </p>
              </div>

              {/* Policy Attribution (Driver Breakdown replaces ledger) */}
              <Card className="bg-bg-sidebar p-5 border-border">
                <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-4">Drivers of Redistribution</p>
                {driverSentences.length > 0 && (
                  <p className="text-xs text-text-secondary leading-relaxed mb-4 border-b border-border border-dashed pb-3">
                    {driverSentences[0]}
                  </p>
                )}
                <div className="space-y-3">
                  {mockInsights.attribution.map((driver, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-border border-dashed last:border-0 last:pb-0">
                      <span className="text-sm font-medium text-text-primary mr-2 leading-tight">{driver.driver}</span>
                      <span className={`text-sm font-bold shrink-0 ${driver.isPositive ? 'text-accent-positive' : 'text-accent-negative'}`}>{driver.effect}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Tail Risk / Edge Cases */}
              <div className="border border-border bg-risk-negative rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-accent-negative" size={14} />
                  <p className="text-[10px] font-bold text-accent-negative tracking-widest uppercase">{mockInsights.tailRisk.title}</p>
                </div>
                <ul className="list-disc pl-4 space-y-2">
                  {mockInsights.tailRisk.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-text-secondary leading-snug">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Decision Signal (Flow Control) */}
              <div className="mt-2 text-right">
                <p className="text-xs text-text-secondary leading-relaxed mb-3 pr-1 italic">
                  "{mockInsights.decision.text}"
                </p>
                <Button variant="primary" onClick={handleNextStep} className="w-full justify-center py-3">
                  Examine Personas
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DistributionImpact;
