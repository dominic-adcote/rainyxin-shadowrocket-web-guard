import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildModule, readAppAdEntries, readEntries } from "./lib.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = resolve(projectRoot, "blocklists/domains.csv");
const appAdCsvPath = resolve(projectRoot, "blocklists/app-ad-domains.csv");
const outputPath = resolve(projectRoot, "modules/rainyxin-web-guard.sgmodule");

const entries = await readEntries(csvPath);
const appAdEntries = await readAppAdEntries(appAdCsvPath);
const moduleText = buildModule(entries, appAdEntries);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, moduleText, "utf8");

console.log(`已生成 ${outputPath}`);
console.log(`已包含 ${entries.length} 个域名`);
console.log(`已包含 ${appAdEntries.length} 条 App 广告静默拒绝规则`);
