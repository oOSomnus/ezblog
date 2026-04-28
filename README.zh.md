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

```
content/
├── index.md         # 首页
├── 404.md           # 404 页面
├── drafts/          # 草稿（不发布）
└── posts/
    └── hello.md     # 文章
```

URL 和文件路径一一对应：`content/posts/hello.md` → `/posts/hello`

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
