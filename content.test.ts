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
  expect(post!.url).toBe("/posts/hello/");
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

test("handles A2 directory structure: index.md inside post dir => slug has no trailing slash", () => {
  const postDir = `${tmpDir}/posts/with-images`;
  mkdirSync(postDir, { recursive: true });
  writeFileSync(`${postDir}/index.md`, [
    "---",
    "title: Post With Images",
    "date: 2024-06-01",
    "---",
    "",
    "Look at this: ![](./demo.png)",
  ].join("\n"));

  const { posts } = loadContent(tmpDir);

  const post = posts.get("posts/with-images");
  expect(post).toBeDefined();
  expect(post!.slug).toBe("posts/with-images");
  expect(post!.url).toBe("/posts/with-images/");
  expect(post!.slug).not.toEndWith("/");
});

test("ignores non-md files like images in post directory", () => {
  const postDir = `${tmpDir}/posts/with-images`;
  // create a dummy png to verify it is not parsed as a post
  writeFileSync(`${postDir}/demo.png`, "fake-png");
  // also create a subdirectory to ensure it doesn't break
  const subDir = `${postDir}/images`;
  mkdirSync(subDir, { recursive: true });
  writeFileSync(`${subDir}/photo.jpg`, "fake-jpg");

  const { posts } = loadContent(tmpDir);

  // Only the index.md should produce a post
  expect(posts.has("posts/with-images/index")).toBe(false);
  expect(posts.has("posts/with-images/demo")).toBe(false);
  expect(posts.has("posts/with-images")).toBe(true);
});
