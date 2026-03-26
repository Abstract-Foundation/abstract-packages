# Discovery And Entrypoints

Use this reference when the task needs live pool discovery, verified function signatures, or concrete LP and zap entrypoints.

## Live Sources

- `agw app show --json '{"appId":"183"}'` for the live Portal-enriched contract list.
- Abscan verified source for contract discovery and ABI recovery:
  - Router: `https://abscan.org/address/0xE8142D2f82036B6FC1e79E4aE85cF53FBFfDC998#code`
  - Example verified v2 volatile pool: `https://abscan.org/address/0xb560B29f35ab7b3517F3F2186a4552FF4978369b#code`
  - Example verified v3 CL pool: `https://abscan.org/address/0xB3131C7F642be362acbEe0dd0b3e0acc6f05fcDC#code`
- DexScreener for candidate pool discovery:
  - Search endpoint: `https://api.dexscreener.com/latest/dex/search/?q=<query>`

## Pool Discovery

Use DexScreener for candidate discovery only when the user asks to LP, zap, or trade a token without naming the exact pool.

If the user names an exact pair, do not start with DexScreener. Resolve the token addresses first and query the factory directly.

Decision rule:

- exact pair named: resolve token addresses and query `getPool` for both `stable=false` and `stable=true`
- token-only or quote-asset-ambiguous request: use DexScreener to enumerate candidate pools
- concentrated or `v3` request: identify the manager or NFT entrypoint before reasoning about execution

Example searches:

```bash
curl -Ls 'https://api.dexscreener.com/latest/dex/search/?q=<token-symbol>%20aborean' | jq '.pairs[:10] | map({dexId, labels, baseToken, quoteToken, pairAddress, url})'
curl -Ls 'https://api.dexscreener.com/latest/dex/search/?q=<token-symbol>%20WETH%20aborean%20abstract' | jq '.pairs[:10] | map(select(.chainId=="abstract")) | map({dexId, labels, base:.baseToken.symbol, quote:.quoteToken.symbol, pairAddress})'
curl -Ls 'https://api.dexscreener.com/latest/dex/search/?q=<token-symbol>%20USDC.e%20aborean%20abstract' | jq '.pairs[:10] | map(select(.chainId=="abstract")) | map({dexId, labels, base:.baseToken.symbol, quote:.quoteToken.symbol, pairAddress})'
```

Do not trust DexScreener alone for execution or exact-pair existence. A search miss is not proof that a pool does not exist. Reconfirm the chosen pool onchain.

## Exact Pair Lookup

For an exact pair, use the router to discover the default factory and then query both volatile and stable pool slots.

Example: Aborean `WETH/USDC.e` on Abstract

```bash
ROUTER=0xE8142D2f82036B6FC1e79E4aE85cF53FBFfDC998
FACTORY=$(cast call --rpc-url https://api.mainnet.abs.xyz $ROUTER 'defaultFactory()(address)')
WETH=0x3439153EB7AF838Ad19d56E1571FBD09333C2809
USDC_E=0x84a71ccd554cc1b02749b35d22f684cc8ec987e1

cast call --rpc-url https://api.mainnet.abs.xyz $FACTORY 'getPool(address,address,bool)(address)' $WETH $USDC_E false
cast call --rpc-url https://api.mainnet.abs.xyz $FACTORY 'getPool(address,address,bool)(address)' $WETH $USDC_E true
```

If one call returns a non-zero address, inspect that pool directly:

```bash
POOL=0x13058D2b9b7fC9E1A2418f11bcE30012BBf0436D
cast call --rpc-url https://api.mainnet.abs.xyz $POOL 'token0()(address)'
cast call --rpc-url https://api.mainnet.abs.xyz $POOL 'token1()(address)'
cast call --rpc-url https://api.mainnet.abs.xyz $POOL 'stable()(bool)'
cast call --rpc-url https://api.mainnet.abs.xyz $POOL 'getReserves()(uint256,uint256,uint256)'
```

Only say the exact pair is absent after the relevant `getPool` reads return zero addresses.

## Onchain Confirmation

Useful confirmation reads for a v2 pool:

