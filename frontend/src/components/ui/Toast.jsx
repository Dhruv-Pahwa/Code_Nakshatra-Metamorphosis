import { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import useSimulationStore from '../../store/useSimulationStore';

/**
 * Toast — Phase 6 upgrade.
 * Enhancements:
 *  - Run-stage aware icon (success / info / error / warning)
 *  - 'confidence' type: yellow/amber styling for confidence-warning messages
 *  - 'stage' type: neutral with stage label formatting
 *  - Progress micro-bar for long-duration toasts (duration > 5000ms)
 */

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  confidence: AlertTriangle,
  info: Info,
  stage: Info,
};

const TOAST_STYLES = {
  success: 'bg-accent-positive/10 border-accent-positive/30 text-accent-positive',
  error: 'bg-accent-negative text-white border-transparent',
  warning: 'bg-yellow-900/30 border-yellow-500/40 text-yellow-400',
  confidence: 'bg-yellow-900/30 border-yellow-500/40 text-yellow-400',
  info: 'bg-bg-card text-text-primary border-border',
  stage: 'bg-bg-subtle text-text-secondary border-border',
};

const ICON_STYLES = {
  success: 'text-accent-positive',
  error: 'text-white',
  warning: 'text-yellow-400',
  confidence: 'text-yellow-400',
  info: 'text-text-muted',
  stage: 'text-text-muted',
};

const Toast = () => {
  const toasts = useSimulationStore((s) => s.toasts);
  const removeToast = useSimulationStore((s) => s.removeToast);
  const timersRef = useRef({});

  useEffect(() => {
    const timers = timersRef.current;
    // Set timers for new toasts
    toasts.forEach((t) => {
      if (!timers[t.id]) {
        timers[t.id] = setTimeout(() => {
          removeToast(t.id);
          delete timersRef.current[t.id];
        }, t.duration || 4000);
      }
    });

    // Clean up timers for toasts that were removed
    return () => {
      const currentIds = new Set(toasts.map((t) => t.id));
      Object.keys(timers).forEach((id) => {
        if (!currentIds.has(Number(id))) {
          clearTimeout(timers[id]);
          delete timers[id];
        }
      });
    };
  }, [toasts, removeToast]);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((t) => {
        const type = t.type || 'info';
        const toastClass = TOAST_STYLES[type] || TOAST_STYLES.info;
        const iconClass = ICON_STYLES[type] || ICON_STYLES.info;
        const Icon = ICONS[type] || ICONS.info;
        const isLong = (t.duration || 4000) > 5000;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-xs w-full rounded shadow-lg overflow-hidden border ${toastClass}`}
          >
            <div className="px-4 py-3 flex items-start justify-between gap-3">
              {/* Phase 6: type-aware icon */}
              <Icon size={15} className={`mt-0.5 shrink-0 ${iconClass}`} />
              <div className="flex-1">
                {t.title && <div className="font-semibold mb-1 text-sm">{t.title}</div>}
                <div className="text-sm leading-snug">{t.message}</div>
                {/* Phase 6: confidence warning sub-note */}
                {type === 'confidence' && (
                  <div className="text-[10px] mt-1 opacity-75 tracking-wider">
                    Numbers are grounded in rule-linked computation only.
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="opacity-60 hover:opacity-100 text-sm transition-opacity"
                  aria-label="close toast"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Phase 6: progress micro-bar for long toasts */}
            {isLong && (
              <div
                className="h-0.5 bg-current opacity-20"
                style={{
                  animation: `shrink ${t.duration || 5000}ms linear forwards`,
                }}
              />
            )}
          </div>
        );
      })}

      {/* Keyframe for progress micro-bar */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
