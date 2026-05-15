import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/tests/**/*.spec.ts"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  setupFilesAfterEnv: ["./tests/setup.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },
};

export default config;
