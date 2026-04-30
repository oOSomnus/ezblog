import type { Post } from "./content";
import type { Config } from "./config";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
        return (
          `  <entry>\n` +
          `    <title>${esc(p.title)}</title>\n` +
          `    <link href="${baseUrl}${p.url}"/>\n` +
          `    <id>${baseUrl}${p.url}</id>\n` +
          `    <updated>${p.date}</updated>\n` +
          `    <summary>${esc(p.description || "")}</summary>\n` +
          `    <content type="html">${esc(absHtml)}</content>\n` +
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
