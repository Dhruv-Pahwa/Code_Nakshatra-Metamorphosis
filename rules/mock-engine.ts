import carbonTaxRule from '../rules/carbon_tax_india_v1.json';
import carbonTransferRule from '../rules/carbon_plus_transfer_v1.json';

export interface PolicyRule {
  policy_id: string;
  macro_effects: Record<string, any>;
  distribution_effects: Record<string, any>;
  causal_chain: Array<Record<string, string>>;
  policylab_suggestions: Array<Record<string, string>>;
  provenance: Record<string, any>;
}

const RULES: Record<string, PolicyRule> = {
  carbon_tax_india_v1: carbonTaxRule as PolicyRule,
  carbon_plus_transfer_v1: carbonTransferRule as PolicyRule,
};

export function runMockEngine(policyId: string): PolicyRule | null {
  // For hackathon: exact match. Later: compose additive rules or call CGE solver.
  return RULES[policyId] || null;
}

export function formatForUI(rule: PolicyRule) {
  return {
    macro: rule.macro_effects,
    distribution: rule.distribution_effects,
    causalChain: rule.causal_chain,
    suggestions: rule.policylab_suggestions,
    metadata: rule.provenance,
    confidence: rule.provenance.confidence_note,
  };
}