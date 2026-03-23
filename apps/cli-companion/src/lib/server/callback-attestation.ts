import { createPrivateKey, createPublicKey, generateKeyPairSync, sign as signPayload, verify as verifyPayload } from 'node:crypto';

const DEFAULT_CALLBACK_ISSUER = 'agw';

interface CallbackSigner {
  issuer: string;
  publicKeyBase64: string;
  privateKey: ReturnType<typeof createPrivateKey>;
}

interface SignedCallbackClaims {
  [key: string]: unknown;
  iss: string;
  iat: number;
  exp: number;
}

declare global {
  var __agwMcpCallbackSigner: CallbackSigner | undefined;
}

let cachedCallbackSigner: CallbackSigner | null = null;

function encodeBase64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function resolveIssuer(): string {
  return process.env.AGW_MCP_CALLBACK_SIGNING_ISSUER?.trim() || DEFAULT_CALLBACK_ISSUER;
}

function loadConfiguredSigner(): CallbackSigner | null {
  const privateKeyBase64 = process.env.AGW_MCP_CALLBACK_SIGNING_PRIVATE_KEY?.trim();
  if (!privateKeyBase64) {
    return null;
  }

  const privateKey = createPrivateKey({
    key: Buffer.from(privateKeyBase64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });
  const publicKeyBase64 = createPublicKey(privateKey).export({
    format: 'der',
    type: 'spki',
  }).toString('base64');
  const configuredPublicKey = process.env.AGW_MCP_CALLBACK_SIGNING_PUBLIC_KEY?.trim();
  if (configuredPublicKey && configuredPublicKey !== publicKeyBase64) {
    throw new Error('Configured callback signing public key does not match the provided private key.');
  }

  return {
    issuer: resolveIssuer(),
    publicKeyBase64,
    privateKey,
  };
}

function createEphemeralSigner(): CallbackSigner {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');

  return {
    issuer: resolveIssuer(),
    publicKeyBase64: publicKey.export({
      format: 'der',
      type: 'spki',
    }).toString('base64'),
    privateKey,
  };
}

function getCallbackSigner(): CallbackSigner {
  if (cachedCallbackSigner) {
    return cachedCallbackSigner;
  }

  if (globalThis.__agwMcpCallbackSigner) {
    cachedCallbackSigner = globalThis.__agwMcpCallbackSigner;
    return cachedCallbackSigner;
  }

  const configuredSigner = loadConfiguredSigner();
  if (configuredSigner) {
    cachedCallbackSigner = configuredSigner;
    globalThis.__agwMcpCallbackSigner = configuredSigner;
    return cachedCallbackSigner;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing AGW_MCP_CALLBACK_SIGNING_PRIVATE_KEY in production environment.');
  }

  cachedCallbackSigner = createEphemeralSigner();
  globalThis.__agwMcpCallbackSigner = cachedCallbackSigner;
  return cachedCallbackSigner;
}

export function getCallbackSigningPublicKey(): { issuer: string; publicKey: string } {
  const signer = getCallbackSigner();
  return {
    issuer: signer.issuer,
    publicKey: signer.publicKeyBase64,
  };
}

export function signCallbackPayload<TPayload extends SignedCallbackClaims>(payload: TPayload): string {
  const signer = getCallbackSigner();
  const header = {
    alg: 'EdDSA',
    typ: 'AGW-MCP-CALLBACK',
  };
  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const message = Buffer.from(`${encodedHeader}.${encodedPayload}`, 'utf8');
  const signature = signPayload(null, message, signer.privateKey);
  return `${encodedHeader}.${encodedPayload}.${encodeBase64Url(signature)}`;
}

export function buildSignedCallbackPayload<TPayload extends Omit<SignedCallbackClaims, 'iss' | 'iat' | 'exp'>>(
  payload: TPayload,
  ttlSeconds = 300,
): TPayload & SignedCallbackClaims {
  const signer = getCallbackSigner();
  const now = Math.floor(Date.now() / 1000);

  return {
    ...payload,
    iss: signer.issuer,
    iat: now,
    exp: now + ttlSeconds,
  };
}

function parseSignedToken(token: string): { header: Record<string, unknown>; payload: SignedCallbackClaims; message: Buffer; signature: Buffer } {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid signed token.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as Record<string, unknown>;
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SignedCallbackClaims;

  return {
    header,
    payload,
    message: Buffer.from(`${encodedHeader}.${encodedPayload}`, 'utf8'),
    signature: Buffer.from(encodedSignature, 'base64url'),
  };
}

export function verifySignedServerPayload<TPayload>(token: string): TPayload {
  const signer = getCallbackSigner();
  const parsed = parseSignedToken(token);
  const isValid = verifyPayload(null, parsed.message, createPublicKey(signer.privateKey), parsed.signature);
  if (!isValid) {
    throw new Error('Invalid signed token signature.');
  }
  if (parsed.header.alg !== 'EdDSA') {
    throw new Error(`Unsupported signed token algorithm (${String(parsed.header.alg)}).`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.payload.iss !== signer.issuer) {
    throw new Error('Invalid signed token issuer.');
  }
  if (typeof parsed.payload.iat !== 'number' || typeof parsed.payload.exp !== 'number') {
    throw new Error('Signed token is missing freshness metadata.');
  }
  if (parsed.payload.iat > now + 60 || parsed.payload.exp < now - 60) {
    throw new Error('Signed token is expired or not yet valid.');
  }

  return parsed.payload as TPayload;
}
