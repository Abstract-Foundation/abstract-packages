export interface AppSelectorDefinition {
  selector: `0x${string}`;
  label: string;
  enabledByDefault: boolean;
}

export interface AppContractDefinition {
  address: `0x${string}`;
  label: string;
  verified: boolean;
  abiRef?: string;
  selectors: AppSelectorDefinition[];
}

export interface AppRegistryEntry {
  id: string;
  name: string;
  categories: string[];
  spotlight: boolean;
  verified: boolean;
  candidateOnly?: boolean;
  description: string;
  docsUrl?: string;
  iconUrl?: string;
  bannerUrl?: string;
  contracts: AppContractDefinition[];
}

export const APP_REGISTRY: ReadonlyArray<AppRegistryEntry> = [
  {
    id: '12',
    name: 'MYRIAD',
    categories: ['Trading'],
    spotlight: true,
    verified: true,
    description: 'Prediction market trading on Abstract.',
    docsUrl: 'https://help.myriad.markets/developer-docs',
    iconUrl:
      'https://abstract-portal-metadata-prod.s3.amazonaws.com/icons/6e85b930-49b0-4d3f-99e5-911e6ea81e4b.png',
    bannerUrl:
      'https://abstract-portal-metadata-prod.s3.amazonaws.com/banners/e3ebbadc-4bb9-43d1-bbc5-5a9e59af737c.png',
    contracts: [
      {
        address: '0x4f4988A910f8aE9B3214149A8eA1F2E4e3Cd93CC',
        label: 'Prediction Market',
        verified: true,
        selectors: [
          { selector: '0x1281311d', label: 'Buy', enabledByDefault: true },
          { selector: '0x3620875e', label: 'Sell', enabledByDefault: true },
          { selector: '0x677bd9ff', label: 'Claim Winnings', enabledByDefault: true },
        ],
      },
    ],
  },
  {
    id: '136',
    name: 'Gacha',
    categories: ['Games of Chance', 'Gaming'],
    spotlight: false,
    verified: true,
    description: 'Onchain gacha mechanics and ticket purchase flows.',
    docsUrl: 'https://gacha.gitbook.io/gacha',
    iconUrl:
      'https://abstract-portal-metadata-prod.s3.amazonaws.com/63a30986-3a82-4874-8cbb-b59b6dcf1ade.png',
    bannerUrl:
      'https://abstract-portal-metadata-prod.s3.amazonaws.com/banners/d357cdba-7684-465b-a4dc-713ff238e397.png',
    contracts: [
      {
        address: '0x3272596F776470D2D7C3f7dfF3dc50888b7D8967',
        label: 'Gacha',
        verified: true,
        selectors: [
          { selector: '0x5d7a2f89', label: 'Purchase', enabledByDefault: true },
          { selector: '0x379607f5', label: 'Claim', enabledByDefault: true },
          { selector: '0x83a84ba9', label: 'Claim referral fees', enabledByDefault: true },
        ],
      },
      {
        address: '0xe6765C9cb1B42D3CC36Fcd3D2B4fc938db456EaD',
        label: 'Batch purchase',
        verified: true,
        selectors: [],
      },
      {
        address: '0xe90e33162d31004996F14ED6463EA1F610d4d3Ab',
        label: 'Ticket Drop',
        verified: true,
        selectors: [],
      },
    ],
  },
];

export function getRegistryAppById(appId: string): AppRegistryEntry | undefined {
  return APP_REGISTRY.find(app => app.id === appId);
}

export function listSpotlightApps(): AppRegistryEntry[] {
  return APP_REGISTRY.filter(app => app.spotlight);
}
