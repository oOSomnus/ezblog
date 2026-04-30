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

  // A2-style post directory with images
  const imgDir = `${postsDir}/with-images`;
  mkdirSync(imgDir, { recursive: true });
  writeFileSync(`${imgDir}/index.md`, [
    "---",
    "title: Post With Images",
    "date: 2024-06-01",
    "---",
    "",
    "Look: ![](./demo.png)",
  ].join("\n"));
  writeFileSync(`${imgDir}/demo.png`, "fake-png-content");
  writeFileSync(`${imgDir}/photo.jpg`, "fake-jpg-content");
  writeFileSync(`${imgDir}/graphic.svg`, "<svg></svg>");
  writeFileSync(`${imgDir}/animated.gif`, "GIF89a");
  writeFileSync(`${imgDir}/modern.webp`, "RIFF....WEBP");

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

test("GET /posts/hello redirects to /posts/hello/ (trailing slash)", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);
  const res = await app.request("/posts/hello", { redirect: "manual" });

  expect(res.status).toBe(301);
  expect(res.headers.get("Location")).toBe("/posts/hello/");
});

test("GET /posts/hello/ returns post HTML", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);
  const res = await app.request("/posts/hello/");

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

test("serves whitelisted image extensions from content dir", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);

  // png
  let res = await app.request("/posts/with-images/demo.png");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("image/png");

  // jpg
  res = await app.request("/posts/with-images/photo.jpg");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("image/jpeg");

  // svg
  res = await app.request("/posts/with-images/graphic.svg");
  expect(res.status).toBe(200);

  // gif
  res = await app.request("/posts/with-images/animated.gif");
  expect(res.status).toBe(200);

  // webp
  res = await app.request("/posts/with-images/modern.webp");
  expect(res.status).toBe(200);
});

test("blocks non-image files: markdown source is not served", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);

  const res = await app.request("/posts/with-images/index.md");
  expect(res.status).toBe(404);
});

test("blocks non-whitelisted extensions", async () => {
  const { posts, indexPost, notFoundPost } = loadContent(tmpDir);
  const app = createApp(posts, indexPost, notFoundPost, config);

  const res = await app.request("/posts/with-images/hack.exe");
  expect(res.status).toBe(404);
});


