'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import {
  useLogin,
  useLoginWithEmail,
  useLoginWithOAuth,
  useLoginWithPasskey,
  usePrivy,
} from '@privy-io/react-auth';
import Button from '@/@abstract-ui/components/Button';
import IconArrowRight from '@/assets/icons/icon-back.svg';
import IconPointerRight from '@/assets/icons/icon-pointer-right.svg';
import IconGoogle from '@/assets/icons/google.svg';
import IconWallet from '@/assets/icons/icon-wallet-small.svg';
import IconDottedBorder from '@/assets/icons/icon-login-or-line.svg';
import LoginLogo from '@/assets/login/login-logo.png';
import LoginPattern from '@/assets/login/login-pattern.png';
import styles from './EmbeddedLoginCard.module.scss';

type LoginPhase = 'email' | 'code';

function resolveRedirectPath(candidate: string | null): string {
  if (!candidate) {
    return '/';
  }
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/';
  }
  return candidate;
}

export default function EmbeddedLoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth();
  const { loginWithPasskey } = useLoginWithPasskey();
  const gradientInputRef = useRef<HTMLInputElement>(null);

  const privyWallet = user?.linkedAccounts
    .filter(account => account.type === 'wallet')
    .find(account => account.walletClientType === 'privy');
  const walletReady = Boolean(privyWallet?.address);

  const redirectPath = useMemo(
    () => resolveRedirectPath(searchParams.get('redirect')),
    [searchParams],
  );

  const [phase, setPhase] = useState<LoginPhase>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && authenticated && walletReady) {
      router.replace(redirectPath);
    }
  }, [ready, authenticated, walletReady, redirectPath, router]);

  const handleSendCode = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      if (!email.trim()) {
        setError('Email is required.');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        await sendCode({ email: email.trim() });
        setPhase('code');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send code.');
      } finally {
        setIsProcessing(false);
      }
    },
    [email, sendCode],
  );

  const handleVerifyCode = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      if (!code.trim()) {
        setError('Verification code is required.');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        await loginWithCode({ code: code.trim() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not verify code.');
      } finally {
        setIsProcessing(false);
      }
    },
    [code, loginWithCode],
  );

  const handleGoogleLogin = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await initOAuth({ provider: 'google' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed.');
      setIsProcessing(false);
    }
  }, [initOAuth]);

  const handleWalletLogin = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await login({ loginMethods: ['wallet'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet login failed.');
      setIsProcessing(false);
    }
  }, [login]);

  const handlePasskeyLogin = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await loginWithPasskey();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey login failed.');
      setIsProcessing(false);
    }
  }, [loginWithPasskey]);

  const showLoading = !ready || isProcessing || oauthLoading || (authenticated && !walletReady);

  const handleEmailKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleSendCode();
      }
    },
    [handleSendCode],
  );

  const handleCodeKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleVerifyCode();
      }
    },
    [handleVerifyCode],
  );

  const handleGradientFocus = useCallback(() => {
    const wrap = gradientInputRef.current?.parentElement;
    if (wrap) wrap.style.setProperty('--gradient-opacity', '1');
  }, []);

  const handleGradientBlur = useCallback(() => {
    const wrap = gradientInputRef.current?.parentElement;
    if (wrap) wrap.style.setProperty('--gradient-opacity', '0');
  }, []);

  const handleBack = useCallback(() => {
    if (phase === 'code') {
      setPhase('email');
      setCode('');
      setError(null);
    } else {
      router.push(redirectPath);
    }
  }, [phase, redirectPath, router]);

  return (
    <div className={styles.wrapper}>
      <article className={styles.card}>
        <div className={styles.back}>
          <button
            type="button"
            onClick={handleBack}
            className={styles.backButton}
          >
            <IconArrowRight width="12" />
          </button>
        </div>

        <div className={styles.innerContent}>
          <figure className={styles.dotBackground}>
            <Image
              src={LoginPattern}
              alt=""
              width={540}
              height={417}
              priority
            />
          </figure>

          <header className={styles.header}>
            <figure className={styles.logoContainer}>
              <Image
                src={LoginLogo}
                alt="Abstract"
                width={72}
                height={72}
                priority
              />
            </figure>
          </header>

          {phase === 'email' ? (
            <div className={clsx(styles.forms, showLoading && styles.disabled)}>
              <div className={styles.text}>
                <h1 className={clsx(styles.heading, 'h2', 'font-medium')}>
                  Welcome
                </h1>
                <p className={clsx(styles.subheading, 'b1', 'font-medium', 'grey')}>
                  Welcome to Abstract. Sign in with your email or connect a Web3 wallet to get started.
                </p>
              </div>

              <div className={styles.emailForm}>
                <div className={styles.gradientInputWrap}>
                  <input
                    ref={gradientInputRef}
                    className={styles.emailInput}
                    disabled={showLoading}
                    onChange={event => setEmail(event.target.value)}
                    onFocus={handleGradientFocus}
                    onBlur={handleGradientBlur}
                    onKeyDown={handleEmailKeyPress}
                    placeholder="Email"
                    type="email"
                    value={email}
                  />
                  <div className={styles.submitWrap}>
                    <button
                      className={styles.submitButton}
                      disabled={showLoading}
                      onClick={() => handleSendCode()}
                      type="button"
                    >
                      <IconPointerRight width="14" />
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.or}>
                <IconDottedBorder width="124" />
                <span className="b1">OR</span>
                <IconDottedBorder width="124" />
              </div>

              <Button
                height="48"
                variant="none"
                disabled={showLoading}
                onClick={handleGoogleLogin}
                className={styles.loginButton}
                style={{ animationDelay: '500ms' }}
              >
                <div className={styles.buttonInner}>
                  <div className={styles.buttonIconFlex}>
                    <IconGoogle width="12" />
                    <span className="b3">Google</span>
                  </div>
                  <IconPointerRight width="14" />
                </div>
              </Button>

              <Button
                height="48"
                variant="none"
                disabled={showLoading}
                onClick={handleWalletLogin}
                className={styles.loginButton}
                style={{ animationDelay: '600ms' }}
              >
                <div className={styles.buttonInner}>
                  <div className={styles.buttonIconFlex}>
                    <IconWallet width="12" />
                    <span className="b3">Login with Wallet</span>
                  </div>
                  <IconPointerRight width="14" />
                </div>
              </Button>

              <Button
                height="48"
                variant="none"
                disabled={showLoading}
                onClick={handlePasskeyLogin}
                className={styles.loginButton}
                style={{ animationDelay: '700ms' }}
              >
                <div className={styles.buttonInner}>
                  <div className={styles.buttonIconFlex}>
                    <span>🔑</span>
                    <span className="b3">Linked Passkey</span>
                  </div>
                  <IconPointerRight width="14" />
                </div>
              </Button>
            </div>
          ) : (
            <div className={clsx(styles.forms, showLoading && styles.disabled)}>
              <div className={styles.text}>
                <h1 className={clsx(styles.heading, 'h2', 'font-medium')}>
                  Enter Your Code
                </h1>
                <p className={clsx(styles.subheading, 'b1', 'font-medium', 'grey')}>
                  We sent a verification code to your email. Enter it below to continue.
                </p>
              </div>

              <div className={styles.emailForm}>
                <div className={styles.gradientInputWrap}>
                  <input
                    className={styles.emailInput}
                    disabled={showLoading}
                    onChange={event => setCode(event.target.value)}
                    onKeyDown={handleCodeKeyPress}
                    placeholder="Verification code"
                    value={code}
                  />
                  <div className={styles.submitWrap}>
                    <button
                      className={styles.submitButton}
                      disabled={showLoading}
                      onClick={() => handleVerifyCode()}
                      type="button"
                    >
                      <IconPointerRight width="14" />
                    </button>
                  </div>
                </div>
              </div>

              <Button
                className={styles.backToEmailButton}
                disabled={showLoading}
                height="40"
                onClick={() => {
                  setPhase('email');
                  setCode('');
                  setError(null);
                }}
                variant="secondary"
              >
                Use a different email
              </Button>
            </div>
          )}

          {error && <p className={clsx(styles.error, 'b4')}>{error}</p>}
        </div>

        <footer className={styles.footer}>
          <p className="footnote-2 grey">
            © Copyright 2025 -- Cube, Inc. -- All Rights Reserved
          </p>
        </footer>
      </article>
    </div>
  );
}
