import { useState, useRef, useEffect } from 'react';
import Card from '../ui/Card';
import {
  createPolicyFromTemplate,
  getPresetsByType,
  POLICY_TYPES,
  validatePolicyFromRegistry,
} from '../../data/policyRegistry';
import { X, Pencil, Check } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: 'bg-text-primary text-bg-main',
    STAGING: 'bg-bg-subtle text-text-secondary border border-border',
    DRAFT: 'bg-bg-subtle text-text-muted border border-border',
  };
  return (
    <span className={`text-xs font-semibold tracking-widest uppercase px-2.5 py-1 rounded ${map[status] || map.DRAFT}`}>
      {status}
    </span>
  );
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const sliderToValue = (sliderValue, min, max, step = 1) => {
  const raw = min + ((max - min) * (sliderValue / 100));
  const stepped = Math.round(raw / step) * step;
  return Number(stepped.toFixed(4));
};

const valueToSlider = (value, min, max) => {
  if (max === min) return 0;
  return Math.round(((value - min) / (max - min)) * 100);
};

/** Inline-editable policy name displayed as a bold heading */
const InlinePolicyName = ({ name, onChange, hasError }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(name); }, [name]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed.toUpperCase());
    else setDraft(name); // revert if blank
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(name); setEditing(false); } }}
          className={`flex-1 min-w-0 border-b-2 bg-transparent text-lg font-bold tracking-wide text-text-primary uppercase outline-none pb-0.5 ${hasError ? 'border-accent-negative' : 'border-accent-primary'}`}
          style={{ fontFamily: 'inherit' }}
        />
        <button type="button" onClick={commit} className="text-accent-positive flex-shrink-0" aria-label="Confirm name">
          <Check size={15} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`group flex items-center gap-2 text-left flex-1 min-w-0 ${hasError ? 'text-accent-negative' : 'text-text-primary'}`}
      title="Click to rename"
    >
      <h2 className="text-lg font-bold tracking-wide uppercase truncate">{name}</h2>
      <Pencil size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
};

