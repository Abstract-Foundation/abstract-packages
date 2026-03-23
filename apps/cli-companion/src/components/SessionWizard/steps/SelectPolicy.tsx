'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Button from '@/@abstract-ui/components/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/Card';
import { buildDefaultPolicyPreview } from '@/lib/policy-compiler';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import useSessionWizardStore from '@/stores/useSessionWizardStore';
import styles from '../styles.module.scss';

const CLOCK_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M7 4.5V7L8.5 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SHIELD_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 1.5L2.5 3.5V6.5C2.5 9.5 4.5 11.5 7 12.5C9.5 11.5 11.5 9.5 11.5 6.5V3.5L7 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CHAIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 8.5L8.5 5.5M4.5 6.5L3.5 7.5C2.5 8.5 2.5 10 3.5 10.5C4.5 11.5 6 11.5 6.5 10.5L7.5 9.5M6.5 4.5L7.5 3.5C8.5 2.5 10 2.5 10.5 3.5C11.5 4.5 11.5 6 10.5 6.5L9.5 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const REVOKE_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5 5L9 9M9 5L5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 7L6 9.5L10.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AGENT_PERMISSIONS = [
  'Send tokens from your wallet',
  'Sign messages for DeFi interactions',
  'Interact with smart contracts',
  'Swap tokens on DEXs',
];

function formatChainName(chainId: number | null): string {
  if (chainId === 11124) return 'Abstract Testnet';
  if (chainId === 2741) return 'Abstract';
  return 'This chain';
}

export default function SelectPolicy({ authPublicKey }: { authPublicKey: string }) {
  void authPublicKey;

  const {
    agwAddress,
    dangerAcknowledged,
    setDangerAcknowledged,
    proceedToCreating,
    setValidationError,
  } = useSessionWizardState();

  const chainId = useSessionWizardStore(state => state.chainId);

  const { expiryLabel, maxValueLabel, chainName } = useMemo(() => {
    const preview = buildDefaultPolicyPreview();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresInSeconds = preview.policyPayload.expiresAt - nowSeconds;
    const hours = Math.round(expiresInSeconds / 3600);
    const maxValueWei = BigInt(preview.policyPayload.sessionConfig.maxValuePerUse);
    const maxEth = Number(maxValueWei) / 1e18;

    const days = Math.round(expiresInSeconds / 86400);
    let expiryLabel: string;
    if (days >= 1) {
      expiryLabel = `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours >= 1) {
      expiryLabel = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      expiryLabel = `${Math.round(expiresInSeconds / 60)} min`;
    }

    return {
      expiryLabel,
      maxValueLabel: `${maxEth} ETH per tx`,
      chainName: `${formatChainName(chainId)} only`,
    };
  }, [chainId]);

  const displayAddress = agwAddress ? `${agwAddress.slice(0, 6)}...${agwAddress.slice(-4)}` : 'Wallet';

  const handleAuthorize = () => {
    if (!dangerAcknowledged) {
      setValidationError('Confirm that you understand the access you are granting.');
      return;
    }

    proceedToCreating(buildDefaultPolicyPreview());
  };

  return (
    <div className={styles.wrapper}>
      <Card className={styles.mainCard}>
        <CardHeader className={styles.mainHeader}>
          <div className={styles.identity}>
            <div className={styles.logoWrap}>
              <Image
                src="/assets/images/Abstract_AppIcon_LightMode.svg"
                alt="Abstract AGW icon"
                width={68}
                height={68}
                priority
              />
            </div>
            <h2 className={styles.walletAddress}>{displayAddress}</h2>
            <p className={styles.walletLabel}>AGW Wallet</p>
          </div>
        </CardHeader>
        <CardContent className={styles.mainBody}>
          <p className={styles.consentTitle}>Authorize AI Agent</p>
          <p className={styles.consentSubtext}>
            Allow an AI agent to act on behalf of your wallet within strict safety limits.
          </p>

          <div className={styles.safetyPills}>
            <span className={styles.safetyPill}>
              <span className={styles.safetyPillIcon} aria-hidden="true">{CLOCK_ICON}</span>
              Expires in {expiryLabel}
            </span>
            <span className={styles.safetyPill}>
              <span className={styles.safetyPillIcon} aria-hidden="true">{SHIELD_ICON}</span>
              {maxValueLabel}
            </span>
            <span className={styles.safetyPill}>
              <span className={styles.safetyPillIcon} aria-hidden="true">{CHAIN_ICON}</span>
              {chainName}
            </span>
            <span className={styles.safetyPill}>
              <span className={styles.safetyPillIcon} aria-hidden="true">{REVOKE_ICON}</span>
              Revocable anytime
            </span>
          </div>

          <div className={styles.permissionBlock}>
            <p className={styles.permissionBlockTitle}>What your agent can do</p>
            <ul className={styles.permissionListCompact}>
              {AGENT_PERMISSIONS.map(label => (
                <li key={label} className={styles.permissionListCompactItem}>
                  <span className={styles.permissionCheckIcon} aria-hidden="true">{CHECK_ICON}</span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <label className={styles.consentAckSimple}>
            <input
              type="checkbox"
              checked={dangerAcknowledged}
              onChange={event => setDangerAcknowledged(event.target.checked)}
            />
            <span>I approve this agent to act within these limits. I can revoke access at any time.</span>
          </label>
        </CardContent>
        <CardFooter className={styles.mainFooter}>
          <div className={styles.buttonRow}>
            <Button
              className={styles.footerButton}
              height="40"
              variant="green"
              onClick={handleAuthorize}
              disabled={!dangerAcknowledged}
            >
              Approve Access
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
