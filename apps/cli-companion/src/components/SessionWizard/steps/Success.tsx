"use client";

import Button from "@/@abstract-ui/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/Card";
import { useSessionWizardState } from "@/hooks/useSessionWizardState";
import styles from "../styles.module.scss";

export default function Success() {
  const { redirectUrl, provisionedSigner, existingSigners } =
    useSessionWizardState();

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>Agent Access Delegated</CardTitle>
          <CardDescription>
            Return to your CLI callback to finish setup.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          {redirectUrl ? (
            <p className={styles.helper}>
              Open the link below to hand off your new agent signer to the CLI.
            </p>
          ) : null}
          {provisionedSigner ? (
            <p className={styles.helper}>
              Signer <code>{provisionedSigner.signerLabel}</code> with
              fingerprint <code>{provisionedSigner.signerFingerprint}</code> is
              now attached to your wallet.
            </p>
          ) : null}
          {existingSigners.length > 0 ? (
            <p className={styles.helper}>
              Existing AGW signers on this wallet: {existingSigners.length}.
            </p>
          ) : null}
          {redirectUrl ? (
            <p className={styles.helper}>
              If you see <code>ERR_CONNECTION_REFUSED</code>, re-run{" "}
              <code>{`agw auth init --json '{"chainId":2741,"execute":true}'`}</code>{" "}
              and keep that terminal open.
            </p>
          ) : null}
          <p className={styles.helper}>
            After returning to CLI, run{" "}
            <code>{`agw session status --json '{}'`}</code> to confirm and{" "}
            <code>{`agw auth revoke --json '{"execute":true}'`}</code> when
            done.
          </p>
        </CardContent>
        <CardFooter className={styles.footer}>
          {redirectUrl ? (
            <Button
              className={styles.footerButton}
              height="40"
              variant="primary"
              href={redirectUrl}
            >
              Return to CLI
            </Button>
          ) : (
            <Button
              className={styles.footerButton}
              height="40"
              variant="secondary"
              disabled
            >
              Redirecting...
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
