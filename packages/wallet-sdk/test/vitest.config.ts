import { join } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [join(__dirname, "./src/**/*.test.ts")],
  },
});
