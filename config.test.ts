import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { loadConfig } from "./config";

let tmpDir: string;

beforeAll(() => {
  tmpDir = `/tmp/ezblog-config-test-${Date.now()}`;
  mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

test("loads site config from yaml file", () => {
  writeFileSync(`${tmpDir}/ezblog.config.yaml`, [
    "site:",
    "  title: Test Blog",
    "  baseUrl: https://test.example.com",
    "server:",
    "  port: 4000",
    "content:",
    "  dir: ./my-content",
  ].join("\n"));

  const config = loadConfig(`${tmpDir}/ezblog.config.yaml`);

  expect(config.site.title).toBe("Test Blog");
  expect(config.site.baseUrl).toBe("https://test.example.com");
  expect(config.server.port).toBe(4000);
  expect(config.content.dir).toBe("./my-content");
});
