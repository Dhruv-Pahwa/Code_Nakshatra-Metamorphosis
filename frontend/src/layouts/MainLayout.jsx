import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import StepperNavigation from '../components/ui/StepperNavigation';
import ThemeToggle from '../components/ui/ThemeToggle';
import useSimulationStore, { STEPS } from '../store/useSimulationStore';
import Toast from '../components/ui/Toast';
import ScenarioList from '../components/scenario/ScenarioList';
import { Bell, Settings, Sparkles } from 'lucide-react';
import AISidebar from '../components/ui/AISidebar';
import useThemeStore from '../store/useThemeStore';

// Top global nav bar — simplified: app name + execute button
const TopBar = ({ onRunSimulation, isSimulating, onOpenScenarios, onExportBrief, onLogoClick, onToggleAI, isSidebarOpen }) => (
  <header className="h-12 border-b border-border flex items-center justify-between px-6 bg-bg-main shrink-0">
    <button onClick={onLogoClick} className="hover:opacity-80 transition-opacity">
      <span className="font-bold text-sm tracking-tight text-text-primary">Analytical Archive</span>
    </button>
    <div className="flex items-center gap-3">
      {/* Phase 7: Export Policy Brief Button */}
      <button
        onClick={onExportBrief}
        className="h-8 px-3 rounded bg-bg-card border border-border text-[10px] font-bold tracking-widest uppercase text-text-primary hover:bg-bg-subtle transition-colors flex items-center gap-2"
      >
        Export Brief
      </button>
      <button
        onClick={onRunSimulation}
        disabled={isSimulating}
        className="btn-primary flex items-center gap-2"
      >
        {isSimulating ? (
          <>
            <span className="w-3 h-3 border border-bg-main border-t-transparent rounded-full animate-spin" />
            SIMULATING...
          </>
        ) : 'EXECUTE RUN'}
      </button>
      <button className="w-7 h-7 rounded-full bg-bg-card text-xs flex items-center justify-center border border-border">
        <Settings size={16} color="var(--text-primary)" />
      </button>
      <button className="w-7 h-7 rounded-full bg-bg-card text-xs flex items-center justify-center border border-border">
        <Bell size={16} color="var(--text-primary)" />
      </button>
      <button 
        onClick={onToggleAI}
        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${isSidebarOpen ? 'bg-accent-primary border-accent-primary text-bg-main shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.5)]' : 'bg-bg-card border-border text-text-primary hover:border-accent-primary/50'}`}
        title="AI Assistant"
      >
        <Sparkles size={16} />
      </button>
      <ThemeToggle />
      <button
        onClick={onOpenScenarios}
        className="h-8 px-3 rounded bg-bg-card border border-border text-xs"
      >
        Scenarios
      </button>
      <div className="w-7 h-7 rounded-full bg-text-primary flex items-center justify-center text-bg-main text-xs font-bold">A</div>
    </div>
  </header>
);

// Simulation context bar — persistent strip showing active simulation context
const SimulationContextBar = () => {
  const policies = useSimulationStore((s) => s.policies);
  const results = useSimulationStore((s) => s.results);
  const macro = results?.macro || {};
  const runStatusText = useSimulationStore((s) => s.runStatusText);
  const lastRunAt = useSimulationStore((s) => s.lastRunAt);
  const simulationProgress = useSimulationStore((s) => s.simulationProgress);
  const isSimulating = useSimulationStore((s) => s.isSimulating);
  const runState = useSimulationStore((s) => s.runState);

  const statusColor = {
    idle: 'text-text-muted',
    running: 'text-accent-primary',
    success: 'text-accent-positive',
    partial: 'text-text-primary',
    error: 'text-accent-negative',
  };

  return (
    <div className="h-8 border-b border-border bg-bg-subtle flex items-center justify-between px-6 text-[10px] text-text-muted tracking-widest uppercase shrink-0">
      <div className="flex items-center gap-6">
        <span>{policies.length} policies defined</span>
        <span className="text-border">·</span>
        <span>GDP baseline: {macro.fiscalYearBaseline || '—'}</span>
        {/* Phase 7: Confidence badge with scenario status and baseline source */}
        {lastRunAt && (
          <>
            <span className="text-border">·</span>
            <div className={`flex items-center gap-1.5 border px-2 py-0.5 rounded ${runState === 'success' ? 'border-accent-positive text-accent-positive bg-accent-positive/10' : runState === 'error' ? 'border-accent-negative text-accent-negative bg-accent-negative/10' : 'border-border text-text-primary bg-bg-card'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${runState === 'success' ? 'bg-accent-positive' : runState === 'error' ? 'bg-accent-negative' : 'bg-text-primary'}`} />
              <span className="font-bold tracking-widest leading-none mt-px">
                Confidence {results?.analysisSummary?.confidenceInterval || '95'}%
              </span>
              <span className="text-[8px] opacity-80 mt-px ml-1">
                ({Array.isArray(results?.scenarios?.provenance?.sourceMetadata?.baselineSources) ? results.scenarios.provenance.sourceMetadata.baselineSources[0] : 'MOSPI / PLFS 2022-23'})
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {runStatusText && <span className={`text-[11px] font-medium ${statusColor[runState] || statusColor.idle}`}>{runStatusText}</span>}
        {isSimulating && <span className="text-[10px]">{Math.round(simulationProgress)}%</span>}
        {lastRunAt && <span className="text-[10px] text-text-muted">Last: {new Date(lastRunAt).toLocaleTimeString()}</span>}
        <span>Simulation 8842-X</span>
      </div>
    </div>
  );
};

const SimulationProgressStrip = () => {
  const isSimulating = useSimulationStore((s) => s.isSimulating);
  const runStatusText = useSimulationStore((s) => s.runStatusText);
  const simulationProgress = useSimulationStore((s) => s.simulationProgress);

  if (!isSimulating) return null;

  return (
    <div className="border-b border-border bg-bg-card px-6 py-2">
      <div className="flex items-center justify-between mb-1 text-[10px] tracking-widest uppercase text-text-muted">
        <span>{runStatusText || 'Simulation in progress'}</span>
        <span>{Math.round(simulationProgress)}%</span>
      </div>
      <div className="h-1 w-full rounded bg-bg-subtle overflow-hidden">
        <div
          className="h-full bg-text-primary transition-all duration-500"
          style={{ width: `${simulationProgress}%` }}
        />
      </div>
    </div>
  );
};

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    runSimulation,
    isSimulating,
    setStep,
    currentStep,
    lastRunAt,
    addToast,
    exportPolicyBrief,
    isSidebarOpen,
    toggleSidebar,
  } = useSimulationStore();
  const [openScenarios, setOpenScenarios] = useState(false);

  const handleOpenScenarios = useCallback(() => {
    if (isSidebarOpen) toggleSidebar();
    setOpenScenarios(true);
  }, [isSidebarOpen, toggleSidebar]);

  const handleToggleAI = useCallback(() => {
    if (openScenarios) setOpenScenarios(false);
    toggleSidebar();
  }, [openScenarios, toggleSidebar]);

  const navigateToStep = useCallback((targetStep) => {
    const bounded = Math.max(0, Math.min(targetStep, STEPS.length - 1));
    const target = STEPS[bounded];
    if (!target) return;

    // Guard: Prevent going beyond Policy Studio if no simulation run
    if (bounded > 0 && !lastRunAt) {
      addToast({
        title: 'Execution Required',
        message: 'Please EXECUTE the simulation first to view impact analysis.',
        type: 'info'
      });
      return;
    }

    setStep(bounded);
    if (location.pathname !== target.path) {
      navigate(target.path);
    }
  }, [location.pathname, navigate, setStep, lastRunAt, addToast]);

  // Sync URL -> step on navigation / reload
  useEffect(() => {
    const match = STEPS.find((s) => s.path === location.pathname);

    // Guard: Direct URL access protection
    if (match && match.id > 0 && !lastRunAt) {
      navigate('/policy', { replace: true });
      addToast({
        title: 'Execution Required',
        message: 'Please EXECUTE the simulation first to view impact analysis.',
        type: 'info'
      });
      return;
    }

    if (match) setStep(match.id);
  }, [location.pathname, setStep, lastRunAt, navigate, addToast]);

  // Keyboard navigation (left/right) for flow
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement?.isContentEditable;
      if (editing) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToStep(currentStep - 1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToStep(currentStep + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentStep, navigateToStep]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-main">
      <Toast />
      <TopBar 
        onRunSimulation={runSimulation} 
        isSimulating={isSimulating} 
        onOpenScenarios={handleOpenScenarios} 
        onExportBrief={exportPolicyBrief}
        onLogoClick={() => navigate('/')}
        onToggleAI={handleToggleAI}
        isSidebarOpen={isSidebarOpen}
      />
      <AISidebar />
      <StepperNavigation />
      <SimulationContextBar />
      <SimulationProgressStrip />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <ScenarioList
        open={openScenarios}
        onClose={() => setOpenScenarios(false)}
        onGoCompare={() => {
          setOpenScenarios(false);
          setStep(6);
          navigate('/compare');
        }}
      />
    </div>
  );
};

export default MainLayout;
