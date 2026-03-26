# AGW Wallet Provider Integrations

AGW can be added as a wallet option to existing applications that use popular wallet connection libraries. Each integration wraps AGW into the library's connector system.

## Supported Providers

| Provider | Integration Guide |
|----------|------------------|
| ConnectKit | [docs.abs.xyz](https://docs.abs.xyz/abstract-global-wallet/agw-react/integrating-with-connectkit) |
| Dynamic | [docs.abs.xyz](https://docs.abs.xyz/abstract-global-wallet/agw-react/integrating-with-dynamic) |
| Privy | [docs.abs.xyz](https://docs.abs.xyz/abstract-global-wallet/agw-react/integrating-with-privy) |
| RainbowKit | [docs.abs.xyz](https://docs.abs.xyz/abstract-global-wallet/agw-react/integrating-with-rainbowkit) |
| Reown | [docs.abs.xyz](https://docs.abs.xyz/abstract-global-wallet/agw-react/integrating-with-reown) |
| Thirdweb | [docs.abs.xyz](https://docs.abs.xyz/abstract-global-wallet/agw-react/integrating-with-thirdweb) |

## Native Integration (No Third-Party Library)

If you're not using ConnectKit, RainbowKit, etc., use the native integration:

[Native Integration Guide](https://docs.abs.xyz/abstract-global-wallet/agw-react/native-integration)

This is the default approach covered in the main AGW skill — wrap with `AbstractWalletProvider` and use hooks directly.

## When to Use a Provider Integration

| Scenario | Approach |
|----------|----------|
| New app, Abstract-only | Native integration (default) |
| Existing app with ConnectKit/RainbowKit/etc. | Add AGW as a wallet option via provider integration |
| Multi-chain app, AGW as one option | Provider integration |
| Need Privy's auth features + AGW | Privy integration |

## Fiat On-Ramp

[Using Crossmint](https://docs.abs.xyz/abstract-global-wallet/fiat-on-ramp/using-crossmint) — allow users to purchase on-chain items with fiat currencies.
