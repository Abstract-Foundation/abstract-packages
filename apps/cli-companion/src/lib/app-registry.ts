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
    id: "136",
    name: "Gacha",
    categories: ["Games of Chance", "Gaming"],
    spotlight: false,
    verified: true,
    description: "Onchain gacha mechanics and ticket purchase flows.",
    docsUrl: "https://gacha.gitbook.io/gacha",
    iconUrl:
      "https://abstract-portal-metadata-prod.s3.amazonaws.com/63a30986-3a82-4874-8cbb-b59b6dcf1ade.png",
    bannerUrl:
      "https://abstract-portal-metadata-prod.s3.amazonaws.com/banners/d357cdba-7684-465b-a4dc-713ff238e397.png",
    contracts: [
      {
        address: "0x3272596F776470D2D7C3f7dfF3dc50888b7D8967",
        label: "Gacha",
        verified: true,
        selectors: [
          { selector: "0x5d7a2f89", label: "Purchase", enabledByDefault: true },
          { selector: "0x379607f5", label: "Claim", enabledByDefault: true },
          {
            selector: "0x83a84ba9",
            label: "Claim referral fees",
            enabledByDefault: true,
          },
        ],
      },
      {
        address: "0xe6765C9cb1B42D3CC36Fcd3D2B4fc938db456EaD",
        label: "Batch purchase",
        verified: true,
        selectors: [
          { selector: "0x4a5eafef", label: "Purchase", enabledByDefault: true },
        ],
      },
    ],
  },
];

export function getRegistryAppById(
  appId: string,
): AppRegistryEntry | undefined {
  return APP_REGISTRY.find((app) => app.id === appId);
}

export function listSpotlightApps(): AppRegistryEntry[] {
  return APP_REGISTRY.filter((app) => app.spotlight);
}
