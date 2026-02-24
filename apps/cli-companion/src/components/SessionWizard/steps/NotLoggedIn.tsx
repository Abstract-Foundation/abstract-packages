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
          <CardTitle>AGW MCP Onboarding</CardTitle>
          <CardDescription>
            Connect your Abstract Global Wallet to link local MCP access for this device.
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
