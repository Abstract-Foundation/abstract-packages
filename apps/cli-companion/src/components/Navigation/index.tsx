'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import Button from '@/@abstract-ui/components/Button';
import Wordmark from '@/assets/wordmark.svg';
import styles from './styles.module.scss';

const abstractHome = 'https://abs.xyz';

export default function Navigation() {
  const { user, authenticated, logout } = usePrivy();

  return (
    <nav className={styles.navigation}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Wordmark />
        </Link>
        <div className={styles.buttons}>
          {authenticated && user && (
            <Button height="32" variant="secondary" onClick={logout}>
              Sign out
            </Button>
          )}
          <Button href={abstractHome} height="32" variant="secondary">
            Back to Abstract
          </Button>
        </div>
      </div>
    </nav>
  );
}
