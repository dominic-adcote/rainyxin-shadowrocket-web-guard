import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALLOWED_CATEGORIES,
  BLOCK_PAGE_HOST,
  buildModule,
  deduplicate,
  readAppAdEntries,
  readEntries,
  readGamblingEntries,
} from "./lib.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = resolve(projectRoot, "blocklists/domains.csv");
const appAdCsvPath = resolve(projectRoot, "blocklists/app-ad-domains.csv");
const gamblingCsvPath = resolve(projectRoot, "blocklists/gambling-domains.csv");
const modulePath = resolve(projectRoot, "modules/rainyxin-web-guard.sgmodule");
const readmePath = resolve(projectRoot, "README.md");

const baseEntries = await readEntries(csvPath);
const gamblingEntries = await readGamblingEntries(gamblingCsvPath);
const entries = deduplicate([...baseEntries, ...gamblingEntries]);
const appAdEntries = await readAppAdEntries(appAdCsvPath);
const actual = await readFile(modulePath, "utf8");
const readme = await readFile(readmePath, "utf8");
const expected = buildModule(entries, appAdEntries);

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

if (
  !actual.includes("[Rule]") ||
  !actual.includes("[URL Rewrite]") ||
  !actual.includes("[MITM]")
) {
  throw new Error("模组缺少必要区段");
}

for (const { match, domain } of appAdEntries) {
  const ruleType = match === "suffix" ? "DOMAIN-SUFFIX" : "DOMAIN";
  if (!actual.includes(`${ruleType},${domain},REJECT`)) {
    throw new Error(`模组缺少 App 广告拒绝规则：${domain}`);
  }
}

if (gamblingEntries.length !== 200) {
  throw new Error(`双源复核博彩域名必须恰好为 200 条，当前为 ${gamblingEntries.length} 条`);
}

const auditedAdCount = baseEntries.filter(
  ({ category, domain }) => category === "ads" && !domain.endsWith(".test"),
).length;
const readmeAuditPattern = new RegExp(
  `当前审核统计（\\d{4}-\\d{2}-\\d{2}）：网页广告域名 ${auditedAdCount} 条，` +
    `App 广告规则 ${appAdEntries.length} 条，博彩域名 ${gamblingEntries.length} 条。`,
);

if (!readmeAuditPattern.test(readme)) {
  throw new Error("README 审核统计未与当前广告及博彩清单同步");
}

console.log(
  `校验通过：${entries.length} 个网页域名，` +
    `${appAdEntries.length} 条 App 广告规则，` +
    `${ALLOWED_CATEGORIES.length} 个类别`,
);
