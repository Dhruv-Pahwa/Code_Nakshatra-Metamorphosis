// InsightHeader — The "Decision Anchor"
// Phase 6 upgrade: adds provenance strip and confidence badge slots.
// 5-layer structure: step indicator → insight title → implication → context + intent → provenance
// Every page opens with this. It answers: "What should the user understand?"
import { ArrowRight, Shield } from 'lucide-react';

const renderInlineMarkup = (text) => {
  if (typeof text !== 'string') return text;

  const boldRegex = /\*\*(.*?)\*\*/g;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<strong key={`strong-${match.index}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
};

const confidenceBadgeClass = (level) => {
  const map = {
    high: 'border-accent-positive/40 text-accent-positive bg-accent-positive/10',
    medium: 'border-border text-text-primary bg-bg-subtle',
    low: 'border-accent-negative/40 text-accent-negative bg-accent-negative/10',
  };
  return map[String(level).toLowerCase()] || map.medium;
};

/**
 * InsightHeader props:
 *   stepNumber       {number}   — e.g. 1
 *   totalSteps       {number}   — e.g. 7
 *   stepLabel        {string}
 *   title            {string}   — key analytical takeaway (supports **bold**)
 *   implication      {string}   — what this means for the decision
 *   contextBridge    {string}   — reference to prior step
 *   userIntent       {string}   — what to do on this page
 *   // Phase 6 additions:
 *   provenanceLabel  {string}   — e.g. "NSSO 2023 · carbon_tax_india_v1"
 *   confidenceLevel  {string}   — 'high' | 'medium' | 'low'
 *   matchedRules     {string[]} — rule IDs shown as provenance pills
 */
const InsightHeader = ({
  stepNumber,
  totalSteps,
  stepLabel,
  title,
  implication,
  contextBridge,
  userIntent,
  /* Phase 6 additions */
  provenanceLabel,
  confidenceLevel,
  matchedRules = [],
}) => (
  <div className="mb-14">
    {/* Step indicator — very subtle */}
    {stepNumber != null && (
      <p className="step-indicator mb-3">
        Step {stepNumber} of {totalSteps} · {stepLabel}
      </p>
    )}

    {/* Insight title — the key analytical takeaway */}
    <h1 className="insight-title mb-4 max-w-4xl">{renderInlineMarkup(title)}</h1>

    {/* Implication — what this means for the decision */}
    {implication && (
      <p className="insight-implication mb-4 max-w-3xl">{implication}</p>
    )}

    {/* Context bridge — reference to prior step */}
    {contextBridge && (
      <p className="context-bridge max-w-2xl">{contextBridge}</p>
    )}

    {/* User intent — what to do on this page */}
    {userIntent && (
      <p className="user-intent mt-2 max-w-2xl flex items-start gap-1.5">
        <ArrowRight size={14} className="text-text-muted mt-0.5" />
        {userIntent}
      </p>
    )}

    {/* Phase 6: provenance + confidence row */}
    {(provenanceLabel || confidenceLevel || matchedRules.length > 0) && (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Shield icon for provenance */}
        {provenanceLabel && (
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted tracking-widest uppercase">
            <Shield size={11} className="text-text-muted" />
            <span>{provenanceLabel}</span>
          </div>
        )}

        {/* Matched rule pills */}
        {matchedRules.map((rule) => {
          const ruleLabel = typeof rule === 'object' ? rule.name || rule.id : rule;
          return (
            <span
              key={typeof rule === 'object' ? rule.id : rule}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-widest uppercase border border-border bg-bg-subtle text-text-muted"
            >
              {ruleLabel}
            </span>
          );
        })}

        {/* Confidence level badge */}
        {confidenceLevel && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${confidenceBadgeClass(confidenceLevel)}`}>
            {confidenceLevel} confidence
          </span>
        )}
      </div>
    )}
  </div>
);

export default InsightHeader;