const PolicyBlockCard = ({ policy, onUpdate, onRemove, presetOptions = [] }) => {
  const {
    id,
    module,
    layer,
    policyType = 'tax',
    templateId,
    name,
    status,
    primaryParam = {},
    sliderValue = 0,
    secondaryParams = [],
    tags = [],
  } = policy;

  const direction = primaryParam.direction || 'POSITIVE';
  const primaryMin = Number.isFinite(primaryParam.min) ? primaryParam.min : 0;
  const primaryMax = Number.isFinite(primaryParam.max) ? primaryParam.max : 100;
  const primaryStep = Number.isFinite(primaryParam.step) ? primaryParam.step : 1;
  const typedSlider = clamp(Number(sliderValue) || 0, 0, 100);
  const availablePresets = Array.isArray(presetOptions) && presetOptions.length > 0
    ? presetOptions
    : getPresetsByType(policyType);
  const validation = validatePolicyFromRegistry(policy);
  const errors = validation.errors;

  const isPercentParam = primaryParam.unit === '%';
  const signedIntensityDisplay = `${direction === 'NEGATIVE' ? '-' : '+'}${(typedSlider / 100).toFixed(2)}`;

  const handleTypeChange = (nextType) => {
    if (!onUpdate) return;
    const template = createPolicyFromTemplate({
      moduleNumber: Number(module || '1'),
      type: nextType,
      id,
    });
    onUpdate(template);
  };

  const handlePresetApply = (presetId) => {
    if (!onUpdate || !presetId) return;
    const selectedPreset = availablePresets.find((candidate) => candidate.id === presetId) || null;
    const preset = createPolicyFromTemplate({
      moduleNumber: Number(module || '1'),
      type: selectedPreset?.type || policyType,
      presetId: selectedPreset?.ruleId ? null : presetId,
      ruleTemplate: selectedPreset?.ruleId ? selectedPreset : null,
      id,
    });
    onUpdate(preset);
  };

  const handleDirectionToggle = () => {
    if (!onUpdate) return;
    onUpdate({
      primaryParam: {
        ...primaryParam,
        direction: direction === 'POSITIVE' ? 'NEGATIVE' : 'POSITIVE',
      },
    });
  };

  const handlePrimaryValueChange = (nextValue) => {
    if (!onUpdate) return;
    const numericValue = Number.isFinite(nextValue) ? nextValue : primaryMin;
    const clamped = clamp(numericValue, primaryMin, primaryMax);
    onUpdate({
      sliderValue: valueToSlider(clamped, primaryMin, primaryMax),
      primaryParam: {
        ...primaryParam,
        value: clamped,
      },
    });
  };

  const handleSliderChange = (nextSlider) => {
    if (!onUpdate) return;
    const clampedSlider = clamp(nextSlider, 0, 100);
    onUpdate({
      sliderValue: clampedSlider,
      primaryParam: {
        ...primaryParam,
        value: sliderToValue(clampedSlider, primaryMin, primaryMax, primaryStep),
      },
    });
  };

  const handleSecondaryChange = (index, nextValue) => {
    if (!onUpdate) return;
    const updated = secondaryParams.map((param, paramIndex) => {
      if (paramIndex !== index) return param;

      if (param.inputType === 'number') {
        const parsed = Number(nextValue);
        const safeValue = Number.isFinite(parsed) ? parsed : param.value;
        const bounded = Number.isFinite(param.min) && Number.isFinite(param.max)
          ? clamp(safeValue, param.min, param.max)
          : safeValue;
        return { ...param, value: bounded };
      }

      return { ...param, value: nextValue };
    });

    onUpdate({ secondaryParams: updated });
  };

  return (
    <Card className="mb-4">
      {/* Header: module label + inline-editable name + status + remove */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <p className="label mb-1">MODULE {module} // {layer}</p>
          <div className="flex items-center gap-2 mb-2">
            <InlinePolicyName
              name={name}
              onChange={(next) => onUpdate && onUpdate({ name: next })}
              hasError={!!errors.name}
            />
          </div>
          {errors.name && <p className="text-[11px] text-accent-negative -mt-1 mb-2">{errors.name}</p>}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-bg-subtle text-text-secondary border border-border rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs">
              <span className="label-muted mb-1 block">Policy Type</span>
              <select
                value={policyType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full border border-border rounded bg-bg-card px-2 py-1.5 text-xs text-text-primary"
              >
                {POLICY_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs">
              <span className="label-muted mb-1 block">Preset</span>
              <select
                defaultValue=""
                onChange={(e) => handlePresetApply(e.target.value)}
                className="w-full border border-border rounded bg-bg-card px-2 py-1.5 text-xs text-text-primary"
              >
                <option value="">Custom</option>
                {availablePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs">
              <span className="label-muted mb-1 block">Status</span>
              <select
                value={status}
                onChange={(e) => onUpdate && onUpdate({ status: e.target.value })}
                className="w-full border border-border rounded bg-bg-card px-2 py-1.5 text-xs text-text-primary"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="STAGING">STAGING</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={status} />
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-text-muted hover:text-accent-negative text-xs transition-colors ml-2"
              aria-label="Remove policy"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Artifact metadata row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5 border border-border rounded bg-bg-subtle px-3 py-3 text-[11px]">
        <div>
          <p className="label-muted mb-1">Artifact Ref</p>
          <p className="font-mono text-text-primary truncate">{id}</p>
        </div>
        <div>
          <p className="label-muted mb-1">Shock Type</p>
          <p className="font-mono text-text-primary uppercase">{policyType}</p>
        </div>
        <div>
          <p className="label-muted mb-1">Signed Intensity</p>
          <p className={`font-mono font-bold ${direction === 'NEGATIVE' ? 'text-accent-negative' : 'text-accent-positive'}`}>
            {signedIntensityDisplay}
          </p>
        </div>
        <div>
          <p className="label-muted mb-1">Template</p>
          <p className="font-mono text-text-primary truncate">{templateId || 'custom'}</p>
        </div>
      </div>

      {/* Primary parameter + direction toggle + slider */}
      <div className="mb-6">
        <p className="label mb-2">{primaryParam.label}</p>
        <div className="flex items-center gap-4">
          <div className="min-w-[220px]">
            <div className="flex items-center gap-2 mb-2">
              {/* Direction toggle — only for % params */}
              {isPercentParam && (
                <button
                  type="button"
                  onClick={handleDirectionToggle}
                  className={`flex-shrink-0 border rounded px-2.5 py-1.5 text-[11px] font-bold tracking-wider transition-all ${
                    direction === 'POSITIVE'
                      ? 'bg-accent-positive/10 text-accent-positive border-accent-positive/40 hover:bg-accent-positive/20'
                      : 'bg-accent-negative/10 text-accent-negative border-accent-negative/40 hover:bg-accent-negative/20'
                  }`}
                  title={direction === 'POSITIVE' ? 'Currently: Increase — click for Decrease' : 'Currently: Decrease — click for Increase'}
                >
                  {direction === 'POSITIVE' ? '▲ INC' : '▼ DEC'}
                </button>
              )}
              <input
                type="number"
                min={primaryMin}
                max={primaryMax}
                step={primaryStep}
                value={primaryParam.value}
                onChange={(e) => handlePrimaryValueChange(Number(e.target.value))}
                className={`w-24 border rounded bg-bg-card px-2 py-1 text-sm text-text-primary ${errors.primary ? 'border-accent-negative' : 'border-border'}`}
              />
              <span className="text-sm text-text-secondary">{primaryParam.unit}</span>
            </div>
            <p className="label-muted">Range {primaryMin} – {primaryMax}</p>
            {errors.primary && <p className="text-[11px] text-accent-negative mt-1">{errors.primary}</p>}
          </div>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={100}
              value={typedSlider}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-0.5 bg-border rounded appearance-none cursor-pointer accent-text-primary"
            />
          </div>
        </div>
      </div>

      {/* Secondary params row */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        {secondaryParams.map((param, index) => (
          <div key={param.key || param.label}>
            <p className="label mb-1">{param.label}</p>

            {param.inputType === 'multiselect' ? (
              <div className="flex flex-wrap gap-2">
                {(param.options || []).map((option) => {
                  const selected = Array.isArray(param.value) ? param.value.includes(option) : false;
                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${selected ? 'bg-accent-primary/15 border-accent-primary text-text-primary' : 'bg-bg-card border-border text-text-muted hover:text-text-secondary'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const current = Array.isArray(param.value) ? param.value : [];
                          const next = selected
                            ? current.filter((v) => v !== option)
                            : [...current, option];
                          handleSecondaryChange(index, next.length > 0 ? next : param.options);
                        }}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${selected ? 'bg-accent-primary border-accent-primary' : 'border-border'}`}>
                        {selected && <span className="text-[8px] text-white">✓</span>}
                      </span>
                      {option}
                    </label>
                  );
                })}
              </div>
            ) : param.inputType === 'select' ? (
              <select
                value={param.value}
                onChange={(e) => handleSecondaryChange(index, e.target.value)}
                className="w-full border border-border rounded bg-bg-card px-2 py-1 text-sm text-text-primary"
              >
                {(param.options || []).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : param.inputType === 'number' ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={param.min}
                  max={param.max}
                  step={param.step || 1}
                  value={param.value}
                  onChange={(e) => handleSecondaryChange(index, e.target.value)}
                  className={`w-full border rounded bg-bg-card px-2 py-1 text-sm text-text-primary ${errors.secondary[param.key] ? 'border-accent-negative' : 'border-border'}`}
                />
                {param.unit && <span className="text-xs text-text-muted whitespace-nowrap">{param.unit}</span>}
              </div>
            ) : (
              <input
                value={param.value}
                onChange={(e) => handleSecondaryChange(index, e.target.value)}
                className="w-full border border-border rounded bg-bg-card px-2 py-1 text-sm text-text-primary"
              />
            )}

            {errors.secondary[param.key] && (
              <p className="text-[11px] text-accent-negative mt-1">{errors.secondary[param.key]}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PolicyBlockCard;
