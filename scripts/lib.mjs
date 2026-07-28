import { readFile } from "node:fs/promises";

export const ALLOWED_CATEGORIES = ["ads", "scam", "gambling"];
export const BLOCK_PAGE_HOST = "block.rainyxin.cyou";
export const BLOCK_PAGE_BASE = `https://${BLOCK_PAGE_HOST}/blocked`;
export const APP_AD_MATCH_TYPES = ["exact", "suffix"];
export const REWRITE_DOMAIN_CHUNK_SIZE = 40;
export const SCRIPT_BASE =
  "https://raw.githubusercontent.com/dominic-adcote/rainyxin-shadowrocket-web-guard/main/scripts";

const YOUTUBE_AD_ENDPOINTS = [
  String.raw`^https?:\/\/(?:www|s)\.youtube\.com\/api\/stats\/ads(?:\?|$)`,
  String.raw`^https?:\/\/www\.youtube\.com\/(?:pagead|ptracking|get_midroll_info)(?:\/|\?|$)`,
];

const SCRIPT_LINES = [
  `Adcote Google 搜索广告清理 = type=http-response,requires-body=1,max-size=2097152,engine=jsc,script-path=${SCRIPT_BASE}/google-search-ad-cleaner.js,pattern=^https?:\\/\\/www\\.google\\.(?:com|co\\.uk|com\\.hk|com\\.sg)\\/search(?:\\?|$)`,
  `Adcote YouTube 播放器广告清理 = type=http-response,requires-body=1,max-size=0,engine=webview,script-path=${SCRIPT_BASE}/youtube-ad-cleaner.js,pattern=^https?:\\/\\/youtubei\\.googleapis\\.com\\/youtubei\\/v1\\/player(?:\\?|$)`,
];

const SCRIPT_HOSTNAMES = [
  "s.youtube.com",
  "www.google.co.uk",
  "www.google.com",
  "www.google.com.hk",
  "www.google.com.sg",
  "www.youtube.com",
  "youtubei.googleapis.com",
];

const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.shift()?.toLowerCase() !== "category,domain,note") {
    throw new Error("domains.csv 必须以 category,domain,note 作为表头");
  }

  return lines.map((line, index) => {
    const [rawCategory, rawDomain, ...noteParts] = line.split(",");
    const category = rawCategory?.trim().toLowerCase();
    const domain = rawDomain?.trim().toLowerCase().replace(/\.$/, "");
    const note = noteParts.join(",").trim();

    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new Error(`第 ${index + 2} 行类别无效：${rawCategory ?? ""}`);
    }
    if (!domain || !DOMAIN_PATTERN.test(domain)) {
      throw new Error(`第 ${index + 2} 行域名无效：${rawDomain ?? ""}`);
    }
    if (domain === BLOCK_PAGE_HOST || BLOCK_PAGE_HOST.endsWith(`.${domain}`)) {
      throw new Error(`第 ${index + 2} 行会拦截拦截页自身：${domain}`);
    }

    return { category, domain, note };
  });
}

export function parseAppAdCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.shift()?.toLowerCase() !== "provider,match,domain,note") {
    throw new Error(
      "app-ad-domains.csv 必须以 provider,match,domain,note 作为表头",
    );
  }

  return lines.map((line, index) => {
    const [rawProvider, rawMatch, rawDomain, ...noteParts] = line.split(",");
    const provider = rawProvider?.trim();
    const match = rawMatch?.trim().toLowerCase();
    const domain = rawDomain?.trim().toLowerCase().replace(/\.$/, "");
    const note = noteParts.join(",").trim();

    if (!provider) {
      throw new Error(`第 ${index + 2} 行广告平台为空`);
    }
    if (!APP_AD_MATCH_TYPES.includes(match)) {
      throw new Error(`第 ${index + 2} 行匹配方式无效：${rawMatch ?? ""}`);
    }
    if (!domain || !DOMAIN_PATTERN.test(domain)) {
      throw new Error(`第 ${index + 2} 行域名无效：${rawDomain ?? ""}`);
    }
    if (domain === BLOCK_PAGE_HOST || BLOCK_PAGE_HOST.endsWith(`.${domain}`)) {
      throw new Error(`第 ${index + 2} 行会拦截拦截页自身：${domain}`);
    }

    return { provider, match, domain, note };
  });
}

export function parseGamblingCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.shift()?.toLowerCase() !== "domain,source,note") {
    throw new Error(
      "gambling-domains.csv 必须以 domain,source,note 作为表头",
    );
  }

  return lines.map((line, index) => {
    const [rawDomain, rawSource, ...noteParts] = line.split(",");
    const domain = rawDomain?.trim().toLowerCase().replace(/\.$/, "");
    const source = rawSource?.trim();
    const note = noteParts.join(",").trim();

    if (!domain || !DOMAIN_PATTERN.test(domain)) {
      throw new Error(`第 ${index + 2} 行域名无效：${rawDomain ?? ""}`);
    }
    if (!source) {
      throw new Error(`第 ${index + 2} 行来源为空`);
    }
    if (domain === BLOCK_PAGE_HOST || BLOCK_PAGE_HOST.endsWith(`.${domain}`)) {
      throw new Error(`第 ${index + 2} 行会拦截拦截页自身：${domain}`);
    }

    return { category: "gambling", domain, source, note };
  });
}

