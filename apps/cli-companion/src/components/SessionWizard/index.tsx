'use client';

import type { Chain } from 'viem/chains';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import Creating from './steps/Creating';
import ErrorStep from './steps/Error';
import NotLoggedIn from './steps/NotLoggedIn';
import Resolving from './steps/Resolving';
import SelectPolicy from './steps/SelectPolicy';
import Success from './steps/Success';

export default function SessionWizard({
  callbackUrl,
  chain,
  authPublicKey,
}: {
  callbackUrl: string;
  chain: Chain;
  authPublicKey: string;
}) {
  const { currentStep } = useSessionWizardState();

  switch (currentStep) {
    case 'not_logged_in':
      return <NotLoggedIn />;
    case 'resolving':
      return <Resolving />;
    case 'select_policy':
      return <SelectPolicy authPublicKey={authPublicKey} />;
    case 'creating':
      return <Creating callbackUrl={callbackUrl} chain={chain} authPublicKey={authPublicKey} />;
    case 'success':
      return <Success />;
    case 'error':
      return <ErrorStep />;
    default:
      return null;
  }
}
