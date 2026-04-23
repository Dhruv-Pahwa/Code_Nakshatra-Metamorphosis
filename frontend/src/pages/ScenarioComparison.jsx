import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Target, Check } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import InsightHeader from '../components/ui/InsightHeader';
import FlowTransition from '../components/ui/FlowTransition';
import ComparisonTable from '../components/comparison/ComparisonTable';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useSimulationStore from '../store/useSimulationStore';

const DOT_COLORS = [
  'var(--accent-positive)',
  'var(--accent-primary)',
  'var(--text-muted)',
  'var(--accent-negative)',
];

const readScenarioMetric = (scenario, key) => {
  if (!scenario) return '—';
  if (key === 'gdp') return `${scenario.results?.macro?.currentMacroTarget || '—'}%`;
  if (key === 'gini') return scenario.results?.distribution?.giniDelta || '—';
  if (key === 'confidence') return `${scenario.results?.analysisSummary?.confidenceInterval || '—'}%`;
  if (key === 'fiscal') return `${scenario.results?.analysisSummary?.netFiscalImpact || '—'}%`;
  return '—';
};

const ScenarioComparison = () => {
  const {
    results,
    activeRunSnapshot,
    saveScenario,
    savedScenarios,
    comparisonScenarioIds,
    toggleScenarioForComparison,
    clearScenarioComparison,
    addToast,
    isSimulating,
    runStatusText,
    lastRunAt,
  } = useSimulationStore();

  const sc = results?.scenarios || {};
  const tradeoffData = Array.isArray(sc.tradeoffData) ? sc.tradeoffData : [];
  const metrics = Array.isArray(sc.metrics) ? sc.metrics : [];
  const scenarioColumns = Array.isArray(sc.scenarioColumns) ? sc.scenarioColumns : [];
  const selectedScenarios = savedScenarios.filter((scenario) => comparisonScenarioIds.includes(scenario.id));
  const currentScenarioCard = lastRunAt ? {
    id: 'current-run',
    name: activeRunSnapshot?.ui_meta?.run_name || sc.reformALabel || 'Current Run',
    results,
  } : null;
  const compareCards = [currentScenarioCard, ...selectedScenarios].filter(Boolean);
  const scenarioDiffMetrics = [
    { key: 'gdp', label: 'GDP Target' },
    { key: 'gini', label: 'Gini Delta' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'fiscal', label: 'Net Fiscal Impact' },
  ];

  const fallbackVerdict = sc.verdict || {
    summary: 'Scenario verdict unavailable for this run.',
    detail: 'Run a complete simulation to populate scenario verdict details.',
  };

  const rankedOptions = (scenarioColumns.length > 0
    ? scenarioColumns.map((column) => ({
      label: column?.name || 'Scenario',
      score: Number(column?.score || 0),
      rationale: `${column?.metrics?.gdp || '—'} GDP, ${column?.metrics?.gini || '—'} Gini, ${column?.metrics?.confidence || '—'} confidence`,
      source: column?.source,
    }))
    : [
      {
        label: sc.reformALabel || 'Reform A',
        score: tradeoffData.find((item) => item.name === 'Reform A')?.growth || 0,
        rationale: metrics[0]?.reformADelta || fallbackVerdict.summary,
        source: 'current',
      },
      {
        label: sc.reformBLabel || 'Reform B',
        score: tradeoffData.find((item) => item.name === 'Reform B')?.growth || 0,
        rationale: metrics[0]?.reformBDelta || fallbackVerdict.detail,
        source: 'saved',
      },
    ]).sort((a, b) => b.score - a.score);
  const recommendedOption = rankedOptions[0];

  const comparisonRows = scenarioDiffMetrics.map((metric) => ({
    key: metric.key,
    label: metric.label,
    values: Object.fromEntries(
      scenarioColumns.map((column) => [column.id, column?.metrics?.[metric.key] || '—'])
    ),
  }));

  const handleCommit = () => {
    saveScenario(currentScenarioCard?.name || 'Committed Scenario');
    addToast({ message: 'Scenario committed successfully.', type: 'success' });
  };

  return (
    <MainLayout>
      <div className="page-enter">
        <div className="page-content">
          <InsightHeader
            stepNumber={7}
            totalSteps={7}
            stepLabel="Scenario Comparison"
            title={sc.title || 'Compare scenario outcomes and commit a decision path.'}
            implication={sc.insightImplication}
            contextBridge={sc.contextBridge}
            userIntent={sc.userIntent}
            provenanceLabel={Array.isArray(results?.scenarios?.provenance?.matchedRules) ? results.scenarios.provenance.matchedRules.map((r) => typeof r === 'object' ? (r.name || r.id) : r).join(' · ') : 'CGE-derived scenario ranking'}
            confidenceLevel={parseFloat(results?.analysisSummary?.confidenceInterval || '0') >= 95 ? 'high' : 'medium'}
            matchedRules={Array.isArray(results?.scenarios?.provenance?.matchedRules) ? results.scenarios.provenance.matchedRules : []}
          />

          {!lastRunAt && !isSimulating && (
            <div className="gap-section">
              <Card padding="p-10" className="text-center border-dashed border-2">
                <Target size={40} className="mx-auto text-text-muted mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-text-primary mb-2">No Active Simulation Results</h3>
                <p className="text-sm text-text-secondary max-w-md mx-auto">
                  Comparison data is generated after a simulation run. Head to the Policy Studio to define a policy stack and execute a run.
                </p>
                <Button variant="primary" onClick={() => (window.location.href = '/policy')} className="mt-6 mx-auto">
                  START SIMULATION
                </Button>
              </Card>
            </div>
          )}

          {isSimulating && (
            <div className="mb-6 rounded border border-border bg-bg-card px-4 py-3">
              <p className="label-muted">SIMULATION STATUS</p>
              <p className="text-sm text-text-secondary mt-1">{runStatusText || 'Refreshing scenario comparisons...'}</p>
            </div>
          )}

          <div className="gap-section">
            <Card padding="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="label mb-1">SAVED SCENARIO PICKER</p>
                  <p className="text-xs text-text-secondary">Select up to 4 saved scenarios for side-by-side comparison.</p>
                </div>
                <button
                  className="text-xs btn-outline"
                  onClick={() => {
                    clearScenarioComparison();
                    addToast({ message: 'Comparison selection cleared', type: 'info' });
                  }}
                  disabled={comparisonScenarioIds.length === 0}
                >
                  Clear Selection
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {savedScenarios.length === 0 && (
                  <p className="text-sm text-text-muted">No saved scenarios yet. Save runs from the scenario drawer to compare them here.</p>
                )}

                {savedScenarios.map((scenario) => {
                  const selected = comparisonScenarioIds.includes(scenario.id);
                  return (
                    <button
                      key={scenario.id}
                      className={`px-3 py-2 rounded border text-xs transition-colors ${selected ? 'border-text-primary bg-bg-subtle text-text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}
                      onClick={() => toggleScenarioForComparison(scenario.id)}
                    >
                      {selected ? <Check size={12} className="inline mr-1" /> : null}
                      {scenario.name}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {compareCards.length > 1 && (
            <div className="gap-section">
              <Card padding="p-6">
                <p className="label mb-4">MULTI-SCENARIO DIFFERENCE VIEW</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 pr-6">
                          <span className="label">METRIC</span>
                        </th>
                        {compareCards.map((scenario) => (
                          <th key={scenario.id} className="text-center py-3 px-4">
                            <div className="label">SCENARIO</div>
                            <div className="text-xs font-semibold text-text-primary">{scenario.name}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scenarioDiffMetrics.map((metric) => (
                        <tr key={metric.key} className="border-b border-border hover:bg-bg-subtle transition-colors">
                          <td className="py-3 pr-6 font-semibold text-text-primary">{metric.label}</td>
                          {compareCards.map((scenario) => (
                            <td key={`${scenario.id}-${metric.key}`} className="text-center py-3 px-4 text-text-secondary font-medium">
                              {readScenarioMetric(scenario, metric.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          <div className="gap-section-lg">
            <Card padding="p-8" className="border-l-4 border-l-text-primary">
              <div className="flex items-start gap-3 mb-5">
                <Target size={20} className="mt-0.5 text-text-primary" />
                <h3 className="font-bold text-text-primary text-lg">Analytical Verdict</h3>
              </div>

              <blockquote className="border border-border rounded p-5 bg-bg-subtle mb-5">
                <p className="text-base text-text-primary italic leading-relaxed">{fallbackVerdict.summary}</p>
              </blockquote>

              {recommendedOption && (
                <div className="border border-border rounded bg-bg-card p-4 mb-5">
                  <p className="label mb-2">RECOMMENDED DECISION</p>
                  <p className="text-sm font-bold text-text-primary">{recommendedOption.label}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Ranked first with score {recommendedOption.score}. Rationale: {recommendedOption.rationale}
                  </p>
                </div>
              )}

              <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-2xl">
                {fallbackVerdict.detail}
              </p>

              <Button variant="primary" onClick={handleCommit} className="justify-center px-8">
                COMMIT SCENARIO
              </Button>
            </Card>
          </div>

          <div className="gap-section">
            <p className="label mb-4">COMPARATIVE ANALYSIS</p>
            <Card padding="p-6">
              <ComparisonTable
                metrics={metrics}
                reformALabel={sc.reformALabel || 'REFORM A'}
                reformBLabel={sc.reformBLabel || 'REFORM B'}
                recommendedReform={recommendedOption?.source === 'current' ? 'A' : recommendedOption ? 'B' : null}
                columns={scenarioColumns}
                rows={comparisonRows}
              />
            </Card>
          </div>

          <div className="gap-section">
            <div className="grid grid-cols-2 gap-6">
              <Card padding="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-text-primary text-sm mb-1">Trade-off Matrix</p>
                    <p className="label-muted">GROWTH VS DEBT CORRELATION</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {tradeoffData.map((d, idx) => (
                      <div key={d?.name || idx} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DOT_COLORS[idx % DOT_COLORS.length] }} />
                        <span className="label-muted">{String(d?.name || 'Unknown').toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis
                      dataKey="growth"
                      name="Economic Growth Rate"
                      label={{ value: 'ECONOMIC GROWTH RATE', position: 'insideBottom', offset: -10, style: { fontSize: 9, fill: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' } }}
                      tick={false}
                    />
                    <YAxis
                      dataKey="debt"
                      name="Public Debt Exposure"
                      label={{ value: 'PUBLIC DEBT EXPOSURE', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 9, fill: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' } }}
                      tick={false}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="card p-2 text-xs">
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-text-secondary">Growth: {d.growth} · Debt: {d.debt}</p>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={tradeoffData}>
                      {tradeoffData.map((entry, idx) => (
                        <Cell key={entry?.name || idx} fill={DOT_COLORS[idx % DOT_COLORS.length]} r={8} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>

              <div className="space-y-4">
                <Card padding="p-6">
                  <p className="label-muted mb-2">SIMULATION DESCRIPTION</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{sc.description || 'Simulation description unavailable.'}</p>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border rounded-lg p-5 bg-bg-card">
                    <p className="label-muted mb-2">CURRENT RUN</p>
                    <p className="text-sm font-semibold text-text-primary">{sc.reformALabel || currentScenarioCard?.name || 'N/A'}</p>
                  </div>
                  <div className="border border-border rounded-lg p-5 bg-bg-card">
                    <p className="label-muted mb-2">TOP COMPARATOR</p>
                    <p className="text-sm font-semibold text-text-primary">{sc.reformBLabel || recommendedOption?.label || 'Add saved scenario'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FlowTransition
          stepNumber={7}
          totalSteps={7}
          isComplete={true}
        />
      </div>
    </MainLayout>
  );
};

export default ScenarioComparison;
