import { useState } from 'react';
import Card from '../ui/Card';

/**
 * PersonaCard — Phase 6 upgrade.
 * New props surfaced through `persona`:
 *   persona.computedImpact   {object}  — { realIncomeDelta, wageDelta, copcDelta }
 *   persona.narrative        {string}  — 2-sentence grounded LLM/fallback narrative
 * Retained: existing breakdown, tag, netImpact, name, sector, description.
 */
const ImpactChip = ({ label, value, positive }) => (
  <div className="flex flex-col items-center gap-0.5 min-w-[64px]">
    <span className={`text-sm font-bold tabular-nums ${positive ? 'text-accent-positive' : 'text-accent-negative'}`}>
      {value}
    </span>
    <span className="text-[9px] text-text-muted uppercase tracking-widest font-semibold">{label}</span>
  </div>
);

const PersonaCard = ({ persona }) => {
  const [expanded, setExpanded] = useState(false);
  const {
    name,
    sector,
    description,
    netImpact,
    tag,
    breakdown,
    computedImpact,
    narrative,
  } = persona;

  const isPositive = netImpact.startsWith('+');

  const chips = computedImpact ? [
    {
      label: 'INCOME Δ',
      value: computedImpact.realIncomeDelta || '—',
      positive: String(computedImpact.realIncomeDelta || '').startsWith('+'),
    },
    {
      label: 'WAGE Δ',
      value: computedImpact.wageDelta || '—',
      positive: String(computedImpact.wageDelta || '').startsWith('+'),
    },
    {
      label: 'COST Δ',
      value: computedImpact.copcDelta || '—',
      positive: !String(computedImpact.copcDelta || '').startsWith('+'),
    },
  ] : [];

  return (
    <Card className="mb-4" hover>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-2">
            <h3 className="text-lg font-bold text-text-primary">{name}</h3>
            <span className="text-xs text-text-secondary">{sector}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-2xl">{description}</p>

          {/* Phase 6: Computed impact chips */}
          {chips.length > 0 && (
            <div className="flex items-center gap-4 mb-4 px-3 py-2 rounded bg-bg-subtle border border-border">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-text-muted mr-1">COMPUTED IMPACT</span>
              {chips.map((chip) => (
                <ImpactChip
                  key={chip.label}
                  label={chip.label}
                  value={chip.value}
                  positive={chip.positive}
                />
              ))}
            </div>
          )}

          {/* Phase 6: Grounded narrative snippet */}
          {narrative && (
            <p className="text-xs text-text-secondary italic leading-relaxed border-l-2 border-border pl-2 mb-4 max-w-lg">
              "{narrative}"
            </p>
          )}

          {expanded && breakdown && (
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border mb-4">
              <div>
                <p className="label mb-1">TAX ADJUSTMENTS</p>
                <p className="text-sm font-semibold text-text-primary">{breakdown.taxAdjustments}</p>
              </div>
              <div>
                <p className="label mb-1">COST OF LIVING</p>
                <p className={`text-sm font-semibold ${breakdown.costOfLiving.startsWith('+') ? 'text-accent-positive' : 'text-accent-negative'}`}>
                  {breakdown.costOfLiving}
                </p>
              </div>
              <div>
                <p className="label mb-1">REBATE CREDIT</p>
                <p className="text-sm font-semibold text-text-primary">{breakdown.rebateCredit}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 label text-text-secondary hover:text-text-primary transition-colors"
          >
            EXPAND BREAKDOWN
            <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>⌄</span>
          </button>
        </div>

        {/* Right: net impact */}
        <div className="text-right shrink-0">
          <p className="label mb-2">NET ANNUAL IMPACT</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-accent-positive' : 'text-accent-negative'}`}>
            {netImpact}
          </p>
          {/* Visual bar */}
          <div className="mt-2 h-0.5 w-24 ml-auto rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full ${isPositive ? 'bg-accent-positive' : 'bg-accent-negative'}`}
              style={{ width: '70%' }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">{tag}</p>
        </div>
      </div>
    </Card>
  );
};

export default PersonaCard;
