'use client';

import { Suspense } from 'react';
import EmbeddedLoginCard from '@/components/EmbeddedLoginCard';
import styles from '../styles.module.scss';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.loginWrapper}>
        <Suspense>
          <EmbeddedLoginCard />
        </Suspense>
      </div>
    </div>
  );
}
