import { readFileSync } from "fs";
import { parse } from "yaml";

export interface Config {
  site: { title: string; baseUrl: string };
  server: { port: number };
  content: { dir: string };
}

export function loadConfig(path: string): Config {
  return parse(readFileSync(path, "utf-8")) as Config;
}
