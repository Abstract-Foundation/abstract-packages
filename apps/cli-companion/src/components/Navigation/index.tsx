'use client';

import Link from 'next/link';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { useAccount } from 'wagmi';
import Button from '@/@abstract-ui/components/Button';
import Wordmark from '@/assets/wordmark.svg';
import styles from './styles.module.scss';

const abstractHome = 'https://abs.xyz';

export default function Navigation() {
  const { logout } = useLoginWithAbstract();
  const { isConnected } = useAccount();

  return (
    <nav className={styles.navigation}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Wordmark />
        </Link>
        <div className={styles.buttons}>
          <Button height="32" variant="secondary" onClick={logout} disabled={!isConnected}>
            Sign out
          </Button>
          <Button href={abstractHome} height="32" variant="secondary">
            Back to Abstract
          </Button>
        </div>
      </div>
    </nav>
  );
}
