import clsx from "clsx";
import Image from "next/image";
import styles from "./styles.module.scss";

interface AbstractBadgeProps {
  className?: string;
}

export default function AbstractBadge({ className }: AbstractBadgeProps) {
  return (
    <div className={clsx(styles.badge, className)}>
      <Image
        src="/assets/images/Abstract_AppIcon_LightMode.svg"
        alt="Abstract AGW icon"
        width={72}
        height={72}
        priority
      />
    </div>
  );
}
