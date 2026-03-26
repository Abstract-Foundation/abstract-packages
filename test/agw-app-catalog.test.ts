import fs from "node:fs";
import path from "node:path";
import { executeCommand } from "../packages/agw-cli/src/runtime.js";

describe("agw app catalog and shipped skills", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("lists live Portal apps merged with AGW skill metadata", async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              id: "136",
              name: "Gacha",
              description: "Live Gacha description",
            },
            {
              id: "999",
              name: "Unknown App",
              description: "Live-only app",
            },
          ],
          pagination: { page: 1, limit: 2, totalItems: 3, totalPages: 2 },
        }),
        { status: 200 },
      )) as unknown as typeof fetch;

    await expect(
      executeCommand("app.list", {
        pageSize: 2,
        fields: ["items.id", "items.name", "items.skillRefs", "nextCursor"],
      }),
    ).resolves.toEqual({
      outputMode: "ndjson",
      result: {
        items: [
          {
            id: "136",
            name: "Gacha",
            skillRefs: [
              {
                id: "discovering-abstract-portal",
                title: "Discovering Abstract Portal",
                description: "Find apps, streams, and user profiles through Portal with response shaping for agent-safe reads.",
                installPath: "skills/discovering-abstract-portal",
              },
              {
                id: "executing-agw-transactions",
                title: "Executing AGW Transactions",
                description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
                installPath: "skills/executing-agw-transactions",
              },
            ],
          },
          {
            id: "999",
            name: "Unknown App",
            skillRefs: [],
          },
        ],
        nextCursor: "2",
      },
    });
  });

  it("returns detailed app metadata for shipped protocol exemplars", async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          id: "183",
          name: "Aborean Finance",
          description: "Live Portal description",
          categories: ["DEX"],
          contracts: [
            { address: "0x1111111111111111111111111111111111111111", name: "Router" },
            { address: "0x2222222222222222222222222222222222222222", name: "Voter" },
          ],
        }),
        { status: 200 },
      )) as unknown as typeof fetch;

    await expect(
      executeCommand("app.show", {
        appId: "183",
      }),
    ).resolves.toEqual({
      outputMode: "json",
      result: {
        app: {
          id: "183",
          name: "Aborean Finance",
          categories: ["DeFi", "Lending"],
          spotlight: true,
          verified: true,
          description: "DeFi borrowing and collateral management flows on Abstract.",
          docsUrl: "https://aborean.finance",
          skillRefs: ["trading-on-aborean", "executing-agw-transactions", "reading-agw-wallet"],
          contracts: [
            { address: "0x1111111111111111111111111111111111111111", label: "Router" },
            { address: "0x2222222222222222222222222222222222222222", label: "Voter" },
          ],
        },
        skillRefs: [
          {
            id: "trading-on-aborean",
            title: "Trading on Aborean",
            description: "Compose AGW core commands for Aborean Finance workflows without baking protocol logic into the CLI core.",
            installPath: "skills/trading-on-aborean",
          },
          {
            id: "executing-agw-transactions",
            title: "Executing AGW Transactions",
            description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
            installPath: "skills/executing-agw-transactions",
          },
          {
            id: "reading-agw-wallet",
            title: "Reading AGW Wallet",
            description: "Use wallet and session reads with field trimming and pagination to stay within agent context budgets.",
            installPath: "skills/reading-agw-wallet",
          },
        ],
        live: {
          app: {
            id: "183",
            name: "Aborean Finance",
            description: "Live Portal description",
            categories: ["DEX"],
            contracts: [
              { address: "0x1111111111111111111111111111111111111111", name: "Router" },
              { address: "0x2222222222222222222222222222222222222222", name: "Voter" },
            ],
          },
        },
        meta: {
          portalStatus: "available",
          contractsSource: "portal",
        },
      },
    });
  });

  it("falls back to catalog metadata when Portal is unavailable", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("Portal API request timed out after 10000ms for /api/v1/app/183/");
    }) as unknown as typeof fetch;

    await expect(
      executeCommand("app.show", {
        appId: "183",
      }),
    ).resolves.toEqual({
      outputMode: "json",
      result: {
        app: {
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
        skillRefs: [
          {
            id: "trading-on-aborean",
            title: "Trading on Aborean",
            description: "Compose AGW core commands for Aborean Finance workflows without baking protocol logic into the CLI core.",
            installPath: "skills/trading-on-aborean",
          },
          {
            id: "executing-agw-transactions",
            title: "Executing AGW Transactions",
            description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
            installPath: "skills/executing-agw-transactions",
          },
          {
            id: "reading-agw-wallet",
            title: "Reading AGW Wallet",
            description: "Use wallet and session reads with field trimming and pagination to stay within agent context budgets.",
            installPath: "skills/reading-agw-wallet",
          },
        ],
        meta: {
          portalStatus: "unavailable",
          contractsSource: "catalog",
          portalError: "portal_timeout",
        },
      },
    });
  });

  it("supports offline mode for deterministic catalog-only reads", async () => {
    const fetchSpy = jest.fn(async () =>
      new Response(JSON.stringify({ id: "183", contracts: [] }), { status: 200 })) as unknown as typeof fetch;
    global.fetch = fetchSpy;

    await expect(
      executeCommand("app.show", {
        appId: "183",
        offline: true,
      }),
    ).resolves.toEqual({
      outputMode: "json",
      result: {
        app: {
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
        skillRefs: [
          {
            id: "trading-on-aborean",
            title: "Trading on Aborean",
            description: "Compose AGW core commands for Aborean Finance workflows without baking protocol logic into the CLI core.",
            installPath: "skills/trading-on-aborean",
          },
          {
            id: "executing-agw-transactions",
            title: "Executing AGW Transactions",
            description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
            installPath: "skills/executing-agw-transactions",
          },
          {
            id: "reading-agw-wallet",
            title: "Reading AGW Wallet",
            description: "Use wallet and session reads with field trimming and pagination to stay within agent context budgets.",
            installPath: "skills/reading-agw-wallet",
          },
        ],
        meta: {
          offline: true,
          portalStatus: "skipped",
          contractsSource: "catalog",
        },
      },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("ships the first-party skill files with the agw package", () => {
    const skillFiles = [
      "packages/agw-cli/skills/authenticating-with-agw/SKILL.md",
      "packages/agw-cli/skills/reading-agw-wallet/SKILL.md",
      "packages/agw-cli/skills/executing-agw-transactions/SKILL.md",
      "packages/agw-cli/skills/discovering-abstract-portal/SKILL.md",
      "packages/agw-cli/skills/trading-on-aborean/SKILL.md",
    ];

    for (const skillFile of skillFiles) {
      expect(fs.existsSync(path.join(process.cwd(), skillFile))).toBe(true);
    }
  });
});
