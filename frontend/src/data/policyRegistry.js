const AVAILABLE_SECTORS = [
  'Industrial Production',
  'Services Output',
  'Agriculture',
  'Energy & Mining',
  'Infrastructure & Construction',
];

const POLICY_REGISTRY = {
  tax: {
    id: 'tax',
    label: 'Tax / Cess',
    layer: 'FISCAL LAYER',
    defaultName: 'PRODUCTION TAX',
    primaryParam: {
      label: 'TAX INTENSITY',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 30,
    },
    secondaryParams: [
      { key: 'sectorTargets', label: 'TARGET SECTORS', inputType: 'multiselect', options: AVAILABLE_SECTORS, defaultValue: AVAILABLE_SECTORS },
      { key: 'threshold', label: 'THRESHOLD', inputType: 'number', unit: '₹ Cr', min: 0.1, max: 20, step: 0.1, defaultValue: 1.5 },
      { key: 'smoothing', label: 'SMOOTHING', inputType: 'select', options: ['LINEAR', 'EXPONENTIAL', 'STEPWISE'], defaultValue: 'LINEAR' },
    ],
  },
  subsidy: {
    id: 'subsidy',
    label: 'Subsidy / Scheme',
    layer: 'SUPPORT LAYER',
    defaultName: 'PM-KUSUM / UJJWALA SUPPORT',
    primaryParam: {
      label: 'SUBSIDY INTENSITY',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 35,
    },
    secondaryParams: [
      { key: 'sectorTargets', label: 'TARGET SECTORS', inputType: 'multiselect', options: AVAILABLE_SECTORS, defaultValue: AVAILABLE_SECTORS },
      { key: 'eligibilityFloor', label: 'ELIGIBILITY FLOOR', inputType: 'number', unit: '₹ / month', min: 2000, max: 50000, step: 500, defaultValue: 12000 },
      { key: 'coverage', label: 'COVERAGE', inputType: 'select', options: ['RURAL', 'URBAN', 'UNIVERSAL'], defaultValue: 'RURAL' },
    ],
  },
  transfer: {
    id: 'transfer',
    label: 'Direct Transfer',
    layer: 'REDISTRIBUTION LAYER',
    defaultName: 'PM-KISAN / DBT EXPANSION',
    primaryParam: {
      label: 'TRANSFER INTENSITY',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 40,
    },
    secondaryParams: [
      { key: 'householdTargets', label: 'TARGET HOUSEHOLDS', inputType: 'multiselect', options: ['lower', 'middle', 'upper'], defaultValue: ['lower'] },
      { key: 'capFloor', label: 'CAP FLOOR', inputType: 'number', unit: '₹', min: 5000, max: 100000, step: 500, defaultValue: 18000 },
      { key: 'allocation', label: 'ALLOCATION', inputType: 'select', options: ['AUTOMATED', 'MANUAL', 'HYBRID'], defaultValue: 'AUTOMATED' },
    ],
  },
  labor_supply: {
    id: 'labor_supply',
    label: 'Labor Supply',
    layer: 'FACTOR SUPPLY LAYER',
    defaultName: 'LABOR FORCE EXPANSION',
    primaryParam: {
      label: 'LABOR SUPPLY CHANGE',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 25,
    },
    secondaryParams: [
      { key: 'skillMix', label: 'SKILL COMPOSITION', inputType: 'select', options: ['BALANCED', 'UNSKILLED-HEAVY', 'SKILLED-HEAVY'], defaultValue: 'BALANCED' },
      { key: 'migrationSource', label: 'SOURCE', inputType: 'select', options: ['DOMESTIC', 'INTERNATIONAL', 'MIXED'], defaultValue: 'DOMESTIC' },
    ],
  },
  capital_supply: {
    id: 'capital_supply',
    label: 'Capital Supply',
    layer: 'FACTOR SUPPLY LAYER',
    defaultName: 'CAPITAL STOCK CHANGE',
    primaryParam: {
      label: 'CAPITAL SUPPLY CHANGE',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 20,
    },
    secondaryParams: [
      { key: 'investmentType', label: 'INVESTMENT TYPE', inputType: 'select', options: ['FDI', 'DOMESTIC', 'PUBLIC'], defaultValue: 'DOMESTIC' },
      { key: 'maturityPeriod', label: 'MATURITY', inputType: 'select', options: ['SHORT-TERM', 'MEDIUM-TERM', 'LONG-TERM'], defaultValue: 'MEDIUM-TERM' },
    ],
  },
  productivity: {
    id: 'productivity',
    label: 'Productivity Shock',
    layer: 'TECHNOLOGY LAYER',
    defaultName: 'TFP SHIFT',
    primaryParam: {
      label: 'PRODUCTIVITY CHANGE',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 30,
    },
    secondaryParams: [
      { key: 'sectorTargets', label: 'TARGET SECTORS', inputType: 'multiselect', options: AVAILABLE_SECTORS, defaultValue: AVAILABLE_SECTORS },
      { key: 'techDriver', label: 'TECHNOLOGY DRIVER', inputType: 'select', options: ['AUTOMATION', 'DIGITIZATION', 'GREEN TECH', 'R&D'], defaultValue: 'DIGITIZATION' },
    ],
  },
};

