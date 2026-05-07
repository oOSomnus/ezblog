import { test, expect } from "bun:test";
import { generateFeed } from "./rss";
import type { Post } from "./content";
import type { Config } from "./config";

const config: Config = {
  site: { title: "My Blog", baseUrl: "https://blog.example.com" },
  server: { port: 3000 },
  content: { dir: "./content" },
};

test("generates valid Atom XML feed with full content", () => {
  const posts: Post[] = [
    { slug: "posts/a", title: "Post A", date: "2024-02-01", html: "<p>Content A</p>" },
    { slug: "posts/b", title: "Post B", date: "2024-01-01", html: "<p>Content B</p>" },
    { slug: "posts/c", title: "No Date Post", html: "" },
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

  // Each entry includes full content
  expect(feed).toContain('<content type="html">');
  expect(feed).toContain('&lt;p&gt;Content A&lt;/p&gt;');
});

test("converts relative img src to absolute URLs in feed", () => {
  const posts: Post[] = [
    {
      slug: "posts/with-images",
      title: "Image Post",
      date: "2024-03-01",
      html: '<p>Look:</p>\n<img src="./demo.png" alt="demo">\n<img src="./sub/photo.jpg">',
    },
  ];

  const feed = generateFeed(posts, config);

  // Quotes are escaped in XML content
  expect(feed).toContain(
    'src=&quot;https://blog.example.com/posts/with-images/demo.png&quot;',
  );
  expect(feed).toContain(
    'src=&quot;https://blog.example.com/posts/with-images/sub/photo.jpg&quot;',
  );
  // External URLs should not be touched
  expect(feed).not.toContain('src=&quot;https://blog.example.com/https://');
});
