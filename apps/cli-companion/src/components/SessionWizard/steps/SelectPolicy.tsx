'use client';

import Image from 'next/image';
import Button from '@/@abstract-ui/components/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/Card';
import { usePolicyPreview } from '@/hooks/usePolicyPreview';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import { POLICY_PRESET_OPTIONS } from '@/lib/policy-presets';
import styles from '../styles.module.scss';

export default function SelectPolicy() {
  const {
    agwAddress,
    selectedPreset,
    customPolicyJson,
    selectPreset,
    updateCustomPolicyJson,
    proceedToCreating,
    setValidationError,
  } = useSessionWizardState();
  const policyState = usePolicyPreview(selectedPreset, customPolicyJson);
  const displayAddress = agwAddress
    ? `${agwAddress.slice(0, 6)}...${agwAddress.slice(-4)}`
    : 'Wallet';

  const handleCreate = () => {
    if (!policyState.preview || !policyState.risk) {
      setValidationError(policyState.error ?? 'Unable to build policy preview.');
      return;
    }

    proceedToCreating(policyState.preview, policyState.risk);
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
          <p className={styles.sectionTitle}>Configure session policy</p>

          <div className={styles.row}>
            <label htmlFor="preset">Preset</label>
            <select
              id="preset"
              className={styles.select}
              value={selectedPreset}
              onChange={event => selectPreset(event.target.value as 'transfer' | 'custom')}
            >
              {POLICY_PRESET_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {selectedPreset === 'custom' ? (
            <div className={styles.row}>
              <label htmlFor="custom-policy">Custom policy JSON</label>
              <textarea
                id="custom-policy"
                className={styles.textarea}
                value={customPolicyJson}
                onChange={event => updateCustomPolicyJson(event.target.value)}
              />
            </div>
          ) : null}

          {policyState.error ? <p className={styles.error}>{policyState.error}</p> : null}
          <CardDescription className={styles.policyDescription}>
            {POLICY_PRESET_OPTIONS.find(option => option.id === selectedPreset)?.description}
          </CardDescription>
        </CardContent>
        <CardFooter className={styles.mainFooter}>
          <Button className={styles.footerButton} height="40" variant="primary" onClick={handleCreate}>
            Create Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
