# Uniswap V2 Entrypoints

## Contents
- Swap Functions
- Quote Functions
- Liquidity Functions
- Factory Functions
- Swap Examples

## Swap Functions

### swapExactETHForTokens
Swap native ETH for tokens. Router wraps ETH to WETH internally. Send ETH via `value` field.

```text
swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable → uint256[] amounts
```

Path must start with WETH: `[WETH, tokenOut]`

### swapExactTokensForTokens
Swap exact amount of input tokens for output tokens. Requires prior ERC-20 approval.

```text
swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) → uint256[] amounts
```

### swapExactTokensForETH
Swap exact tokens for native ETH. Path must end with WETH.

```text
swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) → uint256[] amounts
```

Selector: `0x18cbafe5`

### swapTokensForExactTokens
Swap tokens for an exact amount of output tokens.

```text
swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) → uint256[] amounts
```

### swapTokensForExactETH
Swap tokens for exact amount of native ETH.

```text
swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) → uint256[] amounts
```

### swapETHForExactTokens
Swap ETH for exact amount of output tokens. Excess ETH is refunded.

```text
swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) payable → uint256[] amounts
```

## Quote Functions

### getAmountsOut
Given an input amount and path, return the expected output amounts at each hop.

```text
getAmountsOut(uint256 amountIn, address[] path) view → uint256[] amounts
```

`amounts[0]` = input amount, `amounts[path.length-1]` = final output.

### getAmountsIn
Given an output amount and path, return the required input amounts at each hop.

```text
getAmountsIn(uint256 amountOut, address[] path) view → uint256[] amounts
```

## Liquidity Functions

### addLiquidity
Add liquidity to a token-token pair.

```text
addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) → (uint256 amountA, uint256 amountB, uint256 liquidity)
```

Requires prior approval of both tokens to the Router.

### addLiquidityETH
Add liquidity to a token-ETH pair. Send ETH via `value` field.

```text
addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) payable → (uint256 amountToken, uint256 amountETH, uint256 liquidity)
```

### removeLiquidity
Remove liquidity from a token-token pair. Requires approval of LP token to Router.

```text
removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) → (uint256 amountA, uint256 amountB)
```

### removeLiquidityETH
Remove liquidity from a token-ETH pair.

```text
removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) → (uint256 amountToken, uint256 amountETH)
```

## Factory Functions

### getPair
Look up the pair address for two tokens.

```text
getPair(address tokenA, address tokenB) view → address pair
```

Returns `address(0)` if no pair exists.

## Swap Examples

### Swap 0.1 ETH → USDC (V2)

Step 1 — Quote:
```bash
agw contract write --json '{
  "address": "0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c",
  "abi": ["function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)"],
  "functionName": "getAmountsOut",
  "args": ["100000000000000000", ["0x3439153EB7AF838Ad19d56E1571FBD09333C2809", "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1"]]
}' --dry-run
```

Step 2 — Preview swap (set amountOutMin to quote * 0.995 for 0.5% slippage):
```bash
agw contract write --json '{
  "address": "0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c",
  "abi": ["function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)"],
  "functionName": "swapExactETHForTokens",
  "args": ["<AMOUNT_OUT_MIN>", ["0x3439153EB7AF838Ad19d56E1571FBD09333C2809", "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1"], "<YOUR_ADDRESS>", "<DEADLINE>"],
  "value": "100000000000000000"
}' --dry-run
```

### Batch Approve + Swap USDC → ETH

Use `agw tx calls` for atomic approve + swap. Each call requires pre-encoded hex calldata (`data` field) — `agw tx calls` does NOT accept ABI-level `abi`/`functionName`/`args`.

The `approve(address,uint256)` selector is `0x095ea7b3`. Pad the router address and amount to 32 bytes each.

```bash
agw tx calls --json '{
  "calls": [
    {
      "to": "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1",
      "data": "0x095ea7b3000000000000000000000000ad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c<AMOUNT_PADDED_32_BYTES>",
      "value": "0"
    },
    {
      "to": "0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c",
      "data": "<ENCODED_swapExactTokensForETH>",
      "value": "0"
    }
  ]
}' --dry-run
```

Approve only the exact swap amount rather than `type(uint256).max` to limit exposure.

For ABI-level readability on individual calls, use `agw contract write` instead. Reserve `agw tx calls` for when atomicity across multiple calls is required.
