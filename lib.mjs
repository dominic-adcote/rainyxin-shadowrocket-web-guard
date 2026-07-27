import { readFile } from "node:fs/promises";

export const ALLOWED_CATEGORIES = ["ads", "scam", "gambling"];
export const BLOCK_PAGE_HOST = "block.rainyxin.cyou";
export const BLOCK_PAGE_BASE = `https://${BLOCK_PAGE_HOST}/blocked`;

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

export function deduplicate(entries) {
  const seen = new Set();

  return entries.filter(({ domain }) => {
    if (seen.has(domain)) {
      throw new Error(`域名重复：${domain}`);
    }
    seen.add(domain);
    return true;
  });
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildModule(entries) {
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
  for (const category of ALLOWED_CATEGORIES) {
    const domains = grouped[category];
    if (domains.length === 0) continue;

    const alternatives = domains.map(escapeRegex).join("|");
    const pattern = `^https?://(?:[^./:]+\\.)*(?:${alternatives})(?::\\d+)?(?:/|$)`;
    const target = `${BLOCK_PAGE_BASE}?category=${category}&source=shadowrocket`;
    rewriteLines.push(`${pattern} ${target} 302`);
  }

  const hostnames = entries
    .flatMap(({ domain }) => [domain, `*.${domain}`])
    .sort();

  return [
    "#!name=Rainyxin 网页安全拦截",
    "#!desc=将域名清单中的广告、诈骗和博彩网站跳转到 block.rainyxin.cyou",
    "#!author=Rainyxin",
    "#!homepage=https://block.rainyxin.cyou",
    "#!category=Security",
    "",
    "[URL Rewrite]",
    ...rewriteLines,
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
