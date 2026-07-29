import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildModule,
  deduplicate,
  filterAppOverlaps,
  parseExactRuleSet,
  readAdEntries,
  readAppAdEntries,
  readCnAdEntries,
  readEntries,
  readGamblingEntries,
  readImportedAppAdEntries,
  readImportedGlobalAdEntries,
  readNicheLocalAdEntries,
  readOverseasAdEntries,
  readTrackerEntries,
} from "./lib.mjs";
import { AUDITED_ALL_RULESET_PATH } from "./audited-list-policy.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = resolve(projectRoot, "blocklists/domains.csv");
const adListPath = resolve(projectRoot, "blocklists/ad-domains.txt");
const cnAdListPath = resolve(projectRoot, "blocklists/cn-ad-domains.txt");
const overseasAdListPath = resolve(
  projectRoot,
  "blocklists/overseas-ad-domains-100.txt",
);
const appAdCsvPath = resolve(projectRoot, "blocklists/app-ad-domains.csv");
const importedAppAdListPath = resolve(
  projectRoot,
  "blocklists/imported-app-ad-domains.txt",
);
const importedGlobalAdListPath = resolve(
  projectRoot,
  "blocklists/imported-global-ad-domains.txt",
);
const specialAppAdCsvPath = resolve(
  projectRoot,
  "blocklists/imported-special-app-ad-domains.csv",
);
const qqMusicExtraAppAdCsvPath = resolve(
  projectRoot,
  "blocklists/imported-qqmusic-extra-app-ad-domains.csv",
);
const nicheLocalAdListPath = resolve(
  projectRoot,
  "blocklists/imported-niche-local-ad-domains.txt",
);
const trackerListPath = resolve(
  projectRoot,
  "blocklists/imported-tracker-domains.txt",
);
const gamblingCsvPath = resolve(projectRoot, "blocklists/gambling-domains.csv");
const outputPath = resolve(projectRoot, "modules/rainyxin-web-guard.sgmodule");
const auditedRuleSetPath = resolve(projectRoot, AUDITED_ALL_RULESET_PATH);

const baseEntries = await readEntries(csvPath);
const adEntries = await readAdEntries(adListPath);
const cnAdEntries = await readCnAdEntries(cnAdListPath);
const overseasAdEntries = await readOverseasAdEntries(overseasAdListPath);
const gamblingEntries = await readGamblingEntries(gamblingCsvPath);
const appAdEntries = await readAppAdEntries(appAdCsvPath);
const importedAppAdEntries = await readImportedAppAdEntries(
  importedAppAdListPath,
);
const importedGlobalAdEntries = await readImportedGlobalAdEntries(
  importedGlobalAdListPath,
);
const specialAppAdEntries = await readAppAdEntries(specialAppAdCsvPath);
const qqMusicExtraAppAdEntries = await readAppAdEntries(
  qqMusicExtraAppAdCsvPath,
);
const nicheLocalAdEntries = await readNicheLocalAdEntries(
  nicheLocalAdListPath,
);
const trackerEntries = await readTrackerEntries(trackerListPath);
const auditedRuleDomains = parseExactRuleSet(
  await readFile(auditedRuleSetPath, "utf8"),
);
const silentEntries = deduplicate(
  [
    ...appAdEntries,
    ...importedAppAdEntries,
    ...specialAppAdEntries,
    ...qqMusicExtraAppAdEntries,
    ...trackerEntries,
  ],
  ({ domain }) => domain,
);
const unfilteredEntries = deduplicate([
  ...baseEntries,
  ...adEntries,
  ...cnAdEntries,
  ...overseasAdEntries,
  ...importedGlobalAdEntries,
  ...nicheLocalAdEntries,
  ...gamblingEntries,
]);
const entries = filterAppOverlaps(unfilteredEntries, silentEntries);
const activeCnAdEntries = filterAppOverlaps(cnAdEntries, silentEntries);
const activeImportedGlobalAdEntries = filterAppOverlaps(
  importedGlobalAdEntries,
  silentEntries,
);
const activeNicheLocalAdEntries = filterAppOverlaps(
  nicheLocalAdEntries,
  silentEntries,
);
const moduleText = buildModule(entries, silentEntries);

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
console.log(
  `全球广告增补 ${importedGlobalAdEntries.length} 条，` +
    `${activeImportedGlobalAdEntries.length} 条进入网页规则`,
);
console.log(
  `小众及港美本地广告 ${nicheLocalAdEntries.length} 条，` +
    `${activeNicheLocalAdEntries.length} 条进入网页规则`,
);
console.log(`其中包含 ${gamblingEntries.length} 个双源复核博彩域名`);
console.log(
  `已包含 ${
    appAdEntries.length +
    importedAppAdEntries.length +
    specialAppAdEntries.length +
    qqMusicExtraAppAdEntries.length
  } 条 App 广告来源规则`,
);
console.log(`已包含 ${trackerEntries.length} 条追踪器静默拒绝规则`);
console.log(`已引用 ${auditedRuleDomains.length} 条双源复核精确广告/追踪规则`);
console.log(`静默拒绝规则合计 ${silentEntries.length} 条`);
