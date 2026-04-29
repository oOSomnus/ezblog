import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { loadContent } from "./content";
import { createApp } from "./server";
import type { Config } from "./config";

let tmpDir: string;
let config: Config;

beforeAll(() => {
  tmpDir = `/tmp/ezblog-server-test-${Date.now()}`;
  mkdirSync(tmpDir, { recursive: true });

  const postsDir = `${tmpDir}/posts`;
  mkdirSync(postsDir, { recursive: true });

  writeFileSync(`${tmpDir}/index.md`, [
    "---",
    "title: Home",
    "description: Home page desc",
    "---",
    "",
    "# Welcome",
    "",
    "This is home.",
  ].join("\n"));

  writeFileSync(`${tmpDir}/404.md`, [
    "---",
    "title: Not Found",
    "---",
    "",
    "# 404",
    "",
    "Page missing.",
  ].join("\n"));

  writeFileSync(`${postsDir}/hello.md`, [
    "---",
    "title: Hello",
    "date: 2024-03-01",
    "description: A hello post",
    "---",
    "",
    "## Hello World",
    "",
    "Some content.",
  ].join("\n"));

  config = {
    site: { title: "Test Blog", baseUrl: "https://test.example.com" },
    server: { port: 0 },
    content: { dir: tmpDir },
  };
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

test("GET / returns index page HTML", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);
  const res = await app.request("/");

  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("<title>Home - Test Blog</title>");
  expect(html).toContain('<meta name="description" content="Home page desc"');
  expect(html).toContain("family=Noto+Serif+SC");
  expect(html).toContain('font-family: "Source Serif 4", "Noto Serif SC"');
  expect(html).toContain("header h1 a:hover");
  expect(html).toContain("text-decoration: none");
  expect(html).toContain("<h1>Welcome</h1>");
  expect(html).toContain("This is home.");
});

test("GET /posts/hello returns post HTML", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);
  const res = await app.request("/posts/hello");

  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("<title>Hello - Test Blog</title>");
  expect(html).toContain("<h2>Hello World</h2>");
});

test("GET /feed.xml returns Atom XML", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);
  const res = await app.request("/feed.xml");

  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toContain('<?xml version="1.0"');
  expect(text).toContain("<title>Hello</title>");
});

test("GET /nonexistent returns 404", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);
  const res = await app.request("/nonexistent");

  expect(res.status).toBe(404);
  const html = await res.text();
  expect(html).toContain("404");
});
