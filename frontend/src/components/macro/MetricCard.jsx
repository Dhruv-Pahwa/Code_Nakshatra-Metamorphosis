import { useState } from 'react';
import Card from '../ui/Card';

/**
 * MetricCard — Phase 6 upgrade.
 * New props:
 *   driverSentence  {string}  — grounded one-liner from narrative.driverSentences
 *   contributors    {Array}   — [{ label, value }] top contributors for tooltip
 *   confidence      {string}  — 'high' | 'medium' | 'low' (optional badge)
 */
const ContributorTooltip = ({ contributors }) => {
  const [visible, setVisible] = useState(false);
  if (!contributors || contributors.length === 0) return null;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded border border-border text-text-muted hover:text-text-primary hover:border-text-primary transition-colors"
        aria-label="Show top contributors"
      >
        CONTRIBUTORS ▾
      </button>
      {visible && (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-bg-card border border-border rounded shadow-lg p-3 min-w-[200px] text-xs">
          <p className="label text-[9px] mb-2">TOP CONTRIBUTORS</p>
          {contributors.map((c, i) => (
            <div key={i} className="flex items-center justify-between gap-3 mb-1 last:mb-0">
              <span className="text-text-secondary truncate">{c.label}</span>
              <span className="font-semibold text-text-primary whitespace-nowrap">{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const confidenceColors = {
  high: 'text-accent-positive',
  medium: 'text-text-primary',
  low: 'text-accent-negative',
};

const MetricCard = ({
  label,
  value,
  unit = '',
  note,
  deltaLabel,
  deltaType,
  size = 'lg',
  /* Phase 6 additions */
  driverSentence,
  contributors,
  confidence,
}) => {
  const sizeClass = size === 'hero' ? 'metric-hero' : size === 'lg' ? 'metric-lg' : 'metric-md';

  return (
    <Card padding="p-5">
      {/* Header row: label + optional confidence badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="label">{label}</p>
        {confidence && (
          <span className={`text-[9px] font-semibold tracking-widest uppercase ${confidenceColors[confidence] || 'text-text-muted'}`}>
            {confidence}
          </span>
        )}
      </div>

      <div className="flex items-end gap-1 mb-2">
        <span className={sizeClass}>{value}</span>
        {unit && <span className="text-lg text-text-secondary font-medium mb-1">{unit}</span>}
      </div>

      {deltaLabel && (
        <div className={`flex items-center gap-1 text-sm font-medium mb-2 ${deltaType === 'positive' ? 'text-accent-positive' : 'text-accent-negative'}`}>
          <span>{deltaType === 'positive' ? '↑' : '↓'}</span>
          <span>{deltaLabel}</span>
        </div>
      )}

      {/* Phase 6: grounded driver sentence */}
      {driverSentence && (
        <p className="text-xs text-text-secondary leading-relaxed mb-2 italic border-l-2 border-border pl-2">
          {driverSentence}
        </p>
      )}

      {note && <p className="text-xs text-text-muted mt-2 leading-relaxed">{note}</p>}

      {/* Phase 6: contributor tooltip */}
      {contributors && contributors.length > 0 && (
        <div className="mt-3">
          <ContributorTooltip contributors={contributors} />
        </div>
      )}
    </Card>
  );
};

export default MetricCard;
