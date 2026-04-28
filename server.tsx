import { Hono } from "hono";
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
          <title>{props.title}</title>
          {props.description ? (
            <meta name="description" content={props.description} />
          ) : null}
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css"
          />
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
    const slug = path === "/" ? "" : path.slice(1);

    const post = posts.get(slug);
    if (post) {
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
