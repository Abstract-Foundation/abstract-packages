# Uniswap V3 Entrypoints

## Contents
- SwapRouter02 Functions
- Deadline Handling (Critical)
- QuoterV2 Functions
- NonfungiblePositionManager Functions
- Fee Tiers
- Swap Examples

## SwapRouter02 Functions

### exactInputSingle
Swap an exact amount of one token for another through a single pool.

```text
exactInputSingle(ExactInputSingleParams params) payable → uint256 amountOut
```

```text
ExactInputSingleParams {
  address tokenIn,
  address tokenOut,
  uint24 fee,
  address recipient,
  uint256 amountIn,
  uint256 amountOutMinimum,
  uint160 sqrtPriceLimitX96
}
```

Set `sqrtPriceLimitX96` to `0` to accept any price.

### exactInput
Swap an exact amount through a multi-hop path.

```text
exactInput(ExactInputParams params) payable → uint256 amountOut
```

```text
ExactInputParams {
  bytes path,
  address recipient,
  uint256 amountIn,
  uint256 amountOutMinimum
}
```

Path encoding: `abi.encodePacked(tokenIn, fee, tokenOut)` for each hop.

### exactOutputSingle
Swap tokens to receive an exact output amount.

```text
exactOutputSingle(ExactOutputSingleParams params) payable → uint256 amountIn
```

```text
ExactOutputSingleParams {
  address tokenIn,
  address tokenOut,
  uint24 fee,
  address recipient,
  uint256 amountOut,
  uint256 amountInMaximum,
  uint160 sqrtPriceLimitX96
}
```

### exactOutput
Multi-hop swap for exact output.

```text
exactOutput(ExactOutputParams params) payable → uint256 amountIn
```

```text
ExactOutputParams {
  bytes path,
  address recipient,
  uint256 amountOut,
  uint256 amountInMaximum
}
```

## Deadline Handling (Critical)

The V3 SwapRouter02 struct parameters do NOT include a `deadline` field, unlike the original ISwapRouter. Deadline is enforced by wrapping the swap call inside `multicall`:

```text
multicall(uint256 deadline, bytes[] calldata data) payable → bytes[] results
```

Encode the swap call as `data[0]`, and the `deadline` parameter serves as the tx-level deadline. If `block.timestamp > deadline`, the entire multicall reverts.

For simple swaps via `agw contract write`, encode the swap function call as the inner `data` byte array and call `multicall` on SwapRouter02 instead of calling the swap function directly.

Alternatively, use `agw tx calls` and let the transaction-level deadline handle expiry when batching.

## QuoterV2 Functions

### quoteExactInputSingle
Quote the output for a single-pool swap without executing.

```text
quoteExactInputSingle(QuoteExactInputSingleParams params) → (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)
```

```text
QuoteExactInputSingleParams {
  address tokenIn,
  address tokenOut,
  uint256 amountIn,
  uint24 fee,
  uint160 sqrtPriceLimitX96
}
```

### quoteExactInput
Quote the output for a multi-hop swap.

```text
quoteExactInput(bytes path, uint256 amountIn) → (uint256 amountOut, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)
```

### quoteExactOutputSingle
Quote the required input for a single-pool exact-output swap.

```text
quoteExactOutputSingle(QuoteExactOutputSingleParams params) → (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)
```

### quoteExactOutput
Quote the required input for a multi-hop exact-output swap.

```text
quoteExactOutput(bytes path, uint256 amountOut) → (uint256 amountIn, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)
```

## NonfungiblePositionManager Functions

### mint
Create a new liquidity position.

```text
mint(MintParams params) payable → (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)
```

```text
MintParams {
  address token0,
  address token1,
  uint24 fee,
  int24 tickLower,
  int24 tickUpper,
  uint256 amount0Desired,
  uint256 amount1Desired,
  uint256 amount0Min,
  uint256 amount1Min,
  address recipient,
  uint256 deadline
}
```

Tokens must be sorted: `token0 < token1` (by address).

### increaseLiquidity
Add liquidity to an existing position.

```text
increaseLiquidity(IncreaseLiquidityParams params) payable → (uint128 liquidity, uint256 amount0, uint256 amount1)
```

### decreaseLiquidity
Remove liquidity from an existing position.

```text
decreaseLiquidity(DecreaseLiquidityParams params) payable → (uint256 amount0, uint256 amount1)
```

### collect
Collect accumulated fees and withdrawn liquidity.

```text
collect(CollectParams params) payable → (uint256 amount0, uint256 amount1)
```

## Fee Tiers

| Fee | Percentage | Typical Use |
|-----|-----------|-------------|
| 100 | 0.01% | Stablecoin-stablecoin (very tight) |
| 500 | 0.05% | Stablecoin pairs, high-volume pairs |
| 3000 | 0.3% | Standard volatile pairs (default) |
| 10000 | 1% | Exotic or low-liquidity pairs |

Try 3000 first for most pairs. If the pool does not exist at that fee tier, try 500 or 10000.

## Swap Examples

### V3 Quote: 1000 USDC → WETH

```bash
agw contract write --json '{
  "address": "0x728BD3eC25D5EDBafebB84F3d67367Cd9EBC7693",
  "abi": ["function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)"],
  "functionName": "quoteExactInputSingle",
  "args": [{
    "tokenIn": "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1",
    "tokenOut": "0x3439153EB7AF838Ad19d56E1571FBD09333C2809",
    "amountIn": "1000000000",
    "fee": 3000,
    "sqrtPriceLimitX96": "0"
  }]
}' --dry-run
```

### V3 Swap: 0.1 ETH → USDC via multicall

Encode the `exactInputSingle` call, then wrap in `multicall` with deadline:

```bash
agw contract write --json '{
  "address": "0x7712FA47387542819d4E35A23f8116C90C18767C",
  "abi": ["function multicall(uint256 deadline, bytes[] calldata data) payable returns (bytes[] memory results)"],
  "functionName": "multicall",
  "args": [
    "<DEADLINE_TIMESTAMP>",
    ["<ENCODED_exactInputSingle_CALL>"]
  ],
  "value": "100000000000000000"
}' --dry-run
```

For simpler V3 swaps, consider using the V2 router instead — V2 `swapExactETHForTokens` is simpler and handles deadlines natively.
