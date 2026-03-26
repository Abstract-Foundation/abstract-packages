'use client';

import clsx from 'clsx';
import React, { forwardRef } from 'react';

import styles from './styles.module.scss';

interface ContainerProps {
  children: React.ReactNode;
  outerClassName?: string;
  contentClassName?: string;
  className?: string;
  withPadding?: boolean;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, className, outerClassName, withPadding = true }, ref) => {
    return (
      <ContainerOuter className={outerClassName}>
        <ContainerInner
          ref={ref}
          className={className}
          withPadding={withPadding}
        >
          {children}
        </ContainerInner>
      </ContainerOuter>
    );
  },
);

Container.displayName = 'Container';

interface WrapperProps {
  children: React.ReactNode;
  className?: string;
  withAnimation?: boolean;
  withPadding?: boolean;
}

export const ContainerOuter = ({ children, className }: WrapperProps) => {
  return (
    <section className={clsx(styles.container, className)}>{children}</section>
  );
};

export const ContainerInner = forwardRef<HTMLDivElement, WrapperProps>(
  ({ children, className, withAnimation = true, withPadding }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          styles.content,
          withAnimation && styles.animate,
          withPadding && styles.basicPadding,
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

ContainerInner.displayName = 'ContainerInner';

export default Container;
