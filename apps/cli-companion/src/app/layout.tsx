import '@/app/globals.scss';
import '@/app/fonts.scss';

import type { Viewport } from 'next';
import Navigation from '@/components/Navigation';

import styles from './styles.module.scss';

export const metadata = {
  title: 'AGW MCP Session Onboarding',
  description: 'Hosted onboarding flow for AGW MCP session key setup.',
  applicationName: 'AGW MCP Session App',
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
        <Navigation />
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
