'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/@abstract-ui/components/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/Card';
import { APP_REGISTRY } from '@/lib/app-registry';
import { compileGuidedPolicy } from '@/lib/policy-compiler';
import { BUILT_IN_POLICY_PRESETS } from '@/lib/policy-presets';
import { assessPolicyRisk } from '@/lib/risk-assessment';
import type {
  BuiltInSessionPolicyPresetId,
  PolicyPreview,
  SessionCallPolicy,
  SessionToolName,
  SessionTransferPolicy,
} from '@/lib/policy-types';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import styles from '../styles.module.scss';

type PolicyStage = 'intent' | 'apps';
const STAGES: PolicyStage[] = ['intent', 'apps'];

const STAGE_TITLES: Record<PolicyStage, string> = {
  intent: 'Choose Session Intents',
  apps: 'Additional App Permissions',
};

const INTENT_ORDER: BuiltInSessionPolicyPresetId[] = [
  'payments',
  'trading',
  'contract_write',
  'deploy',
  'signing',
  'full_app_control',
];

const INTENT_DESCRIPTIONS: Record<BuiltInSessionPolicyPresetId, string> = {
  payments: 'Send funds for payouts and transfers.',
  trading: 'Buy, sell, and claim in selected apps.',
  gaming: 'Repeat gameplay actions in supported apps.',
  contract_write: 'Run advanced app actions in selected apps.',
  deploy: 'Create and launch contracts.',
  signing: 'Sign messages and transactions when needed.',
  full_app_control: 'Give broad control in selected apps.',
};

function toUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

