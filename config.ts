import { readFileSync } from "fs";
import { parse } from "yaml";

export interface Config {
  site: { title: string; baseUrl: string };
  server: { port: number };
  content: { dir: string };
}

export function loadConfig(path: string): Config {
  const raw = readFileSync(path, "utf-8");
  return parse(raw) as Config;
}
