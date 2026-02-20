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

export default function NotLoggedIn() {
  const { login } = useSessionWizardState();

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader gradient />
        <CardContent className={styles.content}>
          <CardTitle>Create AGW Session Key</CardTitle>
          <CardDescription>
            Connect with Abstract Global Wallet to configure and create a scoped session key.
          </CardDescription>
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button className={styles.footerButton} height="40" variant="primary" onClick={login}>
            Connect with Abstract
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
