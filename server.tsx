import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { raw } from "hono/html";
import type { Post } from "./content";
import type { Config } from "./config";
import { generateFeed } from "./rss";
import { KATEX_CSS } from "./latex";

function Layout(props: {
  title: string;
  description?: string;
  config: Config;
  children?: any;
  hasMath?: boolean;
}) {
  return (
    <>
      {raw("<!DOCTYPE html>\n")}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <title>{props.title}</title>
          {props.description ? (
            <meta name="description" content={props.description} />
          ) : null}
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css"
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Source+Serif+4:ital,wght@0,400..700;1,400..700&display=swap"
          />
          <style>
            {raw(`
              body {
                font-family: "Source Serif 4", "Noto Serif SC", Georgia, "Times New Roman", serif;
              }

              header h1 a,
              header h1 a:hover {
                color: #1a1a1a;
                text-decoration: none;
              }
            `)}
          </style>
          <link
            rel="alternate"
            type="application/atom+xml"
            title={props.config.site.title}
            href="/feed.xml"
          />
          {props.hasMath ? (
            <style>{raw(KATEX_CSS)}</style>
          ) : null}
        </head>
        <body>
          <header>
            <h1>
              <a href="/">{props.config.site.title}</a>
            </h1>
          </header>
          <main>{props.children}</main>
          <footer>
            <p>
              <a href="/feed.xml">RSS</a>
            </p>
            <hr />
            <p style="text-align:center">
              <small>
                Powered by <a href="https://github.com/oOSomnus/ezblog">ezblog</a>
              </small>
            </p>
          </footer>
        </body>
      </html>
    </>
  );
}

function renderPage(
  title: string,
  description: string | undefined,
  config: Config,
  bodyHtml: string,
  hasMath?: boolean,
): string {
  return (
    <Layout title={title} description={description} config={config} hasMath={hasMath}>
      {raw(bodyHtml)}
    </Layout>
  ).toString();
}

export function createApp(
  posts: Map<string, Post>,
  indexPost: Post | null,
  notFoundPost: Post | null,
  config: Config,
) {
  const app = new Hono();

  app.use("/favicon.*", serveStatic({ root: "./static" }));

  // Serve image files from content dir with extension whitelist
  const imgExts = ["png", "jpg", "jpeg", "webp", "svg", "gif"];
  app.use("*", async (c, next) => {
    const path = c.req.path;
    const ext = path.split(".").pop()?.toLowerCase();
    if (ext && imgExts.includes(ext)) {
      return serveStatic({ root: config.content.dir })(c, next);
    }
    await next();
  });

  // Pre-render and cache all pages at startup
  const cachedPages = new Map<string, string>();

  // Index page
  if (indexPost) {
    const pageTitle = `${indexPost.title} - ${config.site.title}`;
    cachedPages.set(
      "",
      renderPage(pageTitle, indexPost.description, config, indexPost.html, indexPost.hasMath),
    );
  }

  // Post pages
  for (const [slug, post] of posts) {
    const pageTitle = `${post.title} - ${config.site.title}`;
    const articleHtml = [
      "<article>",
      `<h1>${post.title}</h1>`,
      post.date ? `<time datetime="${post.date}">${post.date}</time>` : "",
      post.html,
      "</article>",
    ]
      .filter(Boolean)
      .join("\n");
    cachedPages.set(slug, renderPage(pageTitle, post.description, config, articleHtml, post.hasMath));
  }

  // 404 page
  const notFoundHtml = notFoundPost
    ? renderPage(`404 - ${config.site.title}`, undefined, config, notFoundPost.html)
    : renderPage(
        `404 - ${config.site.title}`,
        undefined,
        config,
        "<h1>404 Not Found</h1>",
      );

  // Empty index fallback
  const emptyIndexHtml = renderPage(
    config.site.title,
    undefined,
    config,
    "<p>No content yet.</p>",
  );

  // RSS feed (cached)
  const cachedFeed = generateFeed([...posts.values()], config);

  app.get("/feed.xml", (c) => {
    return c.body(cachedFeed, 200, {
      "Content-Type": "application/atom+xml; charset=utf-8",
    });
  });

  app.get("/", (c) => {
    const html = cachedPages.get("") || emptyIndexHtml;
    return c.html(html);
  });

  app.get("*", (c) => {
    const path = c.req.path;

    // Strip trailing slash for slug lookup
    let slug = path.slice(1);
    const hasTrailingSlash = slug.endsWith("/");
    if (hasTrailingSlash) slug = slug.slice(0, -1);

    const html = cachedPages.get(slug);
    if (html) {
      // Redirect to canonical trailing-slash URL so relative image paths resolve correctly
      if (!hasTrailingSlash) {
        return c.redirect(path + "/", 301);
      }
      return c.html(html);
    }

    c.status(404);
    return c.html(notFoundHtml);
  });

  return app;
}
