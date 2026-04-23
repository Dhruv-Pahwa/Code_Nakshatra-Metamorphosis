import { useState } from 'react';
import Card from '../ui/Card';

/**
 * DistributionCard — Phase 6 upgrade.
 * New props surfaced through `segment`:
 *   segment.topCausalChannels  {Array}    — [{ channel, change }] from ledger
 *   segment.inrAnnualImpact    {string}   — e.g. "−₹3,200/yr"
 *   segment.driverSentence     {string}   — narrative driver text
 * Parent-level prop:
 *   showInr  {boolean}  — controlled toggle from DistributionImpact page
 */
const DistributionCard = ({ segment, showInr = false }) => {
  const [expanded, setExpanded] = useState(false);
  const {
    segmentLabel,
    name,
    delta,
    description,
    netImpact,
    topCausalChannels = [],
    inrAnnualImpact,
    driverSentence,
  } = segment;

  const isPositive = (showInr && inrAnnualImpact)
    ? !inrAnnualImpact.startsWith('−') && !inrAnnualImpact.startsWith('-')
    : delta.startsWith('+');

  const displayPositive = (showInr && inrAnnualImpact)
    ? !inrAnnualImpact.startsWith('−') && !inrAnnualImpact.startsWith('-')
    : isPositive;

  return (
    <Card padding="p-6" className="flex-1 min-w-0">
      <p className="label mb-3">{segmentLabel}</p>
      <h3 className="text-base font-semibold text-text-primary mb-4">{name}</h3>

      {/* Main delta value */}
      <div className={`text-5xl font-bold leading-none mb-1 ${displayPositive ? 'text-accent-positive' : 'text-accent-negative'}`}>
        {showInr && inrAnnualImpact ? inrAnnualImpact : (
          <>{delta}<span className="text-2xl">%</span></>
        )}
      </div>
      <p className="text-xs text-text-secondary mb-4">{description}</p>

      {/* Phase 6: driver sentence */}
      {driverSentence && (
        <p className="text-[11px] text-text-muted italic leading-relaxed border-l-2 border-border pl-2 mb-4">
          {driverSentence}
        </p>
      )}

      {/* Phase 6: "Why this group?" expandable panel */}
      {topCausalChannels.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-text-muted hover:text-text-primary transition-colors"
          >
            <span className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span>
            WHY THIS GROUP?
          </button>
          {expanded && (
            <div className="mt-3 space-y-2 pl-3 border-l border-border">
              <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">TOP CAUSAL CHANNELS</p>
              {topCausalChannels.map((ch, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{ch.channel}</span>
                  <span className={`font-semibold tabular-nums ${ch.change?.startsWith('+') ? 'text-accent-positive' : 'text-accent-negative'}`}>
                    {ch.change}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <p className="label mb-1">NET IMPACT</p>
        <p className={`text-sm font-semibold ${isPositive ? 'text-accent-positive' : 'text-accent-negative'}`}>
          {netImpact}
        </p>
      </div>
    </Card>
  );
};

export default DistributionCard;