export const POLICY_TYPES = Object.values(POLICY_REGISTRY).map((type) => ({
  id: type.id,
  label: type.label,
}));

export const POLICY_PRESETS = [
  {
    id: 'tax-growth',
    type: 'tax',
    label: 'Make in India Tax Mix',
    description: 'Lower effective rate with smooth phaseout for private investment.',
    overrides: {
      name: 'MAKE IN INDIA TAX MIX',
      status: 'ACTIVE',
      primaryValue: 19.5,
      secondaryValues: {
        threshold: 2.2,
        decayRate: 0.02,
        smoothing: 'EXPONENTIAL',
      },
      tags: ['GROWTH-ORIENTED', 'REVENUE NEUTRAL'],
    },
  },
  {
    id: 'subsidy-energy',
    type: 'subsidy',
    label: 'Ujjwala Expansion',
    description: 'Focused subsidy for lower-income rural households.',
    overrides: {
      name: 'UJJWALA EXPANSION RELIEF',
      status: 'ACTIVE',
      primaryValue: 48,
      secondaryValues: {
        eligibilityFloor: 14000,
        phaseoutRate: 6,
        coverage: 'RURAL',
      },
      tags: ['REDISTRIBUTIVE', 'CONSUMPTION PUSH'],
    },
  },
  {
    id: 'transfer-equity',
    type: 'transfer',
    label: 'PM-KISAN Plus',
    description: 'Enhanced DBT transfer model with broad redistribution targeting.',
    overrides: {
      name: 'PM-KISAN ENHANCED CORRIDOR',
      status: 'STAGING',
      primaryValue: 0.95,
      secondaryValues: {
        capFloor: 22000,
        auditCycle: 'MONTHLY',
        allocation: 'HYBRID',
      },
      tags: ['EQUITY-FOCUSED', 'LABOR-SHIFTING'],
    },
  },
];

