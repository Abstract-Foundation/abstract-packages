import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appNodeModules = path.join(__dirname, "node_modules");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@abstract-foundation/agw-example-ui",
    "@abstract-foundation/agw-thirdweb",
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      thirdweb$: path.join(appNodeModules, "thirdweb"),
      viem$: path.join(appNodeModules, "viem"),
    };
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
