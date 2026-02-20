import Link from 'next/link';
import styles from './styles.module.scss';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <h1>AGW MCP Session App</h1>
          <p>
            Start this flow from the CLI with <code>agw-mcp init</code>. It will open
            <code> /session/new</code> with validated query parameters.
          </p>
          <p>
            Local testing: <Link href="/session/new">open session page</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
