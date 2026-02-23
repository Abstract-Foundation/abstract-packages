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
          <CardDescription>Return to your CLI callback to finish setup.</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          {transactionHash ? <p className={styles.success}>Transaction: {transactionHash}</p> : null}
          {redirectUrl ? (
            <p className={styles.helper}>
              Open the link below to hand off your new session to the CLI.
            </p>
          ) : null}
          {redirectUrl ? (
            <p className={styles.helper}>
              If you see <code>ERR_CONNECTION_REFUSED</code>, re-run <code>agw-mcp init</code> and keep that terminal open.
            </p>
          ) : null}
          <p className={styles.helper}>
            After returning to CLI, run <code>get_session_status</code> to confirm and <code>revoke_session</code> when done.
          </p>
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
