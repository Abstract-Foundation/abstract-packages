import { NextResponse } from 'next/server';
import { getCallbackSigningPublicKey } from '@/lib/server/callback-attestation';

export function GET() {
  const privyAppId = process.env.PRIVY_APP_ID?.trim() || process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
  if (!privyAppId) {
    return NextResponse.json({ error: 'Missing Privy app id.' }, { status: 500 });
  }

  return NextResponse.json({
    ...getCallbackSigningPublicKey(),
    privyAppId,
  });
}
