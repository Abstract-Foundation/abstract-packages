import "@abstract-foundation/agw-example-ui/styles.css";

import { favicon } from "@abstract-foundation/agw-example-ui";
import { ExampleRootLayout } from "@abstract-foundation/agw-example-ui/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abstract Wallet SDK",
  description: "Minimal Next.js demo of @abstract-foundation/wallet-sdk.",
  icons: {
    icon: favicon.src,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ExampleRootLayout>{children}</ExampleRootLayout>;
}
