import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // Integration tests share one physical MariaDB test database with no
    // per-file isolation (multiple files run `prisma.application.deleteMany()`
    // in beforeEach). Running test files in parallel lets one file's cleanup
    // race another file's in-flight fixtures, causing intermittent FK/record-
    // not-found failures. Force sequential file execution to remove the race.
    fileParallelism: false,
  },
});