function mergeCallPolicies(policies: SessionCallPolicy[]): SessionCallPolicy[] {
  const deduped = new Map<string, SessionCallPolicy>();
  for (const policy of policies) {
    const key = `${policy.target.toLowerCase()}:${(policy.selector ?? '').toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, policy);
    }
  }
  return [...deduped.values()];
}

function mergeTransferPolicies(policies: SessionTransferPolicy[]): SessionTransferPolicy[] {
  const merged = new Map<string, SessionTransferPolicy>();

  for (const policy of policies) {
    const key = policy.target.toLowerCase();
    const current = merged.get(key);
    if (!current) {
      merged.set(key, policy);
      continue;
    }

    const nextMax = BigInt(policy.maxValuePerUse);
    const currentMax = BigInt(current.maxValuePerUse);
    if (nextMax > currentMax) {
      merged.set(key, policy);
    }
  }

  return [...merged.values()];
}

function maxNumericString(values: string[]): string {
  if (values.length === 0) {
    return '0';
  }

  let current = BigInt(values[0]);
  for (const value of values.slice(1)) {
    const parsed = BigInt(value);
    if (parsed > current) {
      current = parsed;
    }
  }

  return current.toString();
}

function buildCombinedPolicyPreview(
  intentIds: BuiltInSessionPolicyPresetId[],
  selectedAppIds: string[],
): PolicyPreview {
  if (intentIds.length === 0) {
    throw new Error('Select at least one intent.');
  }

  const selectedIntents = INTENT_ORDER.filter(intent => intentIds.includes(intent));
  const defaultLimits = selectedIntents.map(intent => BUILT_IN_POLICY_PRESETS[intent].defaultLimits);

  const expiresInSeconds = Math.max(...defaultLimits.map(limits => limits.expiresInSeconds));
  const feeLimit = maxNumericString(defaultLimits.map(limits => limits.feeLimit));
  const maxValuePerUse = maxNumericString(defaultLimits.map(limits => limits.maxValuePerUse));

  const compiled = selectedIntents.map(intent =>
    compileGuidedPolicy({
      presetId: intent,
      expiresInSeconds,
      feeLimit,
      maxValuePerUse,
      selectedAppIds,
      transferTargets: [],
    }),
  );

  const callPolicies = mergeCallPolicies(compiled.flatMap(entry => entry.sessionConfig.callPolicies));
  const transferPolicies = mergeTransferPolicies(compiled.flatMap(entry => entry.sessionConfig.transferPolicies));
  const enabledTools = toUnique(compiled.flatMap(entry => entry.policyMeta.enabledTools));
  const selectedContractAddresses = toUnique(callPolicies.map(policy => policy.target));
  const warnings = toUnique(compiled.flatMap(entry => entry.policyMeta.warnings));
  const unverifiedAppIds = toUnique(compiled.flatMap(entry => entry.policyMeta.unverifiedAppIds));

  const intentLabel = selectedIntents.map(intent => BUILT_IN_POLICY_PRESETS[intent].label).join(' + ');
  const nowUnixSeconds = Math.floor(Date.now() / 1000);

  return {
    presetId: 'custom',
    label: intentLabel,
    description: `Combined intents: ${intentLabel}`,
    policyPayload: {
      expiresAt: nowUnixSeconds + expiresInSeconds,
      sessionConfig: {
        feeLimit,
        maxValuePerUse,
        callPolicies,
        transferPolicies,
      },
      policyMeta: {
        version: 1,
        mode: 'guided',
        presetId: 'custom',
        presetLabel: intentLabel,
        enabledTools: toUnique(enabledTools as SessionToolName[]),
        selectedAppIds: toUnique(selectedAppIds),
        selectedContractAddresses,
        unverifiedAppIds,
        warnings,
        generatedAt: nowUnixSeconds,
      },
    },
  };
}

export default function SelectPolicy() {
  const {
    agwAddress,
    selectedPreset,
    selectedAppIds,
    dangerAcknowledged,
    setPolicyMode,
    setDangerAcknowledged,
    selectPreset,
    toggleAppSelection,
    proceedToCreating,
    setValidationError,
  } = useSessionWizardState();

  const [stage, setStage] = useState<PolicyStage>('intent');
  const [selectedIntentIds, setSelectedIntentIds] = useState<BuiltInSessionPolicyPresetId[]>(() => {
    if (selectedPreset !== 'custom' && selectedPreset !== 'gaming') {
      return [selectedPreset];
    }
    return ['payments'];
  });

  useEffect(() => {
    setPolicyMode('guided');
    if (selectedPreset === 'custom' || selectedPreset === 'gaming') {
      selectPreset('payments');
    }
  }, [selectedPreset, selectPreset, setPolicyMode]);

  const intentSelectionKey = useMemo(() => selectedIntentIds.slice().sort().join(','), [selectedIntentIds]);
  const appSelectionKey = useMemo(() => selectedAppIds.slice().sort().join(','), [selectedAppIds]);

  useEffect(() => {
    setDangerAcknowledged(false);
  }, [intentSelectionKey, appSelectionKey, setDangerAcknowledged]);

  const composite = useMemo(() => {
    try {
      const preview = buildCombinedPolicyPreview(selectedIntentIds, selectedAppIds);
      const risk = assessPolicyRisk(preview);
      return { preview, risk, error: null as string | null };
    } catch (error) {
      return {
        preview: null,
        risk: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [selectedIntentIds, selectedAppIds]);

  const selectedIntentPresets = selectedIntentIds.map(intentId => BUILT_IN_POLICY_PRESETS[intentId]);
  const policyWarnings = composite.preview?.policyPayload.policyMeta?.warnings ?? [];
  const riskReasons = composite.risk?.reasons ?? [];
  const requiresDangerAcknowledgement =
    selectedIntentPresets.some(preset => preset.requiresDangerAcknowledgement) ||
    (composite.risk?.requiresConfirmation ?? false) ||
    policyWarnings.length > 0;

  const displayAddress = agwAddress ? `${agwAddress.slice(0, 6)}...${agwAddress.slice(-4)}` : 'Wallet';
  const currentStageIndex = STAGES.indexOf(stage);
  const canContinue = selectedIntentIds.length > 0;
  const canCreate =
    stage === 'apps' &&
    Boolean(composite.preview) &&
    Boolean(composite.risk) &&
    !composite.error &&
    (!requiresDangerAcknowledgement || dangerAcknowledged);

  const toggleIntentSelection = (intent: BuiltInSessionPolicyPresetId) => {
    setSelectedIntentIds(previous =>
      previous.includes(intent) ? previous.filter(entry => entry !== intent) : [...previous, intent],
    );
  };

  const nextStage = () => {
    if (!canContinue) {
      setValidationError('Select at least one intent to continue.');
      return;
    }
    setStage('apps');
  };

  const handleCreate = () => {
    if (!composite.preview || !composite.risk) {
      setValidationError(composite.error ?? 'Unable to build policy preview.');
      return;
    }
    if (requiresDangerAcknowledgement && !dangerAcknowledged) {
      setValidationError('Confirm the high-risk warnings before creating this session.');
      return;
    }

    proceedToCreating(composite.preview, composite.risk);
  };

  return (
    <div className={styles.wrapper}>
      <Card className={styles.mainCard}>
        <CardHeader className={styles.mainHeader}>
          <div className={styles.identity}>
            <div className={styles.logoWrap}>
              <Image
                src="/assets/images/Abstract_AppIcon_LightMode.svg"
                alt="Abstract AGW icon"
                width={68}
                height={68}
                priority
              />
            </div>
            <h2 className={styles.walletAddress}>{displayAddress}</h2>
            <p className={styles.walletLabel}>AGW Wallet</p>
          </div>
        </CardHeader>
        <CardContent className={styles.mainBody}>
          <div className={styles.stepDots} aria-label="Session setup progress">
            {STAGES.map((item, index) => (
              <span
                key={item}
                className={index <= currentStageIndex ? styles.stepDotActive : styles.stepDot}
              />
            ))}
          </div>
          <p className={styles.sectionTitle}>{STAGE_TITLES[stage]}</p>

          {stage === 'intent' ? (
            <div className={styles.row}>
              <p className={styles.appScopeHint}>
                Pick what you want the AI to help with. You can choose more than one.
              </p>
              <div className={styles.intentList}>
                {INTENT_ORDER.map(intentId => {
                  const preset = BUILT_IN_POLICY_PRESETS[intentId];
                  const checked = selectedIntentIds.includes(intentId);

                  return (
                    <button
                      key={intentId}
                      type="button"
                      className={checked ? styles.intentCardSelected : styles.intentCard}
                      onClick={() => toggleIntentSelection(intentId)}
                      aria-pressed={checked}
                    >
                      <div className={styles.intentCardHeader}>
                        <span className={styles.intentName}>{preset.label}</span>
                        <span className={checked ? styles.appCheckActive : styles.appCheck} aria-hidden="true">
                          {checked ? '✓' : ''}
                        </span>
                      </div>
                      <p className={styles.intentDescription}>{INTENT_DESCRIPTIONS[intentId]}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {stage === 'apps' ? (
            <div className={styles.row}>
              <p className={styles.appScopeHint}>
                Optional: add app-specific permissions. Your selected intents still apply for general wallet actions.
              </p>
              <div className={styles.appList}>
                {APP_REGISTRY.map(app => {
                  const checked = selectedAppIds.includes(app.id);
                  return (
                    <button
                      key={app.id}
                      type="button"
                      className={checked ? styles.appCardSelected : styles.appCard}
                      onClick={() => toggleAppSelection(app.id)}
                      aria-pressed={checked}
                    >
                      <div className={styles.appCardBanner}>
                        {app.bannerUrl ? (
                          <Image
                            src={app.bannerUrl}
                            alt={`${app.name} banner`}
                            fill
                            sizes="(max-width: 420px) 50vw, 120px"
                          />
                        ) : null}
                        <div className={styles.appCardOverlay} />
                        <div className={styles.appCardTopRow}>
                          <span
                            className={checked ? styles.appCheckActive : styles.appCheck}
                            aria-hidden="true"
                          >
                            {checked ? '✓' : ''}
                          </span>
                        </div>
                        <div className={styles.appCardMeta}>
                          <div className={styles.appAvatarWrap}>
                            {app.iconUrl ? (
                              <Image
                                src={app.iconUrl}
                                alt={`${app.name} icon`}
                                width={40}
                                height={40}
                                className={styles.appAvatar}
                              />
                            ) : (
                              <span className={styles.appAvatarFallback}>{app.name.slice(0, 1)}</span>
                            )}
                          </div>
                          <div className={styles.appText}>
                            <p className={styles.appName}>{app.name}</p>
                            <p className={styles.appCategory}>{app.categories.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className={styles.appScopeSubhint}>More options coming soon.</p>
              {composite.risk ? (
                <div className={styles.riskSummary}>
                  <p className={styles.riskHeading}>Risk: {composite.risk.level.toUpperCase()}</p>
                  {riskReasons.length === 0 ? (
                    <p className={styles.riskMuted}>No elevated-risk signals were detected for this selection.</p>
                  ) : (
                    <ul className={styles.riskList}>
                      {riskReasons.map(reason => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                  {policyWarnings.length > 0 ? (
                    <>
                      <p className={styles.warningHeading}>Policy warnings</p>
                      <ul className={styles.warningList}>
                        {policyWarnings.map(warning => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}
              {requiresDangerAcknowledgement ? (
                <label className={styles.dangerAck}>
                  <input
                    type="checkbox"
                    checked={dangerAcknowledged}
                    onChange={event => setDangerAcknowledged(event.target.checked)}
                  />
                  <span>I understand these permissions are high-risk and can move real funds.</span>
                </label>
              ) : null}
            </div>
          ) : null}

          {composite.error ? <p className={styles.error}>{composite.error}</p> : null}
        </CardContent>
        <CardFooter className={styles.mainFooter}>
          <div className={styles.buttonRow}>
            {stage === 'apps' ? (
              <Button className={styles.footerButton} height="40" variant="secondary" onClick={() => setStage('intent')}>
                Back
              </Button>
            ) : null}
            {stage === 'intent' ? (
              <Button className={styles.footerButton} height="40" variant="primary" onClick={nextStage}>
                Next
              </Button>
            ) : null}
            {stage === 'apps' ? (
              <Button
                className={styles.footerButton}
                height="40"
                variant="primary"
                onClick={handleCreate}
                disabled={!canCreate}
              >
                Create Session
              </Button>
            ) : null}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
