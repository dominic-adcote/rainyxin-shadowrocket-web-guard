import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DOMAIN_PATTERN,
  deduplicate,
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
  CN_AD_CDN_RULESET_PATH,
  isCnProtectedDomain,
  isCnSensitiveDomain,
} from "./audited-list-policy.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_COUNT = 2000;
const CHINA_RELEVANT_TARGET = 800;
const CDN_TARGET = 300;
const ANTI_AD_URL =
  "https://raw.githubusercontent.com/privacy-protection-tools/anti-AD/master/anti-ad-domains.txt";
const ADRULES_URL =
  "https://raw.githubusercontent.com/Cats-Team/AdRules/main/adrules_domainset.txt";

const CHINA_PLATFORM_PATTERN =
  /(?:^|[.-])(?:163|360|58|alicdn|alimama|baidu|bdstatic|bilibili|bytedance|douyin|gdt|huawei|iqiyi|jd|kuaishou|meituan|miui|netease|oceanengine|oppo|pangle|pangolin|pinduoduo|qq|qiyi|sina|snssdk|sogou|sohu|taobao|tencent|toutiao|uc|umeng|vivo|wechat|weibo|weixin|xiaomi|youdao|youku|zhihu)(?:[.-]|$)/i;
const AD_PATTERN =
  /(?:^|[.-])(?:ad|ads|adcdn|adserver|advert|banner|cpro|dsp|gdt|imp|rtb|splash|ssp|tanx|union)(?:[.-]|$)/i;
const TRACKING_PATTERN =
  /(?:^|[.-])(?:analytics|beacon|click|collect|log|pixel|report|stat|track|tracker|tracking)(?:[.-]|$)/i;
const CDN_PATTERN = /cdn/i;
const MULTI_LABEL_SUFFIXES = new Set([
  "com.cn",
  "net.cn",
  "org.cn",
  "gov.cn",
  "com.hk",
  "com.tw",
]);

const sha256 = (text) =>
  createHash("sha256").update(text, "utf8").digest("hex");

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "Adcote-Web-Guard-Auditor/1.0" },
  });
  if (!response.ok) {
    throw new Error(`下载核验源失败：${url} (${response.status})`);
  }
  return response.text();
};

const parseAntiAd = (text) =>
  new Set(
    text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase().replace(/\.$/, ""))
      .filter((domain) => DOMAIN_PATTERN.test(domain)),
  );

const parseAdRules = (text) =>
  new Set(
    text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) =>
        line.trim().toLowerCase().replace(/^\+\./, "").replace(/\.$/, ""),
      )
      .filter((domain) => DOMAIN_PATTERN.test(domain)),
  );

const readExistingEntries = async () => {
  const blocklists = (name) => resolve(projectRoot, "blocklists", name);
  const webEntries = deduplicate([
    ...(await readEntries(blocklists("domains.csv"))),
    ...(await readAdEntries(blocklists("ad-domains.txt"))),
    ...(await readCnAdEntries(blocklists("cn-ad-domains.txt"))),
    ...(await readOverseasAdEntries(blocklists("overseas-ad-domains-100.txt"))),
    ...(await readImportedGlobalAdEntries(
      blocklists("imported-global-ad-domains.txt"),
    )),
    ...(await readNicheLocalAdEntries(
      blocklists("imported-niche-local-ad-domains.txt"),
    )),
    ...(await readGamblingEntries(blocklists("gambling-domains.csv"))),
  ]);
  const silentEntries = deduplicate(
    [
      ...(await readAppAdEntries(blocklists("app-ad-domains.csv"))),
      ...(await readImportedAppAdEntries(
        blocklists("imported-app-ad-domains.txt"),
      )),
      ...(await readAppAdEntries(
        blocklists("imported-special-app-ad-domains.csv"),
      )),
      ...(await readAppAdEntries(
        blocklists("imported-qqmusic-extra-app-ad-domains.csv"),
      )),
      ...(await readTrackerEntries(
        blocklists("imported-tracker-domains.txt"),
      )),
    ],
    ({ domain }) => domain,
  );
  const auditedExactDomains = new Set(
    parseExactRuleSet(
      await readFile(resolve(projectRoot, AUDITED_ALL_RULESET_PATH), "utf8"),
    ),
  );
  return {
    webSuffixDomains: new Set(webEntries.map(({ domain }) => domain)),
    silentSuffixDomains: new Set(
      silentEntries
        .filter(({ match }) => match === "suffix")
        .map(({ domain }) => domain),
    ),
    silentExactDomains: new Set(
      silentEntries
        .filter(({ match }) => match !== "suffix")
        .map(({ domain }) => domain),
    ),
    auditedExactDomains,
  };
};

