import { Logger } from "../src/utils/logger.js";

describe("Logger", () => {
  it("creates child logger", () => {
    const logger = new Logger("root");
    const child = logger.child("child");
    expect(child).toBeInstanceOf(Logger);
  });
});
