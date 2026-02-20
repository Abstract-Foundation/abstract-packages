'use client';

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
    proceedToReview,
    setValidationError,
  } = useSessionWizardState();
  const policyState = usePolicyPreview(selectedPreset, customPolicyJson);

  const handleReview = () => {
    if (!policyState.preview || !policyState.risk) {
      setValidationError(policyState.error ?? 'Unable to build policy preview.');
      return;
    }

    proceedToReview(policyState.preview, policyState.risk);
  };

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <h2 className={styles.title}>Configure Session Policy</h2>
          <p className={styles.description}>Connected account: {agwAddress}</p>
        </CardHeader>
        <CardContent className={styles.content}>
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
          <CardDescription>
            {POLICY_PRESET_OPTIONS.find(option => option.id === selectedPreset)?.description}
          </CardDescription>
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button className={styles.footerButton} height="40" variant="primary" onClick={handleReview}>
            Review Policy
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
