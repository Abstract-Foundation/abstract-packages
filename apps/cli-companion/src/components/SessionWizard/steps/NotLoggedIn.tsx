'use client';

import Button from '@/@abstract-ui/components/Button';
import AbstractBadge from '@/components/AbstractBadge';
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

export default function NotLoggedIn() {
  const { login, isLoginPending } = useSessionWizardState();

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader gradient>
          <div className={styles.badge}>
            <AbstractBadge />
          </div>
        </CardHeader>
        <CardContent className={styles.loginContent}>
          <CardTitle>AGW MCP Server Onboarding</CardTitle>
          <CardDescription>
            Connect your Abstract Global Wallet to finish AGW MCP Server setup for local tools.
            After login, you will choose a scoped session policy and create a session for secure
            automated actions. This flow only configures MCP access for this machine.
          </CardDescription>
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button
            className={styles.footerButton}
            height="40"
            variant="primary"
            disabled={isLoginPending}
            onClick={login}
          >
            {isLoginPending ? 'Connecting wallet...' : 'Login with AGW'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
