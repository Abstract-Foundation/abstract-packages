import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import WalletProvider from '@/components/wallet/wallet-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'MPP Payment Protocol Demo | Abstract',
  description:
    'Interactive demo of the Machine Payments Protocol on Abstract testnet — charge and session intents',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <WalletProvider>
        <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
          {children}
        </body>
      </WalletProvider>
    </html>
  )
}