const DEFAULT_STATUS = 'STAGING';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseNumber = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    // Keep the minus sign so negative values survive round-trips
    const parsed = Number(value.replace(/[^\d.+-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const valueToSlider = (value, min, max) => {
  if (max === min) return 0;
  return Math.round(((value - min) / (max - min)) * 100);
};

const sliderToValue = (sliderValue, min, max, step = 1) => {
  const raw = min + ((max - min) * (sliderValue / 100));
  const stepped = Math.round(raw / step) * step;
  return Number(stepped.toFixed(4));
};

const inferPolicyType = (policy = {}) => {
  if (policy.policyType && POLICY_REGISTRY[policy.policyType]) {
    return policy.policyType;
  }

  const haystack = `${policy.layer || ''} ${policy.name || ''}`.toUpperCase();
  if (haystack.includes('REDISTRIBUTION') || haystack.includes('TRANSFER')) return 'transfer';
  if (haystack.includes('SUBSIDY') || haystack.includes('SUPPORT')) return 'subsidy';
  return 'tax';
};

const buildSecondaryParams = (typeDef, secondaryOverrides = {}) =>
  typeDef.secondaryParams.map((param) => ({
    key: param.key,
    label: param.label,
    inputType: param.inputType,
    options: param.options || [],
    unit: param.unit || '',
    min: param.min,
    max: param.max,
    step: param.step,
    value: Object.prototype.hasOwnProperty.call(secondaryOverrides, param.key)
      ? secondaryOverrides[param.key]
      : param.defaultValue,
  }));

export const createPolicyFromTemplate = ({
  moduleNumber,
  type = 'tax',
  presetId = null,
  ruleTemplate = null,
  id = null,
} = {}) => {
  const templateType = ruleTemplate?.type || type;
  const typeDef = POLICY_REGISTRY[templateType] || POLICY_REGISTRY.tax;
  const preset = presetId ? POLICY_PRESETS.find((candidate) => candidate.id === presetId) : null;
  const ruleTemplateOverrides = ruleTemplate?.overrides && typeof ruleTemplate.overrides === 'object'
    ? ruleTemplate.overrides
    : {};
  const overrides = {
    ...(preset?.overrides || {}),
    ...ruleTemplateOverrides,
  };
  const templateTags = Array.isArray(ruleTemplate?.tags) ? ruleTemplate.tags : [];
  const ruleTemplateId = ruleTemplate?.id || preset?.id || null;
  const ruleId = ruleTemplate?.ruleId || ruleTemplate?.id || null;
  const ruleVersion = ruleTemplate?.ruleVersion || null;

  const primaryRaw = parseNumber(overrides.primaryValue, typeDef.primaryParam.defaultValue);
  const primaryValue = clamp(primaryRaw, typeDef.primaryParam.min, typeDef.primaryParam.max);

  return {
    id: id || `pol-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    module: String(moduleNumber || 1).padStart(2, '0'),
    layer: typeDef.layer,
    policyType: typeDef.id,
    templateId: ruleTemplateId,
    ruleTemplateId,
    ruleId,
    ruleVersion,
    name: overrides.name || (ruleTemplate?.label ? String(ruleTemplate.label).toUpperCase() : typeDef.defaultName),
    status: overrides.status || DEFAULT_STATUS,
    sliderValue: valueToSlider(primaryValue, typeDef.primaryParam.min, typeDef.primaryParam.max),
    primaryParam: {
      label: typeDef.primaryParam.label,
      value: primaryValue,
      unit: typeDef.primaryParam.unit,
      min: typeDef.primaryParam.min,
      max: typeDef.primaryParam.max,
      step: typeDef.primaryParam.step,
      direction: overrides.direction || 'POSITIVE',
    },
    secondaryParams: buildSecondaryParams(typeDef, overrides.secondaryValues || {}),
    tags: overrides.tags || templateTags,
  };
};

export const normalizePolicyFromRegistry = (policy = {}, index = 0) => {
  const type = inferPolicyType(policy);
  const typeDef = POLICY_REGISTRY[type] || POLICY_REGISTRY.tax;
  const template = createPolicyFromTemplate({
    moduleNumber: index + 1,
    type,
    id: policy.id || `pol-${Date.now()}-${index}`,
  });

  const min = typeDef.primaryParam.min;
  const max = typeDef.primaryParam.max;
  const step = typeDef.primaryParam.step;

  const incomingPrimary = parseNumber(policy.primaryParam?.value, template.primaryParam.value);
  const incomingSlider = parseNumber(policy.sliderValue, null);
  const primaryValue = clamp(incomingPrimary, min, max);
  const sliderValue = incomingSlider == null
    ? valueToSlider(primaryValue, min, max)
    : clamp(incomingSlider, 0, 100);

  const legacySecondary = Array.isArray(policy.secondaryParams) ? policy.secondaryParams : [];

  const secondaryParams = template.secondaryParams.map((param, idx) => {
    const byKey = legacySecondary.find((candidate) => candidate.key === param.key);
    const byLabel = legacySecondary.find((candidate) => candidate.label === param.label);
    const byIndex = legacySecondary[idx];
    const candidate = byKey || byLabel || byIndex;

    if (!candidate) return param;

    return {
      ...param,
      value: candidate.value ?? param.value,
    };
  });

  return {
    ...template,
    module: policy.module || template.module,
    layer: policy.layer || template.layer,
    policyType: policy.policyType || template.policyType,
    templateId: policy.templateId || template.templateId,
    ruleTemplateId: policy.ruleTemplateId || template.ruleTemplateId || null,
    ruleId: policy.ruleId || template.ruleId || null,
    ruleVersion: policy.ruleVersion || template.ruleVersion || null,
    name: policy.name || template.name,
    status: policy.status || template.status,
    sliderValue,
    primaryParam: {
      ...template.primaryParam,
      ...policy.primaryParam,
      value: Number(sliderToValue(sliderValue, min, max, step).toFixed(4)),
      // Preserve direction — fall back to POSITIVE if not set
      direction: policy.primaryParam?.direction || template.primaryParam?.direction || 'POSITIVE',
    },
    secondaryParams,
    tags: policy.tags || template.tags || [],
  };
};

export const syncPolicyPrimaryWithSlider = (policy) => {
  const type = inferPolicyType(policy);
  const typeDef = POLICY_REGISTRY[type] || POLICY_REGISTRY.tax;
  const min = typeDef.primaryParam.min;
  const max = typeDef.primaryParam.max;
  const step = typeDef.primaryParam.step;
  const sliderValue = clamp(parseNumber(policy.sliderValue, 0), 0, 100);

  return {
    ...policy,
    sliderValue,
    primaryParam: {
      ...(policy.primaryParam || {}),
      label: policy.primaryParam?.label || typeDef.primaryParam.label,
      unit: policy.primaryParam?.unit ?? typeDef.primaryParam.unit,
      min,
      max,
      step,
      value: sliderToValue(sliderValue, min, max, step),
      // Preserve direction through sync — do not reset it
      direction: policy.primaryParam?.direction || 'POSITIVE',
    },
  };
};

export const getPresetsByType = (type) => POLICY_PRESETS.filter((preset) => preset.type === type);

export const getPolicyTypeDefinition = (type = 'tax') => POLICY_REGISTRY[type] || POLICY_REGISTRY.tax;

export const validatePolicyFromRegistry = (policy = {}) => {
  const type = inferPolicyType(policy);
  const typeDef = getPolicyTypeDefinition(type);

  const errors = {
    name: null,
    primary: null,
    secondary: {},
  };

  if (!String(policy.name || '').trim()) {
    errors.name = 'Policy name is required.';
  }

  const primaryValue = parseNumber(policy.primaryParam?.value, NaN);
  if (!Number.isFinite(primaryValue)) {
    errors.primary = `${typeDef.primaryParam.label} must be a valid number.`;
  } else if (primaryValue < typeDef.primaryParam.min || primaryValue > typeDef.primaryParam.max) {
    errors.primary = `${typeDef.primaryParam.label} must be between ${typeDef.primaryParam.min} and ${typeDef.primaryParam.max}.`;
  }

  const secondaryParams = Array.isArray(policy.secondaryParams) ? policy.secondaryParams : [];
  secondaryParams.forEach((param) => {
    if (!param || !param.key) return;

    if (param.inputType === 'number') {
      const numValue = parseNumber(param.value, NaN);
      if (!Number.isFinite(numValue)) {
        errors.secondary[param.key] = `${param.label} must be numeric.`;
        return;
      }

      if (Number.isFinite(param.min) && numValue < param.min) {
        errors.secondary[param.key] = `${param.label} cannot be below ${param.min}.`;
        return;
      }

      if (Number.isFinite(param.max) && numValue > param.max) {
        errors.secondary[param.key] = `${param.label} cannot exceed ${param.max}.`;
        return;
      }
    }

    if (param.inputType === 'select' && Array.isArray(param.options) && param.options.length > 0) {
      if (!param.options.includes(param.value)) {
        errors.secondary[param.key] = `${param.label} must be one of the available options.`;
      }
    }
  });

  const hasSecondaryErrors = Object.values(errors.secondary).some(Boolean);

  return {
    valid: !errors.name && !errors.primary && !hasSecondaryErrors,
    errors,
  };
};

export default POLICY_REGISTRY;
