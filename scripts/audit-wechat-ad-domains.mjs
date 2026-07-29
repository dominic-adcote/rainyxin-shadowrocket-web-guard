import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMAIN_PATTERN } from "./lib.mjs";
import { WECHAT_AD_RULESET_PATH } from "./audited-list-policy.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, WECHAT_AD_RULESET_PATH);
const reportPath = resolve(
  projectRoot,
  "blocklists/wechat-ad-domains-60.audit.json",
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
  {
    name: "V2Fly Tencent ads/tracking",
    repository:
      "https://github.com/v2fly/domain-list-community/blob/master/data/tencent",
    url: "https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/tencent",
    license: "MIT",
  },
];

const SELECTED_DOMAINS = [
  "ad.weixin.qq.com",
  "adping.qq.com",
  "adpm.app.qq.com",
  "adrdir.qq.com",
  "adsclick.qq.com",
  "adsgroup.qq.com",
  "adshmct.qq.com",
  "adshmmsg.qq.com",
  "adsqqclick.qq.com",
  "adsrich.qq.com",
  "adslvseed.qq.com",
  "adstextview.qq.com",
  "adsview.qq.com",
  "adsview2.qq.com",
  "ads.app.wechat.com",
  "adv.app.qq.com",
  "adver.qq.com",
  "adsmind.gdtimg.com.tcdn.qq.com",
  "adsmind.ugdtimg.com.tcdn.qq.com",
  "beacon.cdn.qq.com",
  "beaconcdn.qq.com",
  "c.ssp.qq.com",
  "c2.gdt.qq.com",
  "c3.gdt.qq.com",
  "canvas-cdn.gdt.qq.com",
  "canvas.gdt.qq.com",
  "d.gdt.qq.com",
  "event.gdt.qq.com",
  "h5.gdt.qq.com",
  "h5.ssp.qq.com",
  "ii.gdt.qq.com",
  "ipv4.gdt.qq.com",
  "k.ssp.qq.com",
  "m.gdt.qq.com",
  "n.ssp.qq.com",
  "nc.gdt.qq.com",
  "news.ssp.qq.com",
  "newsad.ssp.qq.com",
  "op.ssp.qq.com",
  "p.ssp.qq.com",
  "public.gdtimg.com",
  "q.i.gdt.qq.com",
  "review.gdtimg.com",
  "rm.gdt.qq.com",
  "rpt.gdt.qq.com",
  "ssp.qq.com",
  "tangram-config.gdt.qq.com",
  "ttc.gdt.qq.com",
  "union.gdtimg.com",
  "v2ii.gdt.qq.com",
  "v3.gdt.qq.com",
  "v6ii.gdt.qq.com",
  "vr.gdt.qq.com",
  "wxadliteapp.gdt.qq.com",
  "wxsnsad.tc.qq.com",
  "x.adnet.qq.com",
  "xc.gdt.qq.com",
  "xj-landing.gdtimg.com",
  "xs.gdt.qq.com",
  "xscdn.gdt.qq.com",
].sort();

const PROTECTED_WECHAT_HOSTS = [
  "login.weixin.qq.com",
  "long.weixin.qq.com",
  "mp.weixin.qq.com",
  "pay.weixin.qq.com",
  "res.wx.qq.com",
  "res2.wx.qq.com",
  "short.weixin.qq.com",
  "szextshort.weixin.qq.com",
  "weixin.qq.com",
  "wx.qq.com",
];

const BROADER_EXISTING_RULES = [
  {
    suffix: "gdt.qq.com",
    reason:
      "现有国内/App 清单已用后缀规则覆盖；本批保留精确子主机以建立可审计的 GDT 清单",
  },
  {
    suffix: "adnet.qq.com",
    reason:
      "现有国内清单已用后缀规则覆盖；本批保留精确广告投放子主机",
  },
];

const sha256 = (text) =>
  createHash("sha256").update(text, "utf8").digest("hex");

const fetchWithRetry = async (url, options = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, attempt * 500),
        );
      }
    }
  }
  throw lastError;
};

