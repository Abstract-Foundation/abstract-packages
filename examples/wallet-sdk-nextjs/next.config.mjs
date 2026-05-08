import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The wallet-sdk dual-publishes ESM + CJS; Next.js can consume either.
  // Listed in `transpilePackages` for the same reason agw-nextjs lists its
  // workspace packages: keeps source maps + named imports working when the
  // workspace dep is in flight (pre-publish).
  transpilePackages: [
    "@abstract-foundation/agw-example-ui",
    "@abstract-foundation/wallet-sdk",
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@abstract-foundation/wallet-sdk$": path.join(
        __dirname,
        "../../packages/wallet-sdk/src/exports/index.ts",
      ),
      "@abstract-foundation/wallet-sdk/core$": path.join(
        __dirname,
        "../../packages/wallet-sdk/src/exports/core.ts",
      ),
    };
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
