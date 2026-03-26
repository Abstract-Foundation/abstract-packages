"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Button from "@/@abstract-ui/components/Button";
import AbstractBadge from "@/components/AbstractBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/Card";
import styles from "../styles.module.scss";

export default function NotLoggedIn() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const redirectPath = query ? `${pathname}?${query}` : pathname;
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader gradient>
          <div className={styles.badge}>
            <AbstractBadge />
          </div>
        </CardHeader>
        <CardContent className={styles.loginContent}>
          <CardTitle>AGW CLI Server Onboarding</CardTitle>
          <CardDescription>
            Connect your wallet to authorize an AI agent for automated wallet
            actions on this machine. This flow only configures MCP access for
            this device.
          </CardDescription>
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button
            className={styles.footerButton}
            height="40"
            variant="primary"
            href={loginHref}
          >
            Login with AGW
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
