import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildModule,
  deduplicate,
  filterAppOverlaps,
  readAdEntries,
  readAppAdEntries,
  readCnAdEntries,
  readEntries,
  readGamblingEntries,
  readOverseasAdEntries,
} from "./lib.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = resolve(projectRoot, "blocklists/domains.csv");
const adListPath = resolve(projectRoot, "blocklists/ad-domains.txt");
const cnAdListPath = resolve(projectRoot, "blocklists/cn-ad-domains.txt");
const overseasAdListPath = resolve(
  projectRoot,
  "blocklists/overseas-ad-domains-100.txt",
);
const appAdCsvPath = resolve(projectRoot, "blocklists/app-ad-domains.csv");
const gamblingCsvPath = resolve(projectRoot, "blocklists/gambling-domains.csv");
const outputPath = resolve(projectRoot, "modules/rainyxin-web-guard.sgmodule");

const baseEntries = await readEntries(csvPath);
const adEntries = await readAdEntries(adListPath);
const cnAdEntries = await readCnAdEntries(cnAdListPath);
const overseasAdEntries = await readOverseasAdEntries(overseasAdListPath);
const gamblingEntries = await readGamblingEntries(gamblingCsvPath);
const appAdEntries = await readAppAdEntries(appAdCsvPath);
const activeCnAdEntries = filterAppOverlaps(cnAdEntries, appAdEntries);
const entries = deduplicate([
  ...baseEntries,
  ...adEntries,
  ...activeCnAdEntries,
  ...overseasAdEntries,
  ...gamblingEntries,
]);
const moduleText = buildModule(entries, appAdEntries);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, moduleText, "utf8");

console.log(`已生成 ${outputPath}`);
console.log(`已包含 ${entries.length} 个域名`);
console.log(`其中包含 ${adEntries.length} 个本地导入广告域名`);
console.log(
  `国内广告清单 ${cnAdEntries.length} 条，` +
    `${activeCnAdEntries.length} 条进入网页规则，` +
    `${cnAdEntries.length - activeCnAdEntries.length} 条保留 App 静默语义`,
);
console.log(`其中包含 ${overseasAdEntries.length} 个双源复核海外广告域名`);
console.log(`其中包含 ${gamblingEntries.length} 个双源复核博彩域名`);
console.log(`已包含 ${appAdEntries.length} 条 App 广告静默拒绝规则`);
