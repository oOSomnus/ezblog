# ezblog

零 JavaScript、高性能、一条命令部署的极简博客。

[English](README.md)

## 特点

- **零客户端 JS**——浏览器收到的 HTML 里没有一个 `<script>` 标签
- **Markdown 写作**——全部页面都是 `.md` 文件，`git push` 即发布
- **全内存渲染**——启动时预解析全部 Markdown 到内存，请求时零 IO
- **Docker Compose 一键部署**——含 Caddy 自动 HTTPS
- **RSS**——内置 Atom feed，`/feed.xml`

## 快速开始

```bash
# 本地开发
bun install
bun run index.ts
# → http://localhost:3000

# Docker Compose 部署（含 HTTPS）
DOMAIN=blog.example.com docker compose up -d
```

## 目录结构

每篇文章是一个**目录**，包含 `index.md` 和它的图片：

```
content/
├── index.md              # 首页
├── 404.md                # 404 页面
├── drafts/               # 草稿（不发布）
└── posts/
    └── hello/
        ├── index.md      # 文章内容
        └── demo.svg      # 图片和文章放在一起
static/
└── favicon.svg           # 站点级静态资源
```

URL 与目录路径一一对应：`content/posts/hello/` → `/posts/hello/`

文章 URL 带尾斜杠（`/posts/hello/`），确保相对路径图片解析正确。
无尾斜杠的请求会自动 **301 重定向**（`/posts/hello` → `/posts/hello/`）。

### 图片

把图片文件放入文章目录，用相对路径引用：

```markdown
![gopher](./gopher.png)
```

从 `/posts/hello/` 访问时，`./gopher.png` 解析为 `/posts/hello/gopher.png`。

支持的格式：`png`、`jpg`、`jpeg`、`webp`、`svg`、`gif`。
`.md` 源文件和非法扩展名会被拦截，无法直接访问。
图片直接提供，无构建步骤，无优化管线。
添加图片前先压缩（推荐 [Squoosh](https://squoosh.app)）。
RSS feed 中相对路径图片 `src` 会自动转为绝对 URL。

## 文章格式

```markdown
---
title: 文章标题
date: 2024-01-01
description: 文章描述
---

## 正文

写 Markdown，支持 GFM。
```

## Front Matter

| 字段 | 说明 |
|------|------|
| `title` | 文章标题 |
| `date` | 发布日期，用于 RSS 排序 |
| `description` | SEO description |

## 配置

编辑 `ezblog.config.yaml`：

```yaml
site:
  title: "你的博客名"
  baseUrl: "https://你的域名.com"

server:
  port: 3000

content:
  dir: "./content"
```

Docker Compose 部署时自动挂载此文件和 `content/` 目录。

## 部署

```bash
DOMAIN=blog.example.com docker compose up -d
```

Caddy 自动申请 HTTPS 证书并反向代理到博客服务。

## 技术栈

- [Bun](https://bun.sh) 运行时
- [Hono](https://hono.dev) HTTP 框架 + JSX 渲染
- [marked](https://marked.js.org) Markdown 解析
- [YAML](https://yaml.org) front matter
- [water.css](https://watercss.kognise.dev) 无 class CSS
- [Caddy](https://caddyserver.com) 反向代理 + 自动 HTTPS

## License

MIT
