export const USDC_E_TESTNET = '0xbd28Bd5A3Ef540d1582828CE2A1a657353008C61' as const
export const OPEN_MINTER_TESTNET = '0x86C3FA1c8d7dcDebAC1194531d080e6e6fF9afF5' as const
export const USDC_DECIMALS = 6

export const OPEN_MINTER_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

export const CHARGE_AMOUNT = '0.01'
export const SESSION_AMOUNT = '0.001'
export const SESSION_DEPOSIT = '1'

export const PAYMASTER_ADDRESS = '0x5407B5040dec3D339A9247f3654E59EEccbb6391' as const
