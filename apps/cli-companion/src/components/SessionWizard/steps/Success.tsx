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

export default function Success() {
  const { redirectUrl, transactionHash } = useSessionWizardState();

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>Session Created</CardTitle>
          <CardDescription>Redirecting back to the CLI callback...</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          {transactionHash ? <p className={styles.success}>Transaction: {transactionHash}</p> : null}
          {redirectUrl ? (
            <p className={styles.helper}>
              If redirect does not happen automatically, use the link below.
            </p>
          ) : null}
        </CardContent>
        <CardFooter className={styles.footer}>
          {redirectUrl ? (
            <Button className={styles.footerButton} height="40" variant="primary" href={redirectUrl}>
              Return to CLI
            </Button>
          ) : (
            <Button className={styles.footerButton} height="40" variant="secondary" disabled>
              Redirecting...
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
