import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMAIN_PATTERN } from "./lib.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "blocklists/bilibili-ad-domains.csv");
const reportPath = resolve(
  projectRoot,
  "blocklists/bilibili-ad-domains.audit.json",
);

const SOURCES = [
  {
    name: "anti-AD",
    repository: "https://github.com/privacy-protection-tools/anti-AD",
    url: "https://raw.githubusercontent.com/privacy-protection-tools/anti-AD/master/anti-ad-domains.txt",
    license: "MIT",
  },
  {
    name: "AdRules",
    repository: "https://github.com/Cats-Team/AdRules",
    url: "https://raw.githubusercontent.com/Cats-Team/AdRules/main/adrules_domainset.txt",
    license: "0BSD",
  },
  {
    name: "HaGeZi Multi Pro",
    repository: "https://github.com/hagezi/dns-blocklists",
    url: "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/pro.txt",
    license: "GPL-3.0",
  },
  {
    name: "217heidai China",
    repository: "https://github.com/217heidai/adblockfilters",
    url: "https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/china.txt",
    license: "GPL-3.0",
  },
  {
    name: "SukkaW reject",
    repository: "https://github.com/SukkaW/Surge",
    url: "https://raw.githubusercontent.com/SukkaW/Surge/master/Source/domainset/reject.conf",
    license: "AGPL-3.0",
  },
  {
    name: "NobyDa AdRule",
    repository: "https://github.com/NobyDa/Script",
    url: "https://raw.githubusercontent.com/NobyDa/Script/master/Surge/AdRule.list",
    license: "GPL-3.0",
  },
];

const SELECTED = [
  {
    domain: "ali-web-player-tracker.biliapi.net",
    purpose: "播放器追踪",
    minimumSources: 2,
  },
  {
    domain: "data.bilibili.com",
    purpose: "广告投放与数据采集",
    minimumSources: 4,
  },
  {
    domain: "data.bilibili.tv",
    purpose: "国际站数据采集测试候选",
    minimumSources: 1,
  },
  {
    domain: "dataflow.biliapi.com",
    purpose: "数据流与归因采集",
    minimumSources: 4,
  },
  {
    domain: "hw-v2-web-player-tracker.biliapi.net",
    purpose: "播放器追踪",
    minimumSources: 2,
  },
  {
    domain: "line1-log.biligame.net",
    purpose: "游戏日志与广告归因",
    minimumSources: 5,
  },
  {
    domain: "line3-adscore-api.biligame.net",
    purpose: "游戏广告评分接口",
    minimumSources: 2,
  },
  {
    domain: "tracker.chat.bilibili.com",
    purpose: "聊天追踪测试候选",
    minimumSources: 1,
  },
];

const ALREADY_COVERED = [
  {
    domain: "cm.bilibili.com",
    reason: "项目现有国内广告及 App 静默规则已经覆盖",
  },
];

const EXCLUDED = [
  {
    domain: "app.bilibili.com",
    reason: "开屏、推荐、搜索和账户功能共用主 API，只能按路径清理",
  },
  {
    domain: "api.bilibili.com",
    reason: "网页、播放与账户功能共用主 API",
  },
  {
    domain: "api.live.bilibili.com",
    reason: "直播核心接口",
  },
  {
    domain: "httpdns.bilivideo.com",
    reason: "网络解析基础设施",
  },
  {
    domain: "dataflow.bilibili.com",
    reason: "仅单源命中且当前公共 DNS 无有效记录",
  },
  {
    domain: "interface.bilibili.com",
    reason: "旧版客户端核心接口",
  },
  {
    domain: "mcdn.bilivideo.com",
    reason: "视频 PCDN/媒体分发，域名拒绝可能破坏播放",
  },
  {
    domain: "mcdn.bilivideo.cn",
    reason: "视频 PCDN/媒体分发，域名拒绝可能破坏播放",
  },
  {
    domain: "miniapp.bilibili.com",
    reason: "小程序功能主机且被 AdRules 明确放行",
  },
  {
    domain: "static.hdslb.com",
    reason: "网页和 App 通用静态资源",
  },
  {
    domain: "upos-sz-mirrorhw.bilivideo.com",
    reason: "视频媒体 CDN",
  },
];

const sha256 = (text) =>
  createHash("sha256").update(text, "utf8").digest("hex");

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "Adcote-Web-Guard-Auditor/1.0" },
  });
  if (!response.ok) {
    throw new Error(`下载哔哩哔哩核验源失败：${url} (${response.status})`);
  }
  return response.text();
};

const extractDomains = (text) =>
  new Set(
    text
      .toLowerCase()
      .match(
        /(?<![a-z0-9-])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?![a-z0-9-])/g,
      ) ?? [],
  );

const resolveWithDoh = async (domain) => {
  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
    { headers: { accept: "application/dns-json" } },
  );
  if (!response.ok) {
    return { status: response.status, answers: [] };
  }
  const result = await response.json();
  return {
    status: result.Status,
    answers: (result.Answer ?? []).map(({ data }) => data),
  };
};

for (const { domain } of SELECTED) {
  if (!DOMAIN_PATTERN.test(domain)) {
    throw new Error(`哔哩哔哩候选域名无效：${domain}`);
  }
}

const sourceTexts = await Promise.all(
  SOURCES.map(async (source) => ({
    ...source,
    text: await fetchText(source.url),
  })),
);
const sourceDomainSets = sourceTexts.map((source) => ({
  ...source,
  domains: extractDomains(source.text),
}));

const selectedAudit = await Promise.all(
  SELECTED.map(async ({ domain, purpose, minimumSources }) => {
    const matchedSources = sourceDomainSets
      .filter(({ domains }) => domains.has(domain))
      .map(({ name }) => name);
    if (matchedSources.length < minimumSources) {
      throw new Error(
        `${domain} 当前只命中 ${matchedSources.length} 个来源，` +
          `低于要求的 ${minimumSources} 个`,
      );
    }
    const dns = await resolveWithDoh(domain);
    if (dns.status !== 0 || dns.answers.length === 0) {
      throw new Error(`哔哩哔哩候选当前没有有效 A/CNAME 记录：${domain}`);
    }
    return {
      domain,
      purpose,
      confidence: matchedSources.length >= 2 ? "high" : "experimental",
      matchedSources,
      dns,
    };
  }),
);

const csvText = [
  "provider,match,domain,note",
  ...selectedAudit
    .sort((left, right) => left.domain.localeCompare(right.domain))
    .map(
      ({ domain, purpose, confidence, matchedSources }) =>
        `Bilibili,exact,${domain},${purpose}；${confidence}；` +
        `${matchedSources.length} 个公开规则源`,
    ),
  "",
].join("\n");

const report = {
  generatedAt: new Date().toISOString(),
  policy:
    "exact Bilibili-owned hosts only; multi-source priority; active DNS required; shared APIs, media CDNs, HTTPDNS, login and playback infrastructure excluded",
  selectedExactDomains: selectedAudit.length,
  highConfidenceDomains: selectedAudit.filter(
    ({ confidence }) => confidence === "high",
  ).length,
  experimentalDomains: selectedAudit.filter(
    ({ confidence }) => confidence === "experimental",
  ).length,
  sources: sourceTexts.map(({ name, repository, url, license, text }) => ({
    name,
    repository,
    url,
    license,
    sha256: sha256(text),
    extractedDomains: extractDomains(text).size,
  })),
  selected: selectedAudit,
  alreadyCovered: ALREADY_COVERED,
  excluded: EXCLUDED,
  rulesetSha256: sha256(csvText),
};

await writeFile(outputPath, csvText, "utf8");
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
