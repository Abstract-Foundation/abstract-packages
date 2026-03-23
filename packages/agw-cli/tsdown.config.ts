import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  platform: "node",
  target: "node18",
  noExternal: ["@abstract-foundation/agw-client"],
  inlineOnly: false,
});
