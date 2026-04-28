import { loadConfig } from "./config";
import { loadContent } from "./content";
import { createApp } from "./server.tsx";

const configPath = process.env.EZBLOG_CONFIG || "ezblog.config.yaml";
const config = loadConfig(configPath);
const { posts, indexPost, notFoundPost } = loadContent(config.content.dir);
const app = createApp(posts, indexPost, notFoundPost, config);

export default {
  port: config.server.port,
  fetch: app.fetch,
};
