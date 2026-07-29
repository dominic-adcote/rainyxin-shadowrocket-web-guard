import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALLOWED_CATEGORIES,
  BLOCK_PAGE_HOST,
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
import {
  AUDITED_ALL_RULESET_PATH,
  AUDITED_ALL_RULESET_URL,
  CN_AD_CDN_RULESET_PATH,
  CN_AD_CDN_RULESET_URL,
  isDomainOrChildOf,
  isCnProtectedDomain,
  isCnSensitiveDomain,
  isProtectedDomain,
} from "./audited-list-policy.mjs";

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
const modulePath = resolve(projectRoot, "modules/rainyxin-web-guard.sgmodule");
const readmePath = resolve(projectRoot, "README.md");
const auditedRuleSetPath = resolve(projectRoot, AUDITED_ALL_RULESET_PATH);
const auditedReportPath = resolve(
  projectRoot,
  "blocklists/audited-all-ad-tracking.audit.json",
);
const cnAdCdnRuleSetPath = resolve(projectRoot, CN_AD_CDN_RULESET_PATH);
const cnAdCdnReportPath = resolve(
  projectRoot,
  "blocklists/cn-ad-cdn-2000.audit.json",
);
const rulesetSha256 = (text) =>
  createHash("sha256")
    .update(text.replace(/\r\n/g, "\n"), "utf8")
    .digest("hex");

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
const actual = await readFile(modulePath, "utf8");
const readme = await readFile(readmePath, "utf8");
const auditedRuleSetText = await readFile(auditedRuleSetPath, "utf8");
const auditedRuleDomains = parseExactRuleSet(auditedRuleSetText);
const auditedRuleDomainSet = new Set(auditedRuleDomains);
const auditedReport = JSON.parse(await readFile(auditedReportPath, "utf8"));
const cnAdCdnRuleSetText = await readFile(cnAdCdnRuleSetPath, "utf8");
const cnAdCdnRuleDomains = parseExactRuleSet(cnAdCdnRuleSetText);
const cnAdCdnReport = JSON.parse(await readFile(cnAdCdnReportPath, "utf8"));
const expected = buildModule(entries, silentEntries);

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

if (
  !actual.includes(`RULE-SET,${AUDITED_ALL_RULESET_URL},REJECT`)
) {
  throw new Error("模组缺少双源复核广告与追踪器远程规则集");
}
if (!actual.includes(`RULE-SET,${CN_AD_CDN_RULESET_URL},REJECT`)) {
  throw new Error("模组缺少双来源审核中国广告/CDN 远程规则集");
}

if (
  actual.includes("x-ad-cleaner.js") ||
  ["api.twitter.com", "api.x.com", "twitter.com", "x.com"].some((hostname) =>
    actual
      .split("\n")
      .find((line) => line.startsWith("hostname = "))
      ?.split(/,\s*/)
      .includes(hostname),
  )
) {
  throw new Error("X 修复版不得启用响应清理器或 X/Twitter MITM 主机");
}

const auditedRuleSetSha256 = rulesetSha256(auditedRuleSetText);
if (
  auditedRuleDomains.length !== auditedReport.acceptedExactDomains ||
  auditedRuleSetSha256 !== auditedReport.rulesetSha256
) {
  throw new Error("双源复核规则集数量或 SHA-256 与审核报告不一致");
}
if (auditedRuleDomains.some(isProtectedDomain)) {
  throw new Error("双源复核规则集包含受保护的第一方或基础设施域名");
}
for (const domain of auditedRuleDomains) {
  const coveredByWeb = unfilteredEntries.some(({ domain: existing }) =>
    isDomainOrChildOf(domain, existing),
  );
  const coveredBySilent = silentEntries.some(({ domain: existing, match }) =>
    match === "suffix"
      ? isDomainOrChildOf(domain, existing)
      : domain === existing,
  );
  if (coveredByWeb || coveredBySilent) {
    throw new Error(`双源复核规则集包含已覆盖域名：${domain}`);
  }
}

const cnAdCdnRuleSetSha256 = rulesetSha256(cnAdCdnRuleSetText);
if (
  cnAdCdnRuleDomains.length !== 2000 ||
  cnAdCdnRuleDomains.length !== cnAdCdnReport.targetCount ||
  cnAdCdnRuleDomains.length !== cnAdCdnReport.selectedExactDomains ||
  cnAdCdnRuleSetSha256 !== cnAdCdnReport.rulesetSha256
) {
  throw new Error("中国广告/CDN 规则集数量或 SHA-256 与审核报告不一致");
}
if (
  cnAdCdnRuleDomains.some(
    (domain) =>
      isCnProtectedDomain(domain) || isCnSensitiveDomain(domain),
  )
) {
  throw new Error("中国广告/CDN 规则集包含受保护或敏感功能域名");
}
if (cnAdCdnRuleDomains.some((domain) => auditedRuleDomainSet.has(domain))) {
  throw new Error("中国广告/CDN 规则集与既有双源复核规则重复");
}
for (const domain of cnAdCdnRuleDomains) {
  const coveredByWeb = unfilteredEntries.some(({ domain: existing }) =>
    isDomainOrChildOf(domain, existing),
  );
  const coveredBySilent = silentEntries.some(({ domain: existing, match }) =>
    match === "suffix"
      ? isDomainOrChildOf(domain, existing)
      : domain === existing,
  );
  if (coveredByWeb || coveredBySilent) {
    throw new Error(`中国广告/CDN 规则集包含已覆盖域名：${domain}`);
  }
}
const cnAdCdnCdnCount = cnAdCdnRuleDomains.filter((domain) =>
  /cdn/i.test(domain),
).length;
const cnAdCdnCnCount = cnAdCdnRuleDomains.filter((domain) =>
  domain.endsWith(".cn"),
).length;
if (
  cnAdCdnCdnCount < 300 ||
  cnAdCdnCnCount < 650 ||
  cnAdCdnReport.selectedCdnSemantic !== cnAdCdnCdnCount ||
  cnAdCdnReport.selectedCnTld !== cnAdCdnCnCount ||
  cnAdCdnReport.selectedDualSource + cnAdCdnReport.selectedSingleSource !==
    cnAdCdnRuleDomains.length ||
  cnAdCdnReport.selectedDualSource < 1400
) {
  throw new Error("中国广告/CDN 规则集分类数量与审核报告不一致");
}

