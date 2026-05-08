import type { Post } from "./content";
import { postUrl } from "./content";
import type { Config } from "./config";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Regex to find opening of KaTeX wrapper spans
const KATEX_OPEN_RE = /<span data-tex="([^"]*)"( data-display="true")? class="katex">/g;

// Replace KaTeX spans with plaintext tex source for RSS readers.
// Uses depth tracking to correctly match nested <span>/
// closures since KaTeX output contains deeply nested spans.
function stripMath(html: string): string {
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = KATEX_OPEN_RE.exec(html)) !== null) {
    const tex = match[1];
    const isDisplay = !!match[2];

    // Push everything before this span
    parts.push(html.slice(lastIndex, match.index));

    // Find the matching outer </span> by counting depth
    let depth = 1;
    let pos = KATEX_OPEN_RE.lastIndex;
    const spanTagRe = /<\/span>|<span[^>]*>/g;

    while (depth > 0 && pos < html.length) {
      spanTagRe.lastIndex = pos;
      const nextTag = spanTagRe.exec(html);
      if (!nextTag) break;

      if (nextTag[0] === "</span>") {
        depth--;
      } else {
        depth++;
      }
      pos = spanTagRe.lastIndex;
    }

    // Append tex source
    parts.push(isDisplay ? `$$${tex}$$` : `$${tex}$`);

    KATEX_OPEN_RE.lastIndex = pos;
    lastIndex = pos;
  }

  parts.push(html.slice(lastIndex));
  return parts.join("");
}

export function generateFeed(posts: Post[], config: Config): string {
  const baseUrl = config.site.baseUrl;

  const dated = posts
    .filter((p) => p.date)
    .sort(
      (a, b) =>
        new Date(b.date!).getTime() - new Date(a.date!).getTime(),
    );

  const entries = dated
    .map(
      (p) => {
      // Convert relative img src to absolute URLs
        const absHtml = p.html.replace(
          /src="\.\//g,
          `src="${baseUrl}/${p.slug}/`,
        );
        // Strip KaTeX spans for RSS readability
        const feedHtml = stripMath(absHtml);
        return (
          `  <entry>\n` +
          `    <title>${esc(p.title)}</title>\n` +
          `    <link href="${baseUrl}${postUrl(p.slug)}"/>\n` +
          `    <id>${baseUrl}${postUrl(p.slug)}</id>\n` +
          `    <updated>${p.date}</updated>\n` +
          `    <summary>${esc(p.description || "")}</summary>\n` +
          `    <content type="html">${esc(feedHtml)}</content>\n` +
          `  </entry>`
        );
      },
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${esc(config.site.title)}</title>`,
    `  <link href="${config.site.baseUrl}"/>`,
    `  <id>${config.site.baseUrl}/</id>`,
    `  <updated>${new Date().toISOString()}</updated>`,
    entries,
    "</feed>",
  ].join("\n");
}
