import { NextResponse } from 'next/server';

const PRIVY_API_BASE = 'https://api.privy.io';
const ALLOWED_METHODS = new Set([
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData_v4',
  'eth_signTransaction',
]);

interface WalletRpcRequestBody {
  walletId?: string;
  method?: string;
  caip2?: string;
  params?: Record<string, unknown>;
  authorizationSignature?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WalletRpcRequestBody;
    if (!body.walletId || !body.method || !body.caip2 || !body.params || !body.authorizationSignature) {
      return NextResponse.json(
        { error: 'Missing required fields: walletId, method, caip2, params, authorizationSignature.' },
        { status: 400 },
      );
    }
    if (!ALLOWED_METHODS.has(body.method)) {
      return NextResponse.json({ error: `Unsupported RPC method: ${body.method}.` }, { status: 400 });
    }

    const appId = process.env.PRIVY_APP_ID?.trim() || process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
    const appSecret = process.env.PRIVY_APP_SECRET?.trim();
    if (!appId || !appSecret) {
      return NextResponse.json({ error: 'Missing Privy server credentials.' }, { status: 500 });
    }

    const response = await fetch(`${PRIVY_API_BASE}/v1/wallets/${encodeURIComponent(body.walletId)}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
        'privy-app-id': appId,
        'privy-authorization-signature': body.authorizationSignature,
      },
      body: JSON.stringify(
        body.method === 'eth_signTypedData_v4'
          ? { method: body.method, params: body.params }
          : { method: body.method, caip2: body.caip2, chain_type: 'ethereum', params: body.params },
      ),
    });

    const responseBody = await response.json();
    if (!response.ok) {
      return NextResponse.json(responseBody, { status: response.status });
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
