/**
 * ComparisonTable — Phase 6 upgrade.
 * New row-level props:
 *   row.winner       {'A'|'B'|'baseline'|null}  — which reform wins on this metric
 *   row.rationale    {string}                    — plain-English recommendation for this row
 * New component-level prop:
 *   recommendedReform  {'A'|'B'|null}  — overall recommendation badge in header
 */

const rankBadge = (winner, column) => {
  if (!winner) return null;
  const map = {
    A: { A: '★ BEST', B: null },
    B: { A: null, B: '★ BEST' },
    baseline: { A: null, B: null },
  };
  const label = map[winner]?.[column] || null;
  if (!label) return null;
  return (
    <span className="ml-1 text-[9px] font-bold tracking-widest text-accent-positive">
      {label}
    </span>
  );
};

const ComparisonTable = ({
  metrics,
  reformALabel,
  reformBLabel,
  recommendedReform,
  columns = null,
  rows = null,
}) => (
  <div className="overflow-x-auto">
    {Array.isArray(columns) && Array.isArray(rows) ? (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 pr-6">
              <span className="label">KEY METRIC</span>
            </th>
            {columns.map((column, idx) => (
              <th key={column?.id || idx} className="text-center py-3 px-4">
                <div className={`label ${idx === 0 ? 'text-accent-positive' : 'text-text-muted'}`}>
                  {column?.source === 'current' ? 'CURRENT' : 'SAVED'}
                </div>
                <div className="text-xs font-semibold text-text-primary">{column?.name || `Scenario ${idx + 1}`}</div>
                {idx === 0 && (
                  <div className="text-[9px] text-accent-positive font-bold tracking-widest mt-0.5">★ ACTIVE</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row?.key || idx} className="border-b border-border hover:bg-bg-subtle transition-colors">
              <td className="py-4 pr-6">
                <div className="font-semibold text-text-primary">{row.label}</div>
              </td>
              {columns.map((column, cidx) => {
                const value = row.values?.[column.id] || '—';
                return (
                  <td key={`${column?.id || cidx}-${row?.key || idx}`} className="text-center py-4 px-4">
                    <span className={`font-bold ${String(value).startsWith('-') ? 'text-accent-negative' : 'text-accent-positive'}`}>
                      {value}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <>
    {/* Phase 6: Overall recommendation banner */}
    {recommendedReform && (
      <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded border border-border bg-bg-subtle">
        <span className="text-[9px] font-bold tracking-widest uppercase text-text-muted">RECOMMENDED</span>
        <span className="font-semibold text-text-primary">
          {recommendedReform === 'A' ? (reformALabel || 'Reform A') : (reformBLabel || 'Reform B')}
        </span>
        <span className="ml-auto text-xs text-accent-positive font-semibold">★ Best overall outcome</span>
      </div>
    )}

    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-3 pr-6">
            <span className="label">KEY METRIC</span>
          </th>
          <th className="text-center py-3 px-4">
            <div className="label">BASELINE</div>
            <div className="text-xs font-semibold text-text-primary">Current Trend</div>
          </th>
          <th className="text-center py-3 px-4">
            <div className={`label ${recommendedReform === 'A' ? 'text-accent-positive' : 'text-accent-positive'}`}>REFORM A</div>
            <div className="text-xs font-semibold text-text-primary">
              {reformALabel || 'Fiscal Stimulus'}
            </div>
            {recommendedReform === 'A' && (
              <div className="text-[9px] text-accent-positive font-bold tracking-widest mt-0.5">★ RECOMMENDED</div>
            )}
          </th>
          <th className="text-center py-3 px-4">
            <div className="label text-accent-negative">REFORM B</div>
            <div className="text-xs font-semibold text-text-primary">
              {reformBLabel || 'Austerity Plus'}
            </div>
            {recommendedReform === 'B' && (
              <div className="text-[9px] text-accent-positive font-bold tracking-widest mt-0.5">★ RECOMMENDED</div>
            )}
          </th>
        </tr>
      </thead>
      <tbody>
        {metrics.map((row, idx) => (
          <tr key={row?.name || idx} className="border-b border-border hover:bg-bg-subtle transition-colors">
            <td className="py-4 pr-6">
              <div className="font-semibold text-text-primary">{row.name}</div>
              {row.sub && <div className="text-xs text-text-muted mt-0.5 uppercase tracking-wider">{row.sub}</div>}
              {/* Phase 6: row-level rationale */}
              {row.rationale && (
                <div className="text-[10px] text-text-secondary italic mt-1 max-w-[220px] leading-snug">
                  {row.rationale}
                </div>
              )}
            </td>
            <td className="text-center py-4 px-4 font-medium text-text-secondary">{row.baseline}</td>
            <td className="text-center py-4 px-4">
              <span className={`font-bold ${row.reformAType === 'positive' ? 'text-accent-positive' : 'text-accent-negative'}`}>
                {row.reformA}
              </span>
              {row.reformADelta && (
                <span className={`ml-1.5 text-xs ${row.reformAType === 'positive' ? 'text-accent-positive' : 'text-accent-negative'}`}>
                  {row.reformADelta}
                </span>
              )}
              {/* Phase 6: winner badge */}
              {rankBadge(row.winner, 'A')}
            </td>
            <td className="text-center py-4 px-4">
              <span className={`font-bold ${row.reformBType === 'positive' ? 'text-accent-positive' : 'text-accent-negative'}`}>
                {row.reformB}
              </span>
              {row.reformBDelta && (
                <span className={`ml-1.5 text-xs ${row.reformBType === 'positive' ? 'text-accent-positive' : 'text-accent-negative'}`}>
                  {row.reformBDelta}
                </span>
              )}
              {rankBadge(row.winner, 'B')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
      </>
    )}
  </div>
);

export default ComparisonTable;
