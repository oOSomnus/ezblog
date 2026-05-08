# ezblog

A zero-JavaScript, high-performance, one-command-deploy minimalist blog.

[中文](README.zh.md)

## Features

- **Zero client JS** — not a single `<script>` tag in the HTML sent to browsers
- **Markdown writing** — every page is a `.md` file; `git push` to publish
- **LaTeX math** — server-side KaTeX rendering, $x^2$ inline and $$...$$ block
- **In-memory rendering** — all Markdown is pre-parsed into memory at startup, zero IO per request
- **Docker Compose deploy** — Caddy auto-HTTPS included
- **RSS** — built-in Atom feed at `/feed.xml`

## Quick Start

```bash
# Local development
bun install
bun run index.ts
# → http://localhost:3000

# Docker Compose deploy (with HTTPS)
DOMAIN=blog.example.com docker compose up -d
```

## Directory Structure

Each post is a **directory** containing `index.md` plus its images:

```
content/
├── index.md              # Home page
├── 404.md                # 404 page
├── drafts/               # Drafts (not published)
└── posts/
    └── hello/
        ├── index.md      # Post content
        └── demo.svg      # Images live alongside the post
static/
└── favicon.svg           # Site-wide static assets
```

URL mirrors the directory path: `content/posts/hello/` → `/posts/hello/`

Post URLs use a trailing slash (`/posts/hello/`) so that relative image paths resolve correctly.
Requests without trailing slash get a **301 redirect** (`/posts/hello` → `/posts/hello/`).

### Images

Drop image files into the post directory, reference with relative path:

```markdown
![gopher](./gopher.png)
```

From `/posts/hello/`, `./gopher.png` resolves to `/posts/hello/gopher.png`.

Supported formats: `png`, `jpg`, `jpeg`, `webp`, `svg`, `gif`.
`.md` files and non-whitelisted extensions are blocked from direct access.
Images are served directly — no build step, no optimization pipeline.
Compress your images before adding them (e.g. with [Squoosh](https://squoosh.app)).
Relative image `src` paths are automatically converted to absolute URLs in the RSS feed.

### Math

Server-side KaTeX rendering, zero client JavaScript:

```markdown
Inline: $E=mc^2$

Block:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

Use `\$` to escape a literal dollar sign.
Invalid LaTeX prevents server startup with a clear error message.
RSS feed shows `$tex$` source text for readability.

## Post Format

```markdown
---
title: Post Title
date: 2024-01-01
description: Post description
---

## Body

Write Markdown. GFM supported.
```

## Front Matter

| Field | Description |
|-------|-------------|
| `title` | Post title |
| `date` | Publish date, used for RSS ordering |
| `description` | SEO description |

## Configuration

Edit `ezblog.config.yaml`:

```yaml
site:
  title: "My Blog"
  baseUrl: "https://your-domain.com"

server:
  port: 3000

content:
  dir: "./content"
```

When deploying with Docker Compose, this file and `content/` are mounted as volumes.

## Deploy

```bash
DOMAIN=blog.example.com docker compose up -d
```

Caddy automatically obtains HTTPS certificates and reverse-proxies to the blog service.

## Tech Stack

- [Bun](https://bun.sh) runtime
- [Hono](https://hono.dev) HTTP framework + JSX rendering
- [marked](https://marked.js.org) Markdown parsing
- [KaTeX](https://katex.org) server-side LaTeX rendering
- [YAML](https://yaml.org) front matter
- [water.css](https://watercss.kognise.dev) classless CSS
- [Caddy](https://caddyserver.com) reverse proxy + automatic HTTPS

## License

MIT
