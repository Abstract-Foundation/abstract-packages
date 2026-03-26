'use client';

import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';

import styles from './styles.module.scss';

type LinkProps = React.ComponentProps<typeof Link>;
type HTMLButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
type FakeButtonProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'fake'>;

interface BaseProps {
  height: '20' | '24' | '32' | '36' | '40' | '48';
  variant?: 'primary' | 'secondary' | 'destructive' | 'dark' | 'green' | 'none';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type ButtonProps = BaseProps &
  (
    | ({ href: string } & LinkProps)
    | ({ fake: true } & FakeButtonProps)
    | HTMLButtonProps
  );

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  height,
  children,
  ...props
}) => {
  const commonProps = {
    className: clsx(
      className,
      'b3',
      styles.container,
      props.disabled && styles.disabled,
      styles['height-' + height],
      variant === 'primary' && styles.primary,
      (variant === 'secondary' || variant === 'destructive') &&
        styles.secondary,
      variant === 'destructive' && styles.destructive,
      variant === 'dark' && styles.dark,
      variant === 'green' && styles.green,
    ),
  };

  const content = children || null;

  if ('href' in props) {
    return (
      <Link {...commonProps} {...props}>
        {content}
      </Link>
    );
  }
  if ('fake' in props) {
    const restProps = { ...props } as FakeButtonProps & { fake?: true };
    delete restProps.fake;
    return (
      <div {...commonProps} {...restProps}>
        {content}
      </div>
    );
  }

  return (
    <button type="button" {...commonProps} {...props}>
      {content}
    </button>
  );
};

export default Button;
