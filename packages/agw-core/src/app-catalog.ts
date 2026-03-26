export interface AgwSkillRef {
  id: string;
  title: string;
  description: string;
  installPath: string;
}

export interface AgwAppContractRef {
  address: string;
  label: string;
}

export interface AgwAppCatalogEntry {
  id: string;
  name: string;
  categories: string[];
  spotlight: boolean;
  verified: boolean;
  description: string;
  docsUrl?: string;
  skillRefs: string[];
  contracts: AgwAppContractRef[];
}

export const skillCatalog: readonly AgwSkillRef[] = [
  {
    id: "authenticating-with-agw",
    title: "Authenticating with AGW",
    description: "Bootstrap, inspect, and revoke AGW sessions using explicit approval and narrow field selection.",
    installPath: "skills/authenticating-with-agw",
  },
  {
    id: "reading-agw-wallet",
    title: "Reading AGW Wallet",
    description: "Use wallet and session reads with field trimming and pagination to stay within agent context budgets.",
    installPath: "skills/reading-agw-wallet",
  },
  {
    id: "executing-agw-transactions",
    title: "Executing AGW Transactions",
    description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
    installPath: "skills/executing-agw-transactions",
  },
  {
    id: "discovering-abstract-portal",
    title: "Discovering Abstract Portal",
    description: "Find apps, streams, and user profiles through Portal with response shaping for agent-safe reads.",
    installPath: "skills/discovering-abstract-portal",
  },
  {
    id: "trading-on-aborean",
    title: "Trading on Aborean",
    description: "Compose AGW core commands for Aborean Finance workflows without baking protocol logic into the CLI core.",
    installPath: "skills/trading-on-aborean",
  },
  {
    id: "trading-on-uniswap",
    title: "Trading on Uniswap",
    description: "Compose AGW contract commands for Uniswap V2 and V3 swaps, quotes, and liquidity on Abstract.",
    installPath: "skills/trading-on-uniswap",
  },
  {
    id: "managing-agent-identity",
    title: "Managing Agent Identity",
    description: "Register, inspect, and manage AI agent identity and reputation on Abstract via ERC-8004.",
    installPath: "skills/managing-agent-identity",
  },
  {
    id: "bridging-to-abstract",
    title: "Bridging to Abstract",
    description: "Guide users through bridging assets to/from Abstract via native bridge or third-party providers.",
    installPath: "skills/bridging-to-abstract",
  },
  {
    id: "building-on-abstract",
    title: "Building on Abstract",
    description: "Build, deploy, and integrate applications on Abstract with Foundry, Hardhat, AGW SDK, and paymasters.",
    installPath: "skills/building-on-abstract",
  },
  {
    id: "upvoting-on-abstract",
    title: "Upvoting on Abstract",
    description: "Vote for apps on the Abstract Portal using the on-chain AbstractVoting contract.",
    installPath: "skills/upvoting-on-abstract",
  },
  {
    id: "mining-with-bigcoin",
    title: "Mining with Bigcoin",
    description: "Interact with the Bigcoin virtual mining game — facilities, miners, rewards, and hashrate.",
    installPath: "skills/mining-with-bigcoin",
  },
];

export const appCatalog: readonly AgwAppCatalogEntry[] = [
  {
    id: "136",
    name: "Gacha",
    categories: ["Games of Chance", "Gaming"],
    spotlight: false,
    verified: true,
    description: "Onchain gacha mechanics and ticket purchase flows.",
    docsUrl: "https://gacha.gitbook.io/gacha",
    skillRefs: ["discovering-abstract-portal", "executing-agw-transactions"],
    contracts: [
      { address: "0x3272596F776470D2D7C3f7dfF3dc50888b7D8967", label: "Gacha" },
      { address: "0xe6765C9cb1B42D3CC36Fcd3D2B4fc938db456EaD", label: "Batch purchase" },
    ],
  },
  {
    id: "183",
    name: "Aborean Finance",
    categories: ["DeFi", "Lending"],
    spotlight: true,
    verified: true,
    description: "DeFi borrowing and collateral management flows on Abstract.",
    docsUrl: "https://aborean.finance",
    skillRefs: ["trading-on-aborean", "executing-agw-transactions", "reading-agw-wallet"],
    contracts: [
      { address: "0xC0F53703e9f4b79fA2FB09a2aeBA487FA97729c9", label: "Market" },
      { address: "0x4d8971D9932C1c0c16079722b3D93893F16Bb065", label: "Comptroller" },
      { address: "0xF6cDfFf7Ad51caaD860e7A35d6D4075d74039a6B", label: "Reward Distributor" },
    ],
  },
];

export function getSkillRef(skillId: string): AgwSkillRef | undefined {
  return skillCatalog.find(skill => skill.id === skillId);
}

export function listSkillRefs(skillIds: readonly string[]): AgwSkillRef[] {
  return skillIds.map(skillId => getSkillRef(skillId)).filter((skill): skill is AgwSkillRef => Boolean(skill));
}

export function getAppCatalogEntry(appId: string): AgwAppCatalogEntry | undefined {
  return appCatalog.find(app => app.id === appId);
}
