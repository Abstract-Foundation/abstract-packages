"use client";

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

export default function Resolving() {
  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader gradient>
          <div className={styles.badge}>
            <AbstractBadge />
          </div>
        </CardHeader>
        <CardContent className={styles.loginContent}>
          <CardTitle>Verifying Wallet</CardTitle>
          <CardDescription>
            Checking your Abstract Global Wallet on-chain. This should only take
            a moment.
          </CardDescription>
        </CardContent>
        <CardFooter className={styles.footer}>
          <p className={styles.helper}>Resolving AGW account...</p>
        </CardFooter>
      </Card>
    </div>
  );
}
