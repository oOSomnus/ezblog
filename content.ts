import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { parse as parseYaml } from "yaml";
import { marked } from "marked";

export interface Post {
  slug: string;
  url: string;
  title: string;
  date?: string;
  description?: string;
  html: string;
}

function parseFrontMatter(md: string): { fm: Record<string, any>; body: string } {
  if (!md.startsWith("---\n")) return { fm: {}, body: md };
  const end = md.indexOf("\n---\n", 4);
  if (end === -1) return { fm: {}, body: md };
  const yamlStr = md.slice(4, end);
  const body = md.slice(end + 5);
  return { fm: parseYaml(yamlStr) || {}, body };
}

function walk(dir: string, urlPrefix: string): Post[] {
  const results: Post[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const s = statSync(fullPath);
    if (s.isDirectory()) {
      if (entry === "drafts") continue;
      results.push(...walk(fullPath, urlPrefix + entry + "/"));
    } else if (extname(entry) === ".md") {
      const raw = readFileSync(fullPath, "utf-8");
      const { fm, body } = parseFrontMatter(raw);
      const html = marked.parse(body, { async: false }) as string;
      const baseName = entry.replace(".md", "");
      const slug = baseName === "index"
        ? urlPrefix.slice(0, -1) // strip trailing "/" from directory prefix
        : urlPrefix + baseName;
      results.push({
        slug,
        url: slug ? "/" + slug + "/" : "/",
        title: fm.title || baseName,
        date: fm.date,
        description: fm.description,
        html,
      });
    }
  }
  return results;
}

export function loadContent(dir: string): {
  posts: Map<string, Post>;
  indexPost: Post | null;
  notFoundPost: Post | null;
} {
  const all = walk(dir, "");
  const posts = new Map<string, Post>();
  let indexPost: Post | null = null;
  let notFoundPost: Post | null = null;

  for (const p of all) {
    if (p.slug === "") {
      indexPost = p;
    } else if (p.slug === "404") {
      notFoundPost = p;
    } else {
      posts.set(p.slug, p);
    }
  }
  return { posts, indexPost, notFoundPost };
}
