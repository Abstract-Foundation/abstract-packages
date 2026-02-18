# AGW Protocol Reference

Last verified: 2026-02-18

## Source of truth
- AGW contracts repo: `https://github.com/Abstract-Foundation/agw-contracts`
- AGW client constants: `https://github.com/Abstract-Foundation/agw-sdk/blob/main/packages/agw-client/src/constants.ts`
- AGW client ABIs directory: `https://github.com/Abstract-Foundation/agw-sdk/tree/main/packages/agw-client/src/abis`

## Core deployment addresses
- `SMART_ACCOUNT_FACTORY_ADDRESS`: `0x9B947df68D35281C972511B3E7BC875926f26C1A`
- `EOA_VALIDATOR_ADDRESS`: `0x74b9ae28EC45E3FA11533c7954752597C3De3e7A`
- `SESSION_KEY_VALIDATOR_ADDRESS`: `0x34ca1501FAE231cC2ebc995CE013Dbe882d7d081`
- `CONTRACT_DEPLOYER_ADDRESS`: `0x0000000000000000000000000000000000008006`
- `AGW_REGISTRY_ADDRESS`: `0xd5E3efDA6bB5aB545cc2358796E96D9033496Dda`
- `SESSION_KEY_POLICY_REGISTRY_ADDRESS`: `0xfD20b9d7A406e2C4f5D6Df71ABE3Ee48B2EccC9F`
- `FEATURE_FLAG_REGISTRY_ADDRESS`: `0xb5023a9F3e948e3A4f9DBA97118EEE801fA4e265`
- `CANONICAL_DELEGATE_REGISTRY_ADDRESS`: `0x0000000059A24EB229eED07Ac44229DB56C5d797`
- `CANONICAL_EXCLUSIVE_DELEGATE_RESOLVER_ADDRESS`: `0x0000000078CC4Cc1C14E27c0fa35ED6E5E58825D`

## Bridgehub addresses
- `BRIDGEHUB_ADDRESS[abstractTestnet.id]`: `0x35A54c8C757806eB6820629bc82d90E056394C92`
- `BRIDGEHUB_ADDRESS[abstract.id]`: `0x303a465b659cbb0ab36ee643ea362c509eeb5213`

## Selectors and rights constants
- `ADD_MODULE_SELECTOR`: `0xd3bdf4b5` (`addModule(bytes)`)
- `CREATE_SESSION_SELECTOR`: `0x5a0694d2` (`createSession(SessionLib.SessionSpec)`)
- `BATCH_CALL_SELECTOR`: `0x8f0273a9` (`batchCall((address,bool,uint256,bytes)[])`)
- `INSUFFICIENT_BALANCE_SELECTOR`: `0xe7931438` (`INSUFFICIENT_FUNDS()`)
- `AGW_LINK_DELEGATION_RIGHTS`: `0xc10dcfe266c1f71ef476efbd3223555750dc271e4115626b`
- `NON_EXPIRING_DELEGATION_RIGHTS`: `${AGW_LINK_DELEGATION_RIGHTS}000000ffffffffff`
- `BASE_GAS_PER_PUBDATA_BYTE`: `800n`

## ABI files to consume in AGW MCP
- `AGWAccount.ts`
- `AGWRegistryAbi.ts`
- `AccountFactory.ts`
- `BridgeHubAbi.ts`
- `DelegateRegistry.ts`
- `ExclusiveDelegateResolver.ts`
- `FeatureFlagRegistryAbi.ts`
- `SessionKeyPolicyRegistry.ts`
- `SessionKeyValidator.ts`
- `ZkSyncAbi.ts`

## Implementation guidance for AGW MCP
- Treat this file as a pinned snapshot; re-verify against upstream before mainnet rollout.
- Prefer importing constants/ABIs from `agw-sdk` directly in code rather than duplicating values.
- Keep local hardcoded copies only for tests/fixtures and document drift risk in PR notes.
