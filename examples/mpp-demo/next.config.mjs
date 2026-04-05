import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appNodeModules = path.join(__dirname, "node_modules");

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mppx", "hono"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      wagmi: path.join(appNodeModules, "wagmi"),
      viem: path.join(appNodeModules, "viem"),
      "@tanstack/react-query": path.join(
        appNodeModules,
        "@tanstack/react-query",
      ),
    };
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
