import { useNavigate } from 'react-router-dom';
import useSimulationStore, { STEPS } from '../../store/useSimulationStore';
import { ChevronRight } from 'lucide-react';

/**
 * StepperNavigation — Phase 6 upgrade.
 * Enhancements:
 *  - Run-stage status text injected as a sub-label on the current step
 *  - Confidence indicator pill visible after first run (top-right of nav bar)
 *  - Step tooltip now includes description + run-stage hint
 */

const confidencePillColor = (runState) => {
  const map = {
    success: 'bg-accent-positive/15 text-accent-positive border-accent-positive/30',
    partial: 'bg-bg-subtle text-text-primary border-border',
    error: 'bg-accent-negative/15 text-accent-negative border-accent-negative/30',
    running: 'bg-bg-subtle text-text-muted border-border',
    idle: '',
  };
  return map[runState] || map.idle;
};

const StepperNavigation = () => {
  const { currentStep, setStep, lastRunAt, addToast, runState, runStatusText, isSimulating } = useSimulationStore();
  const navigate = useNavigate();

  const handleStep = (step) => {
    // Guard: Prevent going beyond Policy Studio if no simulation run
    if (step.id > 0 && !lastRunAt) {
      addToast({
        title: 'Execution Required',
        message: 'Please EXECUTE the simulation first to view impact analysis.',
        type: 'info'
      });
      return;
    }

    setStep(step.id);
    navigate(step.path);
  };

  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;
  const confidenceClass = lastRunAt ? confidencePillColor(runState) : '';

  // Phase 6: short run-stage hints per step
  const stageHints = {
    0: 'Define your policy blocks and configure shocks.',
    1: 'GDP, CPI and sectoral output driven by matched rules.',
    2: 'Income quintile impacts from rule distribution_effects.',
    3: 'Computed personas grounded in distribution outputs.',
    4: 'Edge-labelled causal chain from rule causal_chain.',
    5: 'Rule-linked refinement suggestions with tradeoffs.',
    6: 'Ranked comparison and recommended decision.',
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-0 border-b border-border bg-bg-main px-6">
        {STEPS.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <button
              key={step.id}
              onClick={() => handleStep(step)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-semibold tracking-widest uppercase transition-colors border-b-2 -mb-px group
                ${isCurrent
                  ? 'text-text-primary border-text-primary'
                  : isCompleted
                    ? 'text-text-secondary border-transparent hover:text-text-primary'
                    : `text-text-muted border-transparent ${!lastRunAt && step.id > 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-text-secondary'}`
                }`}
            >
              {/* Step indicator dot */}
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                isCurrent ? 'bg-text-primary' : isCompleted ? 'bg-accent-positive' : 'bg-border'
              }`} />

              {step.label}

              {/* Phase 6: running pulse on current step */}
              {isCurrent && isSimulating && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-ping absolute right-1 top-1" />
              )}

              {idx < STEPS.length - 1 && (
                <ChevronRight size={12} className="ml-2 text-border" />
              )}

              {/* Phase 6: enriched tooltip with stage hint */}
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-text-primary text-bg-main text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 tracking-wider max-w-[220px] text-center leading-snug">
                <strong className="block mb-0.5">{step.description}</strong>
                {stageHints[step.id]}
              </span>
            </button>
          );
        })}

        {/* Phase 6: Confidence indicator pill (right-aligned) */}
        {lastRunAt && runState !== 'idle' && (
          <div className="ml-auto flex items-center gap-2 pr-1">
            <span className={`text-[9px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded border border-border ${confidenceClass}`}>
              {isSimulating ? 'RUNNING…' : runState === 'success' ? 'ILLUSTRATIVE · NSSO 2023' : runState === 'partial' ? 'PARTIAL DATA' : runState === 'error' ? 'FALLBACK' : runStatusText}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent">
        <div
          className="h-full bg-text-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default StepperNavigation;
