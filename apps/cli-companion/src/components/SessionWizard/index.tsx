'use client';

import type { Chain } from 'viem/chains';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import Creating from './steps/Creating';
import ErrorStep from './steps/Error';
import NotLoggedIn from './steps/NotLoggedIn';
import Success from './steps/Success';

export default function SessionWizard({
  callbackUrl,
  chain,
}: {
  callbackUrl: string;
  chain: Chain;
}) {
  const { currentStep } = useSessionWizardState();

  switch (currentStep) {
    case 'not_logged_in':
      return <NotLoggedIn />;
    case 'creating':
      return <Creating callbackUrl={callbackUrl} chain={chain} />;
    case 'success':
      return <Success />;
    case 'error':
      return <ErrorStep />;
    default:
      return null;
  }
}