const isDomainOrChildOfAny = (domain, suffixes) => {
  const labels = domain.split(".");
  for (let index = 0; index < labels.length - 1; index += 1) {
    if (suffixes.has(labels.slice(index).join("."))) return true;
  }
  return false;
};

const isAlreadyCovered = (domain, existing) =>
  isDomainOrChildOfAny(domain, existing.webSuffixDomains) ||
  isDomainOrChildOfAny(domain, existing.silentSuffixDomains) ||
  existing.silentExactDomains.has(domain) ||
  existing.auditedExactDomains.has(domain);

const scoreDomain = (domain) => {
  let score = 0;
  if (domain.endsWith(".cn")) score += 120;
  if (CHINA_PLATFORM_PATTERN.test(domain)) score += 90;
  if (AD_PATTERN.test(domain)) score += 70;
  if (CDN_PATTERN.test(domain)) score += 55;
  if (TRACKING_PATTERN.test(domain)) score += 45;
  if (domain.split(".").length >= 3) score += 5;
  return score;
};

const rootGroup = (domain) => {
  const labels = domain.split(".");
  if (labels.length < 3) return domain;
  const lastTwo = labels.slice(-2).join(".");
  return MULTI_LABEL_SUFFIXES.has(lastTwo)
    ? labels.slice(-3).join(".")
    : lastTwo;
};

const selectDiverse = (candidates, count) => {
  const groups = new Map();
  for (const domain of candidates) {
    const key = rootGroup(domain);
    const group = groups.get(key) ?? [];
    group.push(domain);
    groups.set(key, group);
  }

  const orderedGroups = [...groups.entries()]
    .map(([key, domains]) => ({
      key,
      domains: domains.sort(
        (left, right) =>
          scoreDomain(right) - scoreDomain(left) ||
          left.localeCompare(right),
      ),
    }))
    .sort(
      (left, right) =>
        scoreDomain(right.domains[0]) - scoreDomain(left.domains[0]) ||
        left.key.localeCompare(right.key),
    );

  const selected = [];
  for (let index = 0; selected.length < count; index += 1) {
    let added = false;
    for (const group of orderedGroups) {
      if (group.domains[index]) {
        selected.push(group.domains[index]);
        added = true;
        if (selected.length === count) break;
      }
    }
    if (!added) break;
  }
  return selected.sort();
};

const [antiAdText, adRulesText, existing] = await Promise.all([
  fetchText(ANTI_AD_URL),
  fetchText(ADRULES_URL),
  readExistingEntries(),
]);
const antiAdDomains = parseAntiAd(antiAdText);
const adRulesDomains = parseAdRules(adRulesText);
const sourceUnion = new Set([...antiAdDomains, ...adRulesDomains]);
const dualSource = [...antiAdDomains].filter((domain) =>
  adRulesDomains.has(domain),
);
const dualSourceSet = new Set(dualSource);
const protectedEntries = [...sourceUnion].filter(isCnProtectedDomain);
const existingEntries = [...sourceUnion].filter(
  (domain) =>
    !isCnProtectedDomain(domain) && isAlreadyCovered(domain, existing),
);
const eligible = [...sourceUnion].filter(
  (domain) =>
    !isCnProtectedDomain(domain) &&
    !isAlreadyCovered(domain, existing) &&
    !isCnSensitiveDomain(domain) &&
    (domain.endsWith(".cn") ||
      CHINA_PLATFORM_PATTERN.test(domain) ||
      AD_PATTERN.test(domain) ||
      CDN_PATTERN.test(domain)),
);
const dualEligible = eligible.filter((domain) => dualSourceSet.has(domain));
const singleEligible = eligible.filter((domain) => !dualSourceSet.has(domain));

if (eligible.length < TARGET_COUNT) {
  throw new Error(
    `通过审核的中国广告/CDN候选不足 ${TARGET_COUNT} 条：${eligible.length}`,
  );
}

