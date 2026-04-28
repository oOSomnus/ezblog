import { test, expect } from "bun:test";
import { generateFeed } from "./rss";
import type { Post } from "./content";
import type { Config } from "./config";

const config: Config = {
  site: { title: "My Blog", baseUrl: "https://blog.example.com" },
  server: { port: 3000 },
  content: { dir: "./content" },
};

test("generates valid Atom XML feed", () => {
  const posts: Post[] = [
    { slug: "posts/a", url: "/posts/a", title: "Post A", date: "2024-02-01", html: "" },
    { slug: "posts/b", url: "/posts/b", title: "Post B", date: "2024-01-01", html: "" },
    { slug: "posts/c", url: "/posts/c", title: "No Date Post", html: "" },
  ];

  const feed = generateFeed(posts, config);

  expect(feed).toContain('<?xml version="1.0"');
  expect(feed).toContain('<title>My Blog</title>');
  expect(feed).toContain('<link href="https://blog.example.com"/>');

  // Sorted by date descending: A before B
  const posA = feed.indexOf("Post A");
  const posB = feed.indexOf("Post B");
  expect(posA).toBeLessThan(posB);

  // Post without date is excluded
  expect(feed).not.toContain("No Date Post");
});
