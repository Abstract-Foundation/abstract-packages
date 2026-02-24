import '@/app/globals.scss';
import '@/app/fonts.scss';

import type { Viewport } from 'next';
import Navigation from '@/components/Navigation';
import AbstractProvider from '@/providers/AbstractProvider';

import styles from './styles.module.scss';

export const metadata = {
  title: 'AGW MCP Onboarding',
  description: 'Hosted onboarding flow for AGW MCP wallet linking.',
  applicationName: 'AGW MCP',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={styles.html} lang="en">
      <body className={styles.body}>
        <AbstractProvider>
          <Navigation />
          <main className={styles.main}>{children}</main>
        </AbstractProvider>
      </body>
    </html>
  );
}
