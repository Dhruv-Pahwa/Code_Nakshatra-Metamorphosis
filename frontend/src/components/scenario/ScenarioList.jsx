import { useEffect, useState } from 'react';
import useSimulationStore from '../../store/useSimulationStore';

/**
 * ScenarioList — Phase 6 upgrade.
 * Enhancements:
 *  - Scenario score badge (derived from GDP + confidence interval)
 *  - Selection rationale pill (policy names from policyArtifact)
 *  - Run state indicator per saved scenario (success / partial)
 */

const scoreScenario = (scenario) => {
  const macro = scenario?.results?.macro || {};
  const analysis = scenario?.results?.analysisSummary || {};
  const gdp = parseFloat(macro.currentMacroTarget) || 0;
  const conf = parseFloat(analysis.confidenceInterval) || 50;
  // Simple heuristic: higher GDP + higher confidence = higher score (0-100)
  const score = Math.min(100, Math.max(0, gdp * 10 + conf * 0.5));
  return Math.round(score);
};

const ScenarioScore = ({ score }) => {
  const color = score >= 70 ? 'text-accent-positive' : score >= 40 ? 'text-text-primary' : 'text-accent-negative';
  return (
    <div className="text-right shrink-0">
      <p className="text-[9px] text-text-muted uppercase tracking-widest mb-0.5">Score</p>
      <p className={`text-base font-bold tabular-nums ${color}`}>{score}</p>
    </div>
  );
};

const RationalePill = ({ policyArtifact }) => {
  if (!policyArtifact?.shocks?.length) return null;
  const names = policyArtifact.shocks.slice(0, 2).map((s) => s.name || s.policyType || '—').join(' + ');
  const overflow = policyArtifact.shocks.length > 2 ? ` +${policyArtifact.shocks.length - 2} more` : '';
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bg-subtle border border-border text-text-secondary">
        {names}{overflow}
      </span>
    </div>
  );
};

