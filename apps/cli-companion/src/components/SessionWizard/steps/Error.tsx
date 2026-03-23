'use client';

import Button from '@/@abstract-ui/components/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/Card';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import styles from '../styles.module.scss';

export default function ErrorStep() {
  const { error, backToPolicySelection, retryResolution } = useSessionWizardState();
  const isResolutionError = error?.includes('Abstract Global Wallet') || error?.includes('verify AGW');

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>{isResolutionError ? 'Wallet Not Found' : 'Delegation Failed'}</CardTitle>
          <CardDescription>Review the error and try again.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={styles.error}>{error ?? 'Unknown error occurred.'}</p>
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button
            className={styles.footerButton}
            height="40"
            variant="primary"
            onClick={isResolutionError ? retryResolution : backToPolicySelection}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
