import clsx from 'clsx';
import * as React from 'react';

import CardBG from '@/assets/card-bg.svg';

import styles from './styles.module.scss';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx(styles.card, className)} {...props} />
));
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
  children?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, gradient, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(styles.cardHeader, className, {
        [styles.gradient]: gradient,
      })}
      {...props}
    >
      {gradient && <CardBG className={styles.headerBG} />}
      {children}
    </div>
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx(styles.cardTitle, 'headline1', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx(styles.cardDescription, 'b4', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx(styles.cardContent, className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx(styles.cardFooter, className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
