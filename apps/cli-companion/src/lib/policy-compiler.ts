import { APP_REGISTRY, getRegistryAppById, type AppRegistryEntry } from './app-registry';
import {
  BUILT_IN_POLICY_PRESETS,
  CUSTOM_PRESET,
  ALL_SESSION_TOOLS,
} from './policy-presets';
import type {
  BuiltInSessionPolicyPresetId,
  GuidedSessionPolicyDraft,
  PolicyPreview,
  SessionCallPolicy,
  SessionPolicyConfig,
  SessionPolicyMeta,
  SessionPolicyPresetId,
  SessionTransferPolicy,
  SessionToolName,
} from './policy-types';

interface CompileGuidedPolicyResult {
  presetId: SessionPolicyPresetId;
  label: string;
  description: string;
  expiresInSeconds: number;
  sessionConfig: SessionPolicyConfig;
  policyMeta: SessionPolicyMeta;
}

function dedupeCalls(calls: SessionCallPolicy[]): SessionCallPolicy[] {
  const deduped = new Map<string, SessionCallPolicy>();
  for (const call of calls) {
    const key = `${call.target.toLowerCase()}:${(call.selector ?? '').toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, call);
    }
  }
  return Array.from(deduped.values());
}

function dedupeTransfers(transfers: SessionTransferPolicy[]): SessionTransferPolicy[] {
  const deduped = new Map<string, SessionTransferPolicy>();
  for (const transfer of transfers) {
    const key = transfer.target.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, transfer);
    }
  }
  return Array.from(deduped.values());
}

function resolveApps(appIds: string[]): AppRegistryEntry[] {
  const deduped = new Set<string>();
  const selected: AppRegistryEntry[] = [];

  for (const appId of appIds) {
    const normalized = appId.trim();
    if (!normalized || deduped.has(normalized)) {
      continue;
    }

    const app = getRegistryAppById(normalized);
    if (!app) {
      continue;
    }

    deduped.add(normalized);
    selected.push(app);
  }

  return selected;
}

function buildCallPolicies(
  presetId: BuiltInSessionPolicyPresetId,
  selectedApps: AppRegistryEntry[],
  warnings: string[],
): SessionCallPolicy[] {
  if (presetId === 'payments') {
    return [];
  }

  const calls: SessionCallPolicy[] = [];

  for (const app of selectedApps) {
    if (!app.verified) {
      warnings.push(
        `${app.name} uses candidate-only mappings. Review and confirm selectors in Advanced mode before production use.`,
      );
    }

    for (const contract of app.contracts) {
      const defaultSelectors = contract.selectors.filter(selector => selector.enabledByDefault);
      if (defaultSelectors.length === 0) {
        warnings.push(
          `${app.name} / ${contract.label} has no mainnet-approved selectors. Skipped from call policies.`,
        );
        continue;
      }

      for (const selector of defaultSelectors) {
        calls.push({
          target: contract.address,
          selector: selector.selector,
        });
      }
    }
  }

  return dedupeCalls(calls);
}

function buildTransferPolicies(draft: GuidedSessionPolicyDraft): SessionTransferPolicy[] {
  const transfers: SessionTransferPolicy[] = [];

  if (draft.presetId === 'payments') {
    for (const transferTarget of draft.transferTargets) {
      transfers.push({
        target: transferTarget,
        maxValuePerUse: draft.maxValuePerUse,
      });
    }
  }

  return dedupeTransfers(transfers);
}

function buildWarnings(
  draft: GuidedSessionPolicyDraft,
  selectedApps: AppRegistryEntry[],
  callPolicies: SessionCallPolicy[],
): string[] {
  const warnings: string[] = [];

  if (draft.presetId !== 'payments' && selectedApps.length === 0) {
    warnings.push('No apps selected. This preset will not allow app-scoped contract calls.');
  }

  if (draft.presetId === 'payments' && draft.transferTargets.length === 0) {
    warnings.push('No recipient allowlist configured. Add recipients in the payments step.');
  }

  if (callPolicies.some(policy => !policy.selector) && draft.presetId !== 'full_app_control') {
    warnings.push('One or more contracts are approved without selector scoping.');
  }

  return warnings;
}

function inferEnabledTools(
  presetId: BuiltInSessionPolicyPresetId,
  selectedApps: AppRegistryEntry[],
): SessionToolName[] {
  const preset = BUILT_IN_POLICY_PRESETS[presetId];
  const tools = [...preset.enabledTools];

  if (selectedApps.length === 0 && presetId !== 'payments' && presetId !== 'signing') {
    return dedupeArray(
      tools.filter(
        tool =>
          tool !== 'swap_tokens' &&
          tool !== 'send_transaction' &&
          tool !== 'send_calls' &&
          tool !== 'write_contract' &&
          tool !== 'deploy_contract',
      ),
    );
  }

  return dedupeArray(tools);
}

function dedupeArray<T extends string>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function buildPolicyMeta(
  draft: GuidedSessionPolicyDraft,
  selectedApps: AppRegistryEntry[],
  callPolicies: SessionCallPolicy[],
  warnings: string[],
): SessionPolicyMeta {
  const preset = BUILT_IN_POLICY_PRESETS[draft.presetId];
  return {
    version: 1,
    mode: 'guided',
    presetId: preset.id,
    presetLabel: preset.label,
    enabledTools: inferEnabledTools(draft.presetId, selectedApps),
    selectedAppIds: selectedApps.map(app => app.id),
    selectedContractAddresses: dedupeArray(callPolicies.map(policy => policy.target)),
    unverifiedAppIds: selectedApps.filter(app => !app.verified).map(app => app.id),
    warnings,
    generatedAt: Math.floor(Date.now() / 1000),
  };
}

export function compileGuidedPolicy(draft: GuidedSessionPolicyDraft): CompileGuidedPolicyResult {
  const preset = BUILT_IN_POLICY_PRESETS[draft.presetId];
  if (!preset) {
    throw new Error(`Unknown preset id: ${draft.presetId}`);
  }

  const selectedApps = resolveApps(draft.selectedAppIds);
  const warnings: string[] = [];
  const callPolicies = buildCallPolicies(draft.presetId, selectedApps, warnings);
  const transferPolicies = buildTransferPolicies(draft);
  warnings.push(...buildWarnings(draft, selectedApps, callPolicies));

  const sessionConfig: SessionPolicyConfig = {
    feeLimit: draft.feeLimit,
    maxValuePerUse: draft.maxValuePerUse,
    callPolicies,
    transferPolicies,
  };

  const policyMeta = buildPolicyMeta(draft, selectedApps, callPolicies, warnings);

  return {
    presetId: preset.id,
    label: preset.label,
    description: preset.description,
    expiresInSeconds: draft.expiresInSeconds,
    sessionConfig,
    policyMeta,
  };
}

export function buildGuidedTemplateJson(draft: GuidedSessionPolicyDraft): string {
  const compiled = compileGuidedPolicy(draft);
  return JSON.stringify(
    {
      expiresInSeconds: compiled.expiresInSeconds,
      sessionConfig: compiled.sessionConfig,
      policyMeta: {
        ...compiled.policyMeta,
        mode: 'advanced',
      },
    },
    null,
    2,
  );
}

export function buildDefaultCustomTemplateJson(): string {
  return JSON.stringify(
    {
      expiresInSeconds: 3600,
      sessionConfig: {
        feeLimit: '2000000000000000',
        maxValuePerUse: '10000000000000000',
        callPolicies: [],
        transferPolicies: [],
      },
      policyMeta: {
        version: 1,
        mode: 'advanced',
        presetId: CUSTOM_PRESET.id,
        presetLabel: CUSTOM_PRESET.label,
        enabledTools: ALL_SESSION_TOOLS,
        selectedAppIds: [],
        selectedContractAddresses: [],
        unverifiedAppIds: [],
        warnings: [],
        generatedAt: Math.floor(Date.now() / 1000),
      },
    },
    null,
    2,
  );
}

export function toPolicyPreview(
  compiled: CompileGuidedPolicyResult,
  nowUnixSeconds: number,
): PolicyPreview {
  return {
    presetId: compiled.presetId,
    label: compiled.label,
    description: compiled.description,
    policyPayload: {
      expiresAt: nowUnixSeconds + compiled.expiresInSeconds,
      sessionConfig: compiled.sessionConfig,
      policyMeta: compiled.policyMeta,
    },
  };
}

export function listRegistryAppsForUi() {
  return APP_REGISTRY;
}
