import type {
  PolicyPreview as PolicyPreviewType,
  SecurityAssessment,
} from "@/lib/policy-types";
import styles from "./styles.module.scss";

export default function PolicyPreview({
  preview,
  risk,
}: {
  preview: PolicyPreviewType;
  risk: SecurityAssessment;
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.section}>
        <p className={styles.label}>Policy Preview</p>
        <pre className={styles.code}>
          {JSON.stringify(preview.policyPayload, null, 2)}
        </pre>
      </div>
      <div className={styles.section}>
        <p className={styles.label}>Risk: {risk.level.toUpperCase()}</p>
        {risk.reasons.length === 0 ? (
          <p className={styles.lowRisk}>No high-risk patterns detected.</p>
        ) : (
          <ul className={styles.risks}>
            {risk.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
