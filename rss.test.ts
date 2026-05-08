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

test("replaces KaTeX inline math with $tex$ in feed", () => {
  const posts: Post[] = [
    {
      slug: "posts/math",
      title: "Math Post",
      date: "2024-04-01",
      html: '<p>Einstein: <span data-tex="E=mc^2" class="katex"><span class="katex">...</span></span>.</p>',
    },
  ];

  const feed = generateFeed(posts, config);

  // Should contain the math source text, not KaTeX spans
  expect(feed).toContain("$E=mc^2$");
  expect(feed).not.toContain('class="katex"');
});

test("replaces KaTeX display math with $$tex$$ in feed", () => {
  const posts: Post[] = [
    {
      slug: "posts/math",
      title: "Display Math",
      date: "2024-04-01",
      html: '<p><span data-tex="x^2+y^2" data-display="true" class="katex"><span class="katex">...</span></span></p>',
    },
  ];

  const feed = generateFeed(posts, config);

  // Display math detected and wrapped in $$
  expect(feed).toContain("$$x^2+y^2$$");
  expect(feed).not.toContain('class="katex"');
});

test("preserves non-math content alongside math replacement", () => {
  const posts: Post[] = [
    {
      slug: "posts/mixed",
      title: "Mixed",
      date: "2024-04-01",
      html: '<p>Hello <span data-tex="x" class="katex"><span class="katex">...</span></span> world</p>',
    },
  ];

  const feed = generateFeed(posts, config);

  expect(feed).toContain("Hello $x$ world");
  expect(feed).not.toContain("katex");
});