```bash
cast call --rpc-url https://api.mainnet.abs.xyz 0xE8142D2f82036B6FC1e79E4aE85cF53FBFfDC998 'defaultFactory()(address)'
cast call --rpc-url https://api.mainnet.abs.xyz 0xF6cDfFf7Ad51caaD860e7A35d6D4075d74039a6B 'getPool(address,address,bool)(address)' 0x9eBe3A824Ca958e4b3Da772D2065518F009CBa62 0x3439153EB7AF838Ad19d56E1571FBD09333C2809 false
cast call --rpc-url https://api.mainnet.abs.xyz 0xb560B29f35ab7b3517F3F2186a4552FF4978369b 'token0()(address)'
cast call --rpc-url https://api.mainnet.abs.xyz 0xb560B29f35ab7b3517F3F2186a4552FF4978369b 'token1()(address)'
cast call --rpc-url https://api.mainnet.abs.xyz 0xb560B29f35ab7b3517F3F2186a4552FF4978369b 'stable()(bool)'
cast call --rpc-url https://api.mainnet.abs.xyz 0xb560B29f35ab7b3517F3F2186a4552FF4978369b 'getReserves()(uint256,uint256,uint256)'
```

Useful router quote helpers:

```bash
cast call --rpc-url https://api.mainnet.abs.xyz 0xE8142D2f82036B6FC1e79E4aE85cF53FBFfDC998 'quoteAddLiquidity(address,address,bool,address,uint256,uint256)(uint256,uint256,uint256)' <tokenA> <tokenB> <stable> <factory> <amountADesired> <amountBDesired>
cast call --rpc-url https://api.mainnet.abs.xyz 0xE8142D2f82036B6FC1e79E4aE85cF53FBFfDC998 'getAmountsOut(uint256,(address,address,bool,address)[])(uint256[])' <amountIn> '[(<from>,<to>,<stable>,<factory>)]'
cast call --rpc-url https://api.mainnet.abs.xyz 0xE8142D2f82036B6FC1e79E4aE85cF53FBFfDC998 'generateZapInParams(address,address,bool,address,uint256,uint256,(address,address,bool,address)[],(address,address,bool,address)[])(uint256,uint256,uint256,uint256)' <tokenA> <tokenB> <stable> <factory> <amountInA> <amountInB> '<routesA>' '<routesB>'
```

## Verified v2 Router Entrypoints

Recovered from the verified Abscan router at `0xE8142D2f82036B6FC1e79E4aE85cF53FBFfDC998`.

Core signatures:

```text
quoteAddLiquidity(address,address,bool,address,uint256,uint256)
addLiquidity(address,address,bool,uint256,uint256,uint256,uint256,address,uint256)
addLiquidityETH(address,bool,uint256,uint256,uint256,address,uint256)
generateZapInParams(address,address,bool,address,uint256,uint256,(address,address,bool,address)[],(address,address,bool,address)[])
zapIn(address,uint256,uint256,(address,address,bool,address,uint256,uint256,uint256,uint256),(address,address,bool,address)[],(address,address,bool,address)[],address,bool)
```

Selectors:

```text
addLiquidity: 0x5a47ddc3
approve: 0x095ea7b3
generateZapInParams: 0x07db50fa
zapIn: 0xfb49bafd
```

Structs:

```text
Route = (address from, address to, bool stable, address factory)
Zap = (
  address tokenA,
  address tokenB,
  bool stable,
  address factory,
  uint256 amountOutMinA,
  uint256 amountOutMinB,
  uint256 amountAMin,
  uint256 amountBMin
)
```

Execution guidance:

- For standard two-sided v2 LP, prefer `quoteAddLiquidity` then `addLiquidity`.
- For single-sided deposits where the user only has one token, prefer `generateZapInParams` then `zapIn`.
- `addLiquidityETH` is only for the token plus WETH path when the input side is native ETH.

## Multiple Pool Learnings

Treat token-only LP requests as ambiguous until you resolve the exact market.

Common reasons one token can map to multiple Aborean LPs:

- the same token can trade against several quote assets such as `WETH`, `USDC.e`, `ABX`, or others
- both `v2` and `v3` pools can exist for the same token pair
- multiple `v3` pools can exist for the same pair shape
- the user may mean a two-sided LP deposit or a single-sided zap

Implications:

- `LP some of my <token>` is not a complete execution request.
- Clarify:
  - quote asset
  - `v2` versus `v3`
  - two-sided LP versus single-sided zap
- If DexScreener does not show the expected exact pair, switch to factory lookup before telling the user the pair is unavailable.
- A v2 path is easier to recover from verified router source.
- A v3 path requires identifying the real manager or NFT entrypoint, not just the CL pool.

## v3 and Concentrated Liquidity

Abscan-verified CL pool source shows pool-level methods such as:

```text
mint(address recipient, int24 tickLower, int24 tickUpper, uint128 amount, bytes data)
collect(...)
burn(...)
stake(...)
swap(...)
setGaugeAndPositionManager(address,address)
```

That is not enough to safely construct the end-user LP action by itself.

For v3 or concentrated-liquidity requests:

- identify the manager or NFT contract first
- confirm whether user-facing LP creation is routed through that manager, a position NFT, or another helper
- do not reuse v2 router assumptions
