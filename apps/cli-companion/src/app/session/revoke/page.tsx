import pageStyles from "@/app/styles.module.scss";
import RevokeSignerFlow from "@/components/RevokeSignerFlow";
import styles from "@/components/SessionWizard/styles.module.scss";
import { parseRevokeParams } from "@/lib/onboarding-params";

function toSearchParams(
  params: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
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

export default async function RevokeSessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = parseRevokeParams(toSearchParams(await searchParams));

  if (!result.ok || !result.params) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.wrapper}>
          <p className={styles.error}>
            {result.error ?? "Invalid revoke parameters."}
          </p>
          <p className={styles.helper}>Use the agw CLI to start this flow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.container}>
      <RevokeSignerFlow
        callbackUrl={result.params.callbackUrl}
        chainId={result.params.chainId}
        accountAddress={result.params.accountAddress}
        walletId={result.params.walletId}
        signerId={result.params.signerId}
        signerLabel={result.params.signerLabel}
        signerFingerprint={result.params.signerFingerprint}
      />
    </div>
  );
}
