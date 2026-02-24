'use client';

import { useEffect, useRef } from 'react';
import type { Chain } from 'viem/chains';
import Button from '@/@abstract-ui/components/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/Card';
import { useCreateSession } from '@/hooks/useCreateSession';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import { buildRedirectUrl } from '@/lib/redirect';
import styles from '../styles.module.scss';

export default function Creating({
  callbackUrl,
  chain,
}: {
  callbackUrl: string;
  chain: Chain;
}) {
  const hasStartedRef = useRef(false);
  const {
    agwAddress,
    markCreationError,
    markCreationSuccess,
  } = useSessionWizardState();
  const { createSession, isPending } = useCreateSession();

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const run = async () => {
      try {
        if (!agwAddress) {
          throw new Error('Wallet is not connected.');
        }
        const accountAddress = agwAddress as `0x${string}`;

        const bundle = await createSession({
          accountAddress,
          chainId: chain.id,
        });

        const redirectUrl = buildRedirectUrl(callbackUrl, bundle);
        markCreationSuccess({
          redirectUrl,
        });
      } catch (error) {
        markCreationError(error instanceof Error ? error.message : String(error));
      }
    };

    void run();
  }, [
    agwAddress,
    createSession,
    callbackUrl,
    chain.id,
    markCreationError,
    markCreationSuccess,
  ]);

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>Linking Wallet</CardTitle>
          <CardDescription>Preparing wallet context for your local MCP server.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={styles.helper}>
            {isPending
              ? 'Finalizing wallet link...'
              : 'Building local callback payload...'}
          </p>
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button className={styles.footerButton} height="40" variant="secondary" disabled>
            In Progress
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