const selectedSet = new Set();
const addSelected = (domains) => {
  for (const domain of domains) selectedSet.add(domain);
};

const cdnCandidates = dualEligible.filter((domain) => CDN_PATTERN.test(domain));
if (cdnCandidates.length < CDN_TARGET) {
  throw new Error(`广告 CDN 候选不足 ${CDN_TARGET} 条：${cdnCandidates.length}`);
}
addSelected(selectDiverse(cdnCandidates, CDN_TARGET));

const chinaRelevantCandidates = dualEligible.filter(
  (domain) =>
    (domain.endsWith(".cn") || CHINA_PLATFORM_PATTERN.test(domain)),
);
if (chinaRelevantCandidates.length < CHINA_RELEVANT_TARGET) {
  throw new Error(
    `中国相关广告候选不足 ${CHINA_RELEVANT_TARGET} 条：${chinaRelevantCandidates.length}`,
  );
}
addSelected(selectDiverse(chinaRelevantCandidates, CHINA_RELEVANT_TARGET));

addSelected(
  selectDiverse(
    dualEligible.filter((domain) => !selectedSet.has(domain)),
    TARGET_COUNT - selectedSet.size,
  ),
);
addSelected(
  selectDiverse(
    singleEligible.filter((domain) => !selectedSet.has(domain)),
    TARGET_COUNT - selectedSet.size,
  ),
);
const selected = [...selectedSet].sort();
const rulesetText = [
  "# Adcote audited China advertising and ad-CDN exact rules",
  "# Sources: anti-AD and AdRules; dual-source matches are selected first",
  "# Selection: China/platform/ad/CDN semantics with root-domain diversity",
  "# Match type: DOMAIN (exact only; no suffix expansion)",
  ...selected.map((domain) => `DOMAIN,${domain}`),
  "",
].join("\n");

const report = {
  generatedAt: new Date().toISOString(),
  targetCount: TARGET_COUNT,
  policy:
    "anti-AD and AdRules union with dual-source priority; existing/protected exclusion; China-region sources with .cn/China-platform/ad/CDN semantics; root-domain diversity",
  verificationSources: [
    {
      name: "anti-AD",
      repository: "https://github.com/privacy-protection-tools/anti-AD",
      url: ANTI_AD_URL,
      license: "MIT",
      sha256: sha256(antiAdText),
      parsedDomains: antiAdDomains.size,
    },
    {
      name: "AdRules",
      repository: "https://github.com/Cats-Team/AdRules",
      url: ADRULES_URL,
      license: "0BSD",
      sha256: sha256(adRulesText),
      parsedDomains: adRulesDomains.size,
    },
  ],
  sourceUnionDomains: sourceUnion.size,
  dualSourceMatches: dualSource.length,
  excludedProtected: protectedEntries.length,
  excludedAlreadyCovered: existingEntries.length,
  eligibleAfterSemanticAudit: eligible.length,
  eligibleDualSource: dualEligible.length,
  eligibleSingleSource: singleEligible.length,
  selectionTargets: {
    chinaRelevant: CHINA_RELEVANT_TARGET,
    adCdn: CDN_TARGET,
  },
  selectedExactDomains: selected.length,
  selectedDualSource: selected.filter((domain) => dualSourceSet.has(domain))
    .length,
  selectedSingleSource: selected.filter((domain) => !dualSourceSet.has(domain))
    .length,
  selectedCnTld: selected.filter((domain) => domain.endsWith(".cn")).length,
  selectedChinaPlatform: selected.filter((domain) =>
    CHINA_PLATFORM_PATTERN.test(domain),
  ).length,
  selectedAdSemantic: selected.filter((domain) => AD_PATTERN.test(domain))
    .length,
  selectedTrackingSemantic: selected.filter((domain) =>
    TRACKING_PATTERN.test(domain),
  ).length,
  selectedCdnSemantic: selected.filter((domain) => CDN_PATTERN.test(domain))
    .length,
  selectedRootGroups: new Set(selected.map(rootGroup)).size,
  rulesetSha256: sha256(rulesetText),
};

await writeFile(
  resolve(projectRoot, CN_AD_CDN_RULESET_PATH),
  rulesetText,
  "utf8",
);
await writeFile(
  resolve(projectRoot, "blocklists/cn-ad-cdn-2000.audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(report, null, 2));