const fetchText = async (url) => {
  const response = await fetchWithRetry(url, {
    headers: { "user-agent": "Adcote-Web-Guard-Auditor/1.0" },
  });
  if (!response.ok) {
    throw new Error(`下载微信广告核验源失败：${url} (${response.status})`);
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
  const response = await fetchWithRetry(
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

if (
  SELECTED_DOMAINS.length !== 60 ||
  new Set(SELECTED_DOMAINS).size !== SELECTED_DOMAINS.length
) {
  throw new Error("微信广告专项候选必须恰好为 60 条且不得重复");
}
for (const domain of SELECTED_DOMAINS) {
  if (!DOMAIN_PATTERN.test(domain)) {
    throw new Error(`微信广告候选域名无效：${domain}`);
  }
  if (PROTECTED_WECHAT_HOSTS.includes(domain)) {
    throw new Error(`微信核心功能主机不得加入专项清单：${domain}`);
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

const blocklistDirectory = resolve(projectRoot, "blocklists");
const otherListFiles = (await readdir(blocklistDirectory)).filter(
  (name) =>
    /\.(?:csv|list|txt)$/i.test(name) &&
    !["cn-ad-cdn-2000.list", "wechat-ad-domains-60.list"].includes(name),
);
const existingDomains = new Set();
for (const name of otherListFiles) {
  const text = await readFile(resolve(blocklistDirectory, name), "utf8");
  for (const domain of extractDomains(text)) existingDomains.add(domain);
}

const selectedAudit = await Promise.all(
  SELECTED_DOMAINS.map(async (domain) => {
    if (existingDomains.has(domain)) {
      throw new Error(`微信广告候选已被现有清单精确覆盖：${domain}`);
    }
    const matchedSources = sourceDomainSets
      .filter(({ domains }) => domains.has(domain))
      .map(({ name }) => name);
    if (matchedSources.length === 0) {
      throw new Error(`微信广告候选没有公开规则源支持：${domain}`);
    }
    const dns = await resolveWithDoh(domain);
    if (dns.status !== 0 || dns.answers.length === 0) {
      throw new Error(`微信广告候选当前没有有效 A/CNAME 记录：${domain}`);
    }
    const purpose = domain.includes("cdn") || domain.includes("gdtimg")
      ? "广告素材与配置 CDN"
      : domain.includes("click") || domain.includes("rpt")
        ? "广告点击、曝光与归因"
        : domain.includes("ssp")
          ? "腾讯 SSP 广告投放"
          : domain.includes("gdt") || domain.includes("ad")
            ? "腾讯 GDT/微信广告投放"
            : "广告测量与投放支持";
    return {
      domain,
      purpose,
      confidence: matchedSources.length >= 2 ? "high" : "experimental",
      matchedSources,
      dns,
    };
  }),
);

const rulesetText = [
  "# Adcote audited WeChat Official Accounts and Moments advertising hosts",
  "# Tencent GDT/SSP delivery, creative CDN, click, impression and attribution",
  "# Match type: DOMAIN (exact only; this file is merged into cn-ad-cdn-2000.list)",
  ...selectedAudit.map(({ domain }) => `DOMAIN,${domain}`),
  "",
].join("\n");

const report = {
  generatedAt: new Date().toISOString(),
  policy:
    "exact Tencent GDT/SSP and WeChat advertising hosts only; public blocklist evidence and active public DNS required; login, payment, messaging, Official Accounts content, Mini Program and shared media hosts excluded; broader legacy coverage is recorded rather than counted as net-new behavior",
  selectedExactDomains: selectedAudit.length,
  highConfidenceDomains: selectedAudit.filter(
    ({ confidence }) => confidence === "high",
  ).length,
  experimentalDomains: selectedAudit.filter(
    ({ confidence }) => confidence === "experimental",
  ).length,
  directWechatAdvertisingHosts: selectedAudit.filter(({ domain }) =>
    ["ad.weixin.qq.com", "ads.app.wechat.com", "wxsnsad.tc.qq.com"].includes(
      domain,
    ),
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
  alreadyCoveredByBroaderRules: selectedAudit
    .map(({ domain }) => {
      const broaderRule = BROADER_EXISTING_RULES.find(
        ({ suffix }) => domain === suffix || domain.endsWith(`.${suffix}`),
      );
      return broaderRule
        ? {
            domain,
            broaderRule: broaderRule.suffix,
            reason: broaderRule.reason,
          }
        : null;
    })
    .filter(Boolean),
  excludedCoreHosts: PROTECTED_WECHAT_HOSTS,
  rulesetSha256: sha256(rulesetText),
};

await writeFile(outputPath, rulesetText, "utf8");
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
