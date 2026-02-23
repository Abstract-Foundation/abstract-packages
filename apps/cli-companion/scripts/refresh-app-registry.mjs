#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const outputPath = path.resolve(process.cwd(), "meta", "app-registry.seed.json");
const portalApiBase = "https://backend.portal.abs.xyz/api/contract/address";

const appSeeds = [
  {
    id: "12",
    name: "MYRIAD",
    contracts: ["0x4f4988A910f8aE9B3214149A8eA1F2E4e3Cd93CC"],
  },
  {
    id: "39",
    name: "Gigaverse",
    contracts: [
      "0xD24902E148cCF3e12CD7Fbb90a0428b62afabd95",
      "0x8C98B3a36C0d9e7893Eb848FDf5b4658aDFe0732",
      "0x57E8994e2Ac2e49974b0aE685C15b468d1C09259",
      "0x59EEC556cEf447E13eDf4BfD3D4433d8daD8a7a5",
      "0x74eb92b33f2400EB14F6D6725B14F76078d5E731",
      "0x7619a1716bA419A8440fEcF98068A15457634c60",
      "0x833AF8b667500FaA61D0f136F85865E506458Aa0",
      "0xB40468196610fC1060986F16438B4DE9F4530cC9",
      "0xF101f08880a6AcB31b041Aba7586D1C40F33D910",
    ],
  },
  {
    id: "136",
    name: "Gacha",
    contracts: [
      "0x3272596F776470D2D7C3f7dfF3dc50888b7D8967",
      "0xe6765C9cb1B42D3CC36Fcd3D2B4fc938db456EaD",
      "0xe90e33162d31004996F14ED6463EA1F610d4d3Ab",
    ],
  },
  {
    id: "183",
    name: "Aborean Finance",
    contracts: [
      "0xC0F53703e9f4b79fA2FB09a2aeBA487FA97729c9",
      "0x4d8971D9932C1c0c16079722b3D93893F16Bb065",
      "0xF6cDfFf7Ad51caaD860e7A35d6D4075d74039a6B",
    ],
  },
  {
    id: "213",
    name: "Maze of Gains",
    contracts: [
      "0x40018Cbb1926dae72DCb315E89AAB7320A191D02",
      "0xBDE2483b242C266a97E39826b2B5B3c06FC02916",
    ],
  },
];

async function fetchContractSummary(address) {
  let response = null;
  let lastStatus = "unknown";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(`${portalApiBase}/${address}`, {
      headers: {
        "user-agent": "agw-mcp-app-registry-refresh/1.0",
      },
    });
    lastStatus = String(response.status);

    if (response.ok) {
      break;
    }
    if (response.status !== 429 && response.status < 500) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
  }

  if (!response || !response.ok) {
    return {
      address,
      name: "Unknown",
      selectors: [],
      source: `portal-api-miss-${lastStatus}`,
    };
  }

  const payload = await response.json();
  const contract = payload.contract ?? {};
  const functions = Array.isArray(contract.functions) ? contract.functions : [];
  return {
    address,
    name: typeof contract.name === "string" ? contract.name : "Unknown",
    selectors: functions
      .filter(item => item && typeof item.selector === "string")
      .map(item => ({
        selector: item.selector,
        name: typeof item.name === "string" ? item.name : "Unknown",
      })),
    source: "portal-api",
  };
}

async function main() {
  const generatedAt = new Date().toISOString();
  const apps = [];

  for (const app of appSeeds) {
    const contracts = [];
    for (const address of app.contracts) {
      contracts.push(await fetchContractSummary(address));
    }
    apps.push({
      id: app.id,
      name: app.name,
      contracts,
    });
  }

  const output = {
    generatedAt,
    source: portalApiBase,
    apps,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${outputPath}\n`);
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
