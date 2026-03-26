import { abstract, abstractTestnet } from 'viem/chains';
/**
 * Abstract chain constants for the MPP plugin.
 */

/** USDC.e on Abstract Testnet (ERC-3009, 6 decimals) */
export const USDC_E_TESTNET =
  '0xbd28Bd5A3Ef540d1582828CE2A1a657353008C61' as const;
/** USDC.e on Abstract Mainnet (ERC-3009, 6 decimals) */
export const USDC_E_MAINNET =
  '0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1' as const;

/** USDC.e decimals */
export const USDC_E_DECIMALS = 6;

/** AbstractStreamChannel escrow contract on Abstract Testnet. */
export const ABSTRACT_STREAM_CHANNEL_TESTNET =
  '0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c' as const;
/** AbstractStreamChannel escrow contract on Abstract Mainnet. */
export const ABSTRACT_STREAM_CHANNEL_MAINNET =
  '0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c' as const;

/** Keccak-256 typehash for ERC-3009 `TransferWithAuthorization`. */
export const TRANSFER_WITH_AUTHORIZATION_TYPEHASH =
  '0x7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267' as const;

/** ABI fragments for ERC-3009 `transferWithAuthorization` (v/r/s signature variant). */
export const ERC3009_ABI = [
  {
    name: 'transferWithAuthorization',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'authorizationState',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'authorizer', type: 'address' },
      { name: 'nonce', type: 'bytes32' },
    ],
    outputs: [{ name: 'state', type: 'bool' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'version',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

/** ABI fragment for ERC-3009 `transferWithAuthorization` (bytes signature variant). */
export const ERC3009_BYTES_SIGNATURE_ABI = [
  {
    name: 'transferWithAuthorization',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

/** ABI for the AbstractStreamChannel escrow contract. */
export const ABSTRACT_STREAM_CHANNEL_ABI = [
  {
    name: 'open',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'payee', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'deposit', type: 'uint128' },
      { name: 'salt', type: 'bytes32' },
      { name: 'authorizedSigner', type: 'address' },
    ],
    outputs: [{ name: 'channelId', type: 'bytes32' }],
  },
  {
    name: 'settle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'cumulativeAmount', type: 'uint128' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'topUp',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'additionalDeposit', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'close',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'cumulativeAmount', type: 'uint128' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'requestClose',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'getChannel',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'finalized', type: 'bool' },
          { name: 'closeRequestedAt', type: 'uint64' },
          { name: 'payer', type: 'address' },
          { name: 'payee', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'authorizedSigner', type: 'address' },
          { name: 'deposit', type: 'uint128' },
          { name: 'settled', type: 'uint128' },
        ],
      },
    ],
  },
  {
    name: 'computeChannelId',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'payer', type: 'address' },
      { name: 'payee', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'salt', type: 'bytes32' },
      { name: 'authorizedSigner', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'getVoucherDigest',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'cumulativeAmount', type: 'uint128' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'domainSeparator',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'VOUCHER_TYPEHASH',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'CLOSE_GRACE_PERIOD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint64' }],
  },
  {
    name: 'ChannelOpened',
    type: 'event',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'payee', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'authorizedSigner', type: 'address', indexed: false },
      { name: 'salt', type: 'bytes32', indexed: false },
      { name: 'deposit', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Settled',
    type: 'event',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'payee', type: 'address', indexed: true },
      { name: 'cumulativeAmount', type: 'uint256', indexed: false },
      { name: 'deltaPaid', type: 'uint256', indexed: false },
      { name: 'newSettled', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'ChannelClosed',
    type: 'event',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'payee', type: 'address', indexed: true },
      { name: 'settledToPayee', type: 'uint256', indexed: false },
      { name: 'refundedToPayer', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'TopUp',
    type: 'event',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'payee', type: 'address', indexed: true },
      { name: 'additionalDeposit', type: 'uint256', indexed: false },
      { name: 'newDeposit', type: 'uint256', indexed: false },
    ],
  },
] as const;

/** EIP-712 domain name for session voucher signatures. */
export const VOUCHER_DOMAIN_NAME = 'Abstract Stream Channel';
/** EIP-712 domain version for session voucher signatures. */
export const VOUCHER_DOMAIN_VERSION = '1';

/** EIP-712 type definition for `Voucher` typed data. */
export const VOUCHER_TYPES = {
  Voucher: [
    { name: 'channelId', type: 'bytes32' },
    { name: 'cumulativeAmount', type: 'uint128' },
  ],
} as const;

/** EIP-712 type definition for `TransferWithAuthorization` typed data. */
export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/** USDC.e address by Abstract chainId (testnet/mainnet). */
export const DEFAULT_CURRENCY = {
  [abstractTestnet.id]: USDC_E_TESTNET,
  [abstract.id]: USDC_E_MAINNET,
};

/** AbstractStreamChannel address by Abstract chainId (testnet/mainnet). */
export const DEFAULT_ESCROW = {
  [abstractTestnet.id]: ABSTRACT_STREAM_CHANNEL_TESTNET,
  [abstract.id]: ABSTRACT_STREAM_CHANNEL_MAINNET,
};
