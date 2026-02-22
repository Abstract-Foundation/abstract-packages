'use client';

import type { Chain } from 'viem/chains';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import Creating from './steps/Creating';
import ErrorStep from './steps/Error';
import NotLoggedIn from './steps/NotLoggedIn';
import SelectPolicy from './steps/SelectPolicy';
import Success from './steps/Success';

export default function SessionWizard({
  callbackUrl,
  signerAddress,
  chain,
}: {
  callbackUrl: string;
  signerAddress: `0x${string}`;
  chain: Chain;
}) {
  const { currentStep } = useSessionWizardState();

  switch (currentStep) {
    case 'not_logged_in':
      return <NotLoggedIn />;
    case 'select_policy':
      return <SelectPolicy />;
    case 'creating':
      return <Creating callbackUrl={callbackUrl} signerAddress={signerAddress} chain={chain} />;
    case 'success':
      return <Success />;
    case 'error':
      return <ErrorStep />;
    default:
      return null;
  }
}