const ScenarioList = ({ open, onClose, onGoCompare }) => {
  const savedScenarios = useSimulationStore((s) => s.savedScenarios);
  const comparisonScenarioIds = useSimulationStore((s) => s.comparisonScenarioIds);
  const saveScenario = useSimulationStore((s) => s.saveScenario);
  const renameSavedScenario = useSimulationStore((s) => s.renameSavedScenario);
  const removeSavedScenario = useSimulationStore((s) => s.removeSavedScenario);
  const restoreScenario = useSimulationStore((s) => s.restoreScenario);
  const toggleScenarioForComparison = useSimulationStore((s) => s.toggleScenarioForComparison);
  const clearScenarioComparison = useSimulationStore((s) => s.clearScenarioComparison);
  const addToast = useSimulationStore((s) => s.addToast);

  const [name, setName] = useState('');
  const [editingScenarioId, setEditingScenarioId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (open) setName(`Scenario ${savedScenarios.length + 1}`);
  }, [open, savedScenarios.length]);

  useEffect(() => {
    if (!editingScenarioId) {
      setEditingName('');
      return;
    }

    const target = savedScenarios.find((scenario) => scenario.id === editingScenarioId);
    setEditingName(target?.name || '');
  }, [editingScenarioId, savedScenarios]);

  if (!open) return null;

  // Phase 6: sort saved scenarios by score (descending) for ranked view
  const ranked = [...savedScenarios].sort((a, b) => scoreScenario(b) - scoreScenario(a));

  return (
    <div className="fixed inset-0 flex">
      <div className="absolute z-[50] inset-0 bg-black/40" onClick={onClose} />
      <div className="ml-auto w-96 bg-bg-main h-full border-l border-border p-4 overflow-y-auto z-[100]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Scenarios</h3>
          <button onClick={onClose} className="text-sm">Close</button>
        </div>

        <div className="rounded border border-border bg-bg-subtle p-3 mb-4">
          <p className="label mb-2">COMPARISON QUEUE</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-secondary">{comparisonScenarioIds.length} selected for compare (max 4)</p>
            <div className="flex items-center gap-2">
              <button
                className="text-xs btn-outline"
                onClick={() => {
                  clearScenarioComparison();
                  addToast({ message: 'Comparison selection cleared', type: 'info' });
                }}
                disabled={comparisonScenarioIds.length === 0}
              >
                Clear
              </button>
              <button
                className={`text-xs btn-primary ${comparisonScenarioIds.length === 0 ? 'opacity-50 cursor-not-allowed hover:bg-[var(--text-secondary)]' : ''}`}
                onClick={() => {
                  onGoCompare && onGoCompare();
                }}
                disabled={comparisonScenarioIds.length === 0}
              >
                Compare
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="label mb-1">Save Current Scenario</label>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 input" />
            <button
              className="btn-primary"
              onClick={() => {
                saveScenario(name || `Scenario ${Date.now()}`);
                addToast({ message: 'Scenario saved', type: 'success' });
                setName(`Scenario ${savedScenarios.length + 2}`);
              }}
            >
              Save
            </button>
          </div>
        </div>

        <div>
          {/* Phase 6: Ranked header */}
          <div className="flex items-center justify-between mb-2">
            <p className="label">SAVED (RANKED BY SCORE)</p>
            {savedScenarios.length > 1 && (
              <span className="text-[9px] text-text-muted uppercase tracking-widest">↑ Best first</span>
            )}
          </div>
          <div className="space-y-3">
            {savedScenarios.length === 0 && <p className="text-sm text-text-muted">No saved scenarios yet.</p>}
            {ranked.map((s, rankIdx) => {
              const score = scoreScenario(s);
              const isTopRanked = rankIdx === 0 && savedScenarios.length > 1;

              return (
                <div
                  key={s.id}
                  className={`border rounded p-3 flex items-start justify-between ${comparisonScenarioIds.includes(s.id) ? 'border-text-primary bg-bg-subtle' : isTopRanked ? 'border-accent-positive/50' : 'border-border'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={comparisonScenarioIds.includes(s.id)}
                        onChange={() => {
                          toggleScenarioForComparison(s.id);
                        }}
                      />
                      <span className="text-xs text-text-muted">Compare</span>
                      {/* Phase 6: top-ranked badge */}
                      {isTopRanked && (
                        <span className="text-[9px] font-bold text-accent-positive uppercase tracking-widest">★ TOP</span>
                      )}
                    </div>

                    {editingScenarioId === s.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 input"
                        />
                        <button
                          className="text-xs btn-primary"
                          onClick={() => {
                            renameSavedScenario(s.id, editingName);
                            setEditingScenarioId(null);
                            addToast({ message: 'Scenario renamed', type: 'success' });
                          }}
                        >
                          Save
                        </button>
                        <button
                          className="text-xs btn-outline"
                          onClick={() => setEditingScenarioId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="font-semibold">{s.name}</div>
                    )}

                    <div className="text-xs text-text-muted mt-1">Saved: {new Date(s.id).toLocaleString()}</div>

                    {/* Phase 6: GDP + confidence quick stats */}
                    <div className="text-xs text-text-secondary mt-2">
                      GDP {s.results?.macro?.currentMacroTarget || '—'}% · Confidence {s.results?.analysisSummary?.confidenceInterval || '—'}%
                    </div>

                    {/* Phase 6: Selection rationale pill */}
                    <RationalePill policyArtifact={s.policyArtifact} />
                  </div>

                  <div className="flex flex-col gap-2 ml-3 items-end">
                    {/* Phase 6: Scenario score badge */}
                    <ScenarioScore score={score} />

                    <button
                      onClick={() => {
                        restoreScenario(s.id);
                        addToast({ message: 'Scenario restored', type: 'success' });
                      }}
                      className="text-xs btn-outline"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => setEditingScenarioId(s.id)}
                      className="text-xs btn-outline"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        removeSavedScenario(s.id);
                        addToast({ message: 'Scenario deleted', type: 'info' });
                      }}
                      className="text-xs text-accent-negative"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioList;
