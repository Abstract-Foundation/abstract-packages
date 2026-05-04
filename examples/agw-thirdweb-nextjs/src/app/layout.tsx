import "@abstract-foundation/agw-example-ui/styles.css";
import { favicon } from "@abstract-foundation/agw-example-ui";
import { ExampleRootLayout } from "@abstract-foundation/agw-example-ui/layout";
import type { Metadata } from "next";
import NextAbstractWalletProvider from "../components/NextAbstractWalletProvider";

export const metadata: Metadata = {
  title: "Abstract Global Wallet + Thirdweb",
  description: "Integrate Abstract Global Wallet with Thirdweb",
  icons: {
    icon: favicon.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ExampleRootLayout>
      <NextAbstractWalletProvider>{children}</NextAbstractWalletProvider>
    </ExampleRootLayout>
  );
}
