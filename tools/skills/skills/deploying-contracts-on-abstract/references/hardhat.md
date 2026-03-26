# Hardhat on Abstract

Alternative to Foundry for deploying smart contracts on Abstract. Use if you prefer TypeScript workflows or have an existing Hardhat project.

## Setup

### 1. Install dependencies

```bash
npm install -D @matterlabs/hardhat-zksync zksync-ethers@6 ethers@6
```

### 2. Configure `hardhat.config.ts`

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync";

const config: HardhatUserConfig = {
  defaultNetwork: "abstractTestnet",
  networks: {
    abstractTestnet: {
      url: "https://api.testnet.abs.xyz",
      ethNetwork: "sepolia",
      zksync: true,
      verifyURL: "https://api-sepolia.abscan.org/api",
    },
    abstractMainnet: {
      url: "https://api.mainnet.abs.xyz",
      ethNetwork: "mainnet",
      zksync: true,
      verifyURL: "https://api.abscan.org/api",
    },
  },
  zksolc: {
    version: "latest",
  },
  solidity: {
    version: "0.8.24",
  },
};

export default config;
```

### 3. Store private key

```bash
npx hardhat vars set DEPLOYER_PRIVATE_KEY
```

Access in config:

```ts
import { vars } from "hardhat/config";

const DEPLOYER_PRIVATE_KEY = vars.get("DEPLOYER_PRIVATE_KEY");
```

## Compile

```bash
npx hardhat clean && npx hardhat compile --network abstractTestnet
```

Outputs to `artifacts-zk/` and `cache-zk/`.

## Deploy

Create `deploy/deploy.ts`:

```ts
import { Deployer } from "@matterlabs/hardhat-zksync";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-ethers";
import { vars } from "hardhat/config";

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = new Wallet(vars.get("DEPLOYER_PRIVATE_KEY"));
  const deployer = new Deployer(hre, wallet);

  const artifact = await deployer.loadArtifact("Counter");
  const contract = await deployer.deploy(artifact, [/* constructor args */]);

  console.log(`Deployed to: ${await contract.getAddress()}`);
}
```

Run:

```bash
npx hardhat deploy-zksync --script deploy.ts --network abstractTestnet
```

## Verify

```bash
npx hardhat verify --network abstractTestnet <contract-address>
```

## References

- [Hardhat Installation](https://docs.abs.xyz/build-on-abstract/smart-contracts/hardhat/installation)
- [Hardhat Deployment](https://docs.abs.xyz/build-on-abstract/smart-contracts/hardhat/deploying-contracts)
- [Hardhat Verification](https://docs.abs.xyz/build-on-abstract/smart-contracts/hardhat/verifying-contracts)