export function parseDomainList(text, category, source) {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error(`域名清单类别无效：${category}`);
  }
  if (!source?.trim()) {
    throw new Error("域名清单来源为空");
  }

  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("#") &&
        !line.startsWith("!"),
    )
    .map((rawLine, index) => {
      const adGuardMatch = rawLine.match(/^\|\|([^^/]+)\^$/);
      const rawDomain = adGuardMatch?.[1] ?? rawLine;
      const domain = rawDomain.toLowerCase().replace(/\.$/, "");

      if (!DOMAIN_PATTERN.test(domain)) {
        throw new Error(`第 ${index + 1} 条域名无效：${rawLine}`);
      }
      if (domain === BLOCK_PAGE_HOST || BLOCK_PAGE_HOST.endsWith(`.${domain}`)) {
        throw new Error(`第 ${index + 1} 条会拦截拦截页自身：${domain}`);
      }

      return {
        category,
        domain,
        source: source.trim(),
        note: "",
      };
    });
}

export function deduplicate(entries, key = ({ domain }) => domain) {
  const seen = new Set();

  return entries.filter((entry) => {
    const value = key(entry);
    if (seen.has(value)) {
      throw new Error(`域名重复：${value}`);
    }
    seen.add(value);
    return true;
  });
}

export function assertNoCrossListOverlap(entries, appAdEntries) {
  for (const { domain: webDomain } of entries) {
    for (const { domain: appDomain, match } of appAdEntries) {
      const appCoversWeb =
        webDomain === appDomain ||
        (match === "suffix" && webDomain.endsWith(`.${appDomain}`));
      const webCoversApp = appDomain.endsWith(`.${webDomain}`);

      if (appCoversWeb || webCoversApp) {
        throw new Error(`网页与 App 广告清单重叠：${webDomain} / ${appDomain}`);
      }
    }
  }
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildModule(entries, appAdEntries = []) {
  assertNoCrossListOverlap(entries, appAdEntries);

  const grouped = Object.fromEntries(
    ALLOWED_CATEGORIES.map((category) => [
      category,
      entries
        .filter((entry) => entry.category === category)
        .map((entry) => entry.domain)
        .sort(),
    ]),
  );

  const rewriteLines = [];
  rewriteLines.push(
    ...YOUTUBE_AD_ENDPOINTS.map((pattern) => `${pattern} - reject`),
  );

  for (const category of ALLOWED_CATEGORIES) {
    const domains = grouped[category];
    if (domains.length === 0) continue;

    for (
      let offset = 0;
      offset < domains.length;
      offset += REWRITE_DOMAIN_CHUNK_SIZE
    ) {
      const domainChunk = domains.slice(
        offset,
        offset + REWRITE_DOMAIN_CHUNK_SIZE,
      );
      const alternatives = domainChunk.map(escapeRegex).join("|");
      const pattern = `^(https?)://((?:[^./:]+\\.)*(?:${alternatives})(?::\\d+)?(?:[/?].*)?)$`;
      const target = `${BLOCK_PAGE_BASE}?category=${category}&source=shadowrocket#target=$1://$2`;
      rewriteLines.push(`${pattern} ${target} 302`);
    }
  }

  const hostnames = entries
    .flatMap(({ domain }) => [domain, `*.${domain}`])
    .concat(SCRIPT_HOSTNAMES)
    .sort();

  return [
    "#!name=Adcote 网页安全拦截",
    "#!desc=网页风险跳转到安全提示页，App 开屏广告静默拒绝",
    "#!author=Adcote",
    "#!homepage=https://block.rainyxin.cyou",
    "#!category=Security",
    "",
    "[Rule]",
    ...appAdEntries
      .map(({ match, domain }) => [
        match === "suffix" ? "DOMAIN-SUFFIX" : "DOMAIN",
        domain,
        "REJECT",
      ].join(","))
      .sort(),
    "",
    "[URL Rewrite]",
    ...rewriteLines,
    "",
    "[Script]",
    ...SCRIPT_LINES,
    "",
    "[MITM]",
    `hostname = %APPEND% ${hostnames.join(", ")}`,
    "",
  ].join("\n");
}

export async function readEntries(csvPath) {
  const text = await readFile(csvPath, "utf8");
  return deduplicate(parseCsv(text));
}

export function filterAppOverlaps(entries, appAdEntries) {
  return entries.filter(({ domain: webDomain }) =>
    !appAdEntries.some(({ domain: appDomain, match }) => {
      const appCoversWeb =
        webDomain === appDomain ||
        (match === "suffix" && webDomain.endsWith(`.${appDomain}`));
      const webCoversApp = appDomain.endsWith(`.${webDomain}`);
      return appCoversWeb || webCoversApp;
    }),
  );
}

export async function readAppAdEntries(csvPath) {
  const text = await readFile(csvPath, "utf8");
  return deduplicate(
    parseAppAdCsv(text),
    ({ match, domain }) => `${match}:${domain}`,
  );
}

export async function readGamblingEntries(csvPath) {
  const text = await readFile(csvPath, "utf8");
  return deduplicate(parseGamblingCsv(text));
}

export async function readAdEntries(listPath) {
  const text = await readFile(listPath, "utf8");
  return deduplicate(
    parseDomainList(text, "ads", "user-local-audit-2026-07-27"),
  );
}

export async function readCnAdEntries(listPath) {
  const text = await readFile(listPath, "utf8");
  return deduplicate(
    parseDomainList(text, "ads", "user-cn-audit-2026-07-27"),
  );
}

export async function readOverseasAdEntries(listPath) {
  const text = await readFile(listPath, "utf8");
  return deduplicate(
    parseDomainList(text, "ads", "stevenblack-mit+hagezi-light-cross-check"),
  );
}
