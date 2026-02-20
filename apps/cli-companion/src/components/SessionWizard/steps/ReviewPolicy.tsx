'use client';

import { useState } from 'react';
import Button from '@/@abstract-ui/components/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/Card';
import PolicyPreview from '@/components/PolicyPreview';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import styles from '../styles.module.scss';

export default function ReviewPolicy() {
  const { policyPreview, riskAssessment, backToPolicySelection, startCreating } = useSessionWizardState();
  const [confirmedHighRisk, setConfirmedHighRisk] = useState(false);

  if (!policyPreview || !riskAssessment) {
    return (
      <div className={styles.wrapper}>
        <Card>
          <CardContent>
            <p className={styles.error}>Policy preview is missing. Go back and reselect a policy.</p>
          </CardContent>
          <CardFooter className={styles.footer}>
            <Button className={styles.footerButton} height="40" variant="secondary" onClick={backToPolicySelection}>
              Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const requiresConfirmation = riskAssessment.requiresConfirmation;

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>Review Session Policy</CardTitle>
          <CardDescription>Confirm the policy before creating the on-chain session key.</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          <PolicyPreview preview={policyPreview} risk={riskAssessment} />

          {requiresConfirmation ? (
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={confirmedHighRisk}
                onChange={event => setConfirmedHighRisk(event.target.checked)}
              />
              <span>I understand this policy is high risk and want to continue.</span>
            </label>
          ) : null}
        </CardContent>
        <CardFooter className={styles.footer}>
          <div className={styles.buttonRow}>
            <Button className={styles.footerButton} height="40" variant="secondary" onClick={backToPolicySelection}>
              Back
            </Button>
            <Button
              className={styles.footerButton}
              height="40"
              variant="primary"
              disabled={requiresConfirmation && !confirmedHighRisk}
              onClick={startCreating}
            >
              Create Session
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
