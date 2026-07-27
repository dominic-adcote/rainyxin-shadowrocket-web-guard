import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALLOWED_CATEGORIES,
  BLOCK_PAGE_HOST,
  buildModule,
  readEntries,
} from "./lib.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = resolve(projectRoot, "blocklists/domains.csv");
const modulePath = resolve(projectRoot, "modules/rainyxin-web-guard.sgmodule");

const entries = await readEntries(csvPath);
const actual = await readFile(modulePath, "utf8");
const expected = buildModule(entries);

if (actual !== expected) {
  throw new Error("模组不是由当前清单生成的，请先运行 npm run build");
}

for (const category of ALLOWED_CATEGORIES) {
  if (entries.some((entry) => entry.category === category)) {
    const target = `category=${category}&source=shadowrocket`;
    if (!actual.includes(target)) {
      throw new Error(`模组缺少 ${category} 的跳转规则`);
    }
  }
}

if (actual.includes(`${BLOCK_PAGE_HOST},`) || actual.includes(`*.${BLOCK_PAGE_HOST}`)) {
  throw new Error("MITM 清单不得包含拦截页自身");
}

if (!actual.includes("[URL Rewrite]") || !actual.includes("[MITM]")) {
  throw new Error("模组缺少必要区段");
}

console.log(`校验通过：${entries.length} 个域名，${ALLOWED_CATEGORIES.length} 个类别`);
