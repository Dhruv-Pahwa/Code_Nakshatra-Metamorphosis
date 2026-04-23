// FlowTransition — Narrative transition at the bottom of each page
// Guides the user to the next step in the simulation journey
// Placed inside the scroll area, appears after all page content

import { useNavigate } from 'react-router-dom';
import useSimulationStore, { STEPS } from '../../store/useSimulationStore';

const ProgressDots = ({ current, total }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        className={`w-1.5 h-1.5 rounded-full transition-colors ${
          i < current ? 'bg-text-primary' : i === current ? 'bg-text-secondary' : 'bg-border'
        }`}
      />
    ))}
  </div>
);

const FlowTransition = ({
  stepNumber,
  totalSteps = 7,
  nextLabel,
  nextDescription,
  nextPath,
  bridgeText,
  isComplete = false,
}) => {
  const navigate = useNavigate();
  const { nextStep } = useSimulationStore();

  const handleNavigate = () => {
    if (isComplete) {
      // Go back to Policy Studio for a new simulation
      useSimulationStore.getState().setStep(0);
      navigate('/policy');
    } else {
      nextStep();
      navigate(nextPath);
    }
  };

  if (isComplete) {
    return (
      <div
        className="flow-transition"
        onClick={handleNavigate}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="step-indicator">Step {stepNumber} of {totalSteps} · Complete</p>
          <ProgressDots current={totalSteps} total={totalSteps} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-text-primary mb-1">
              Analysis Complete
            </p>
            <p className="text-sm text-text-secondary">
              Your simulation journey is done. Commit your findings or start a new policy analysis.
            </p>
          </div>
          <span className="text-text-muted text-sm group-hover:translate-x-1 transition-transform">
            ↻ New Simulation
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flow-transition group"
      onClick={handleNavigate}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="step-indicator">Step {stepNumber} of {totalSteps}</p>
        <ProgressDots current={stepNumber} total={totalSteps} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-text-primary mb-1 flex items-center gap-2">
            Next: {nextLabel}
            <span className="inline-block group-hover:translate-x-1.5 transition-transform duration-200 text-text-muted">
              →
            </span>
          </p>
          <p className="text-sm text-text-secondary mb-2 max-w-xl">{nextDescription}</p>
          {bridgeText && (
            <p className="text-xs text-text-muted italic max-w-lg">{bridgeText}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowTransition;
