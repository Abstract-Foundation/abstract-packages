import SessionFlowClient from '@/components/SessionFlowClient';
import { parseOnboardingParams } from '@/lib/onboarding-params';
import pageStyles from '@/app/styles.module.scss';
import styles from '@/components/SessionWizard/styles.module.scss';

function toSearchParams(
  params: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      searchParams.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        searchParams.append(key, entry);
      }
    }
  }
  return searchParams;
}

export default function NewSessionPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const result = parseOnboardingParams(toSearchParams(searchParams));

  if (!result.ok || !result.params) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.wrapper}>
          <p className={styles.error}>{result.error ?? 'Invalid onboarding parameters.'}</p>
          <p className={styles.helper}>Use the agw-mcp CLI to start this flow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.container}>
      <SessionFlowClient
        callbackUrl={result.params.callbackUrl}
        chainId={result.params.chainId}
        signerAddress={result.params.signerAddress}
      />
    </div>
  );
}