for (const { match, domain } of silentEntries) {
  const ruleType = match === "suffix" ? "DOMAIN-SUFFIX" : "DOMAIN";
  if (!actual.includes(`${ruleType},${domain},REJECT`)) {
    throw new Error(`模组缺少静默拒绝规则：${domain}`);
  }
}

if (gamblingEntries.length !== 200) {
  throw new Error(`双源复核博彩域名必须恰好为 200 条，当前为 ${gamblingEntries.length} 条`);
}

if (adEntries.length !== 200) {
  throw new Error(`本地导入广告域名必须恰好为 200 条，当前为 ${adEntries.length} 条`);
}

if (cnAdEntries.length !== 333 || activeCnAdEntries.length !== 150) {
  throw new Error(
    `国内广告清单应为 333 条，其中 150 条进入网页规则；` +
      `当前为 ${cnAdEntries.length}/${activeCnAdEntries.length}`,
  );
}

if (overseasAdEntries.length !== 100) {
  throw new Error(
    `双源复核海外广告域名必须恰好为 100 条，当前为 ${overseasAdEntries.length} 条`,
  );
}

if (importedAppAdEntries.length !== 286) {
  throw new Error(
    `用户提供的 App 广告净新增清单必须恰好为 286 条，当前为 ${importedAppAdEntries.length}`,
  );
}

if (importedGlobalAdEntries.length !== 525) {
  throw new Error(
    `用户提供的全球广告净新增清单必须恰好为 525 条，当前为 ${importedGlobalAdEntries.length}`,
  );
}

if (specialAppAdEntries.length !== 43) {
  throw new Error(
    `QQ 音乐、京东和墨迹天气专项 App 广告净新增清单必须恰好为 43 条，当前为 ${specialAppAdEntries.length}`,
  );
}

if (specialAppAdEntries.some(({ match }) => match !== "exact")) {
  throw new Error("专项 App 广告主机必须全部使用 exact，禁止扩大到第一方根域");
}

if (qqMusicExtraAppAdEntries.length !== 17) {
  throw new Error(
    `QQ 音乐补充 App 广告净新增清单必须恰好为 17 条，当前为 ${qqMusicExtraAppAdEntries.length}`,
  );
}

if (qqMusicExtraAppAdEntries.some(({ match }) => match !== "exact")) {
  throw new Error("QQ 音乐补充 App 广告主机必须全部使用 exact");
}

if (
  nicheLocalAdEntries.length !== 159 ||
  activeNicheLocalAdEntries.length !== 159
) {
  throw new Error(
    `小众及港美本地广告净新增清单应为 159 条且全部进入网页规则；` +
      `当前为 ${nicheLocalAdEntries.length}/${activeNicheLocalAdEntries.length}`,
  );
}

if (trackerEntries.length !== 500) {
  throw new Error(
    `用户提供的追踪器清单必须恰好为 500 条，当前为 ${trackerEntries.length}`,
  );
}

const auditedAdCount = baseEntries.filter(
  ({ category, domain }) => category === "ads" && !domain.endsWith(".test"),
).length +
  adEntries.length +
  activeCnAdEntries.length +
  overseasAdEntries.length +
  activeImportedGlobalAdEntries.length +
  activeNicheLocalAdEntries.length;
const appAdRuleCount =
  appAdEntries.length +
  importedAppAdEntries.length +
  specialAppAdEntries.length +
  qqMusicExtraAppAdEntries.length;
const readmeAuditPattern = new RegExp(
  `当前审核统计（\\d{4}-\\d{2}-\\d{2}）：网页广告域名 ${auditedAdCount} 条，` +
    `App 广告来源规则 ${appAdRuleCount} 条，追踪器规则 ${trackerEntries.length} 条，` +
    `博彩域名 ${gamblingEntries.length} 条。`,
);

if (!readmeAuditPattern.test(readme)) {
  throw new Error("README 审核统计未与当前广告及博彩清单同步");
}
if (
  !readme.includes(
    `双源复核精确广告/追踪域名 ${auditedRuleDomains.length} 条`,
  )
) {
  throw new Error("README 未同步双源复核精确广告/追踪域名统计");
}
if (
  !readme.includes(
    `双来源审核中国广告/CDN 精确域名 ${cnAdCdnRuleDomains.length} 条`,
  )
) {
  throw new Error("README 未同步双来源审核中国广告/CDN 精确域名统计");
}

console.log(
  `校验通过：${entries.length} 个网页域名，` +
    `${silentEntries.length} 条静默拒绝规则，` +
    `${auditedRuleDomains.length} 条双源复核精确规则，` +
    `${cnAdCdnRuleDomains.length} 条中国广告/CDN 精确规则，` +
    `${ALLOWED_CATEGORIES.length} 个类别`,
);
