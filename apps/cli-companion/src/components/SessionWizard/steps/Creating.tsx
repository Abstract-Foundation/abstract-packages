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
import { serializeSessionConfig } from '@/lib/session-config';
import styles from '../styles.module.scss';

export default function Creating({
  callbackUrl,
  signerAddress,
  chain,
}: {
  callbackUrl: string;
  signerAddress: `0x${string}`;
  chain: Chain;
}) {
  const hasStartedRef = useRef(false);
  const {
    agwAddress,
    policyPreview,
    markCreationError,
    markCreationSuccess,
  } = useSessionWizardState();
  const { createSession, isPending, isClientReady, isClientLoading } = useCreateSession(chain);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    if (!isClientReady) {
      return;
    }

    hasStartedRef.current = true;

    const run = async () => {
      try {
        if (!agwAddress) {
          throw new Error('Wallet is not connected.');
        }
        if (!policyPreview) {
          throw new Error('Policy preview is missing.');
        }
        const accountAddress = agwAddress as `0x${string}`;

        const result = await createSession({
          accountAddress,
          signerAddress,
          policyPayload: policyPreview.policyPayload,
        });

        const bundle = {
          accountAddress,
          chainId: chain.id,
          expiresAt: Number(result.sessionConfig.expiresAt),
          sessionConfig: serializeSessionConfig(result.sessionConfig),
        };

        const redirectUrl = buildRedirectUrl(callbackUrl, bundle);
        markCreationSuccess({
          transactionHash: result.transactionHash ?? null,
          redirectUrl,
        });
        window.location.assign(redirectUrl);
      } catch (error) {
        markCreationError(error instanceof Error ? error.message : String(error));
      }
    };

    void run();
  }, [
    agwAddress,
    policyPreview,
    createSession,
    signerAddress,
    callbackUrl,
    chain.id,
    isClientReady,
    markCreationError,
    markCreationSuccess,
  ]);

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>Creating Session</CardTitle>
          <CardDescription>Approve the transaction in your wallet to create the session key.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={styles.helper}>
            {!isClientReady || isClientLoading
              ? 'Preparing wallet client...'
              : isPending
                ? 'Waiting for wallet approval...'
                : 'Preparing transaction...'}
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
