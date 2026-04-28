import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { loadContent } from "./content";

let tmpDir: string;

beforeAll(() => {
  tmpDir = `/tmp/ezblog-content-test-${Date.now()}`;
  mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

test("parses front matter and renders markdown to HTML", () => {
  const postsDir = `${tmpDir}/posts`;
  mkdirSync(postsDir, { recursive: true });

  writeFileSync(`${postsDir}/hello.md`, [
    "---",
    "title: Hello World",
    "date: 2024-01-15",
    "description: A test post",
    "---",
    "",
    "# Hello",
    "",
    "This is **bold** text.",
  ].join("\n"));

  const { posts } = loadContent(tmpDir);

  const post = posts.get("posts/hello");
  expect(post).toBeDefined();
  expect(post!.title).toBe("Hello World");
  expect(post!.date).toBe("2024-01-15");
  expect(post!.description).toBe("A test post");
  expect(post!.slug).toBe("posts/hello");
  expect(post!.url).toBe("/posts/hello");
  expect(post!.html).toContain("<h1>Hello</h1>");
  expect(post!.html).toContain("<strong>bold</strong>");
});

test("excludes drafts directory", () => {
  const draftsDir = `${tmpDir}/drafts`;
  mkdirSync(draftsDir, { recursive: true });
  writeFileSync(`${draftsDir}/secret.md`, [
    "---",
    "title: Draft",
    "---",
    "",
    "# Secret",
  ].join("\n"));

  const { posts } = loadContent(tmpDir);

  expect(posts.has("drafts/secret")).toBe(false);
});

test("maps index.md to indexPost, not posts map", () => {
  const indexPath = `${tmpDir}/index.md`;
  writeFileSync(indexPath, [
    "---",
    "title: Home",
    "---",
    "",
    "Welcome.",
  ].join("\n"));

  const { indexPost, posts } = loadContent(tmpDir);

  expect(indexPost).toBeDefined();
  expect(indexPost!.title).toBe("Home");
  expect(indexPost!.url).toBe("/");
  expect(posts.has("")).toBe(false);
});

test("maps 404.md to notFoundPost, not posts map", () => {
  const path404 = `${tmpDir}/404.md`;
  writeFileSync(path404, [
    "---",
    "title: Lost",
    "---",
    "",
    "Not here.",
  ].join("\n"));

  const { notFoundPost, posts } = loadContent(tmpDir);

  expect(notFoundPost).toBeDefined();
  expect(notFoundPost!.title).toBe("Lost");
  expect(posts.has("404")).toBe(false);
});
