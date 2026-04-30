import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { raw } from "hono/html";
import type { Post } from "./content";
import type { Config } from "./config";
import { generateFeed } from "./rss";

function Layout(props: {
  title: string;
  description?: string;
  config: Config;
  children?: any;
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

  app.get("/feed.xml", (c) => {
    const feed = generateFeed([...posts.values()], config);
    return c.body(feed, 200, {
      "Content-Type": "application/atom+xml; charset=utf-8",
    });
  });

  app.get("/", (c) => {
    if (!indexPost) {
      return c.html(
        (
          <Layout title={config.site.title} config={config}>
            <p>No content yet.</p>
          </Layout>
        ).toString(),
      );
    }
    const pageTitle = `${indexPost.title} - ${config.site.title}`;
    return c.html(
      (
        <Layout
          title={pageTitle}
          description={indexPost.description}
          config={config}
        >
          {raw(indexPost.html)}
        </Layout>
      ).toString(),
    );
  });

  app.get("*", (c) => {
    const path = c.req.path;

    // Strip trailing slash for slug lookup
    let slug = path.slice(1);
    const hasTrailingSlash = slug.endsWith("/");
    if (hasTrailingSlash) slug = slug.slice(0, -1);

    const post = posts.get(slug);
    if (post) {
      // Redirect to canonical trailing-slash URL so relative image paths resolve correctly
      if (!hasTrailingSlash) {
        return c.redirect(path + "/", 301);
      }
      const pageTitle = `${post.title} - ${config.site.title}`;
      return c.html(
        (
          <Layout
            title={pageTitle}
            description={post.description}
            config={config}
          >
            <article>
              <h1>{post.title}</h1>
              {post.date ? (
                <time datetime={post.date}>{post.date}</time>
              ) : null}
              {raw(post.html)}
            </article>
          </Layout>
        ).toString(),
      );
    }

    c.status(404);
    if (notFoundPost) {
      return c.html(
        (
          <Layout
            title={`404 - ${config.site.title}`}
            config={config}
          >
            {raw(notFoundPost.html)}
          </Layout>
        ).toString(),
      );
    }
    return c.html(
      (
        <Layout title={`404 - ${config.site.title}`} config={config}>
          <h1>404 Not Found</h1>
        </Layout>
      ).toString(),
    );
  });

  return app;
}
