import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deduplicate,
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
  isDomainOrChildOf,
  isProtectedDomain,
} from "./audited-list-policy.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error(
    "用法：node scripts/audit-all-ad-tracking-import.mjs <源域名清单>",
  );
}

const HAGEZI_URL =
  "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/pro.txt";
const STEVENBLACK_URL =
  "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts";
const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;

const sha256 = (text) =>
  createHash("sha256").update(text, "utf8").digest("hex");

const normalizeLines = (text) =>
  text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase().replace(/\.$/, ""))
    .filter(Boolean);

const parseHaGeZi = (text) =>
  new Set(normalizeLines(text).filter((domain) => DOMAIN_PATTERN.test(domain)));

const parseStevenBlack = (text) => {
  const domains = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const fields = line.split(/\s+/);
    for (const rawDomain of fields.slice(1)) {
      const domain = rawDomain.toLowerCase().replace(/\.$/, "");
      if (DOMAIN_PATTERN.test(domain)) domains.add(domain);
    }
  }
  return domains;
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "Adcote-Web-Guard-Auditor/1.0" },
  });
  if (!response.ok) {
    throw new Error(`下载核验源失败：${url} (${response.status})`);
  }
  return response.text();
};

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
  return { webEntries, silentEntries };
};

const isAlreadyCovered = (domain, webEntries, silentEntries) =>
  webEntries.some(({ domain: existing }) =>
    isDomainOrChildOf(domain, existing),
  ) ||
  silentEntries.some(({ domain: existing, match }) =>
    match === "suffix"
      ? isDomainOrChildOf(domain, existing)
      : domain === existing,
  );

const sourceText = await readFile(resolve(sourcePath), "utf8");
const sourceLines = normalizeLines(sourceText);
const uniqueSource = [...new Set(sourceLines)];
const invalidEntries = uniqueSource.filter(
  (domain) => !DOMAIN_PATTERN.test(domain) || IPV4_PATTERN.test(domain),
);
const validSource = uniqueSource.filter(
  (domain) => DOMAIN_PATTERN.test(domain) && !IPV4_PATTERN.test(domain),
);

const [hageziText, stevenBlackText, existing] = await Promise.all([
  fetchText(HAGEZI_URL),
  fetchText(STEVENBLACK_URL),
  readExistingEntries(),
]);
const hageziDomains = parseHaGeZi(hageziText);
const stevenBlackDomains = parseStevenBlack(stevenBlackText);
const dualSource = validSource.filter(
  (domain) => hageziDomains.has(domain) && stevenBlackDomains.has(domain),
);
const protectedEntries = dualSource.filter(isProtectedDomain);
const existingEntries = dualSource.filter(
  (domain) =>
    !isProtectedDomain(domain) &&
    isAlreadyCovered(domain, existing.webEntries, existing.silentEntries),
);
const accepted = dualSource
  .filter(
    (domain) =>
      !isProtectedDomain(domain) &&
      !isAlreadyCovered(domain, existing.webEntries, existing.silentEntries),
  )
  .sort();

const rulesetText = [
  "# Adcote audited exact ad/tracking rules",
  "# Source: user-provided all_ad_and_tracking_domains.txt",
  "# Verification: exact match in both HaGeZi Multi Pro and StevenBlack unified hosts",
  "# Match type: DOMAIN (exact only; no suffix expansion)",
  ...accepted.map((domain) => `DOMAIN,${domain}`),
  "",
].join("\n");

const report = {
  generatedAt: new Date().toISOString(),
  policy: "exact intersection of user source, HaGeZi Multi Pro, and StevenBlack",
  source: {
    pathHint: "all_ad_and_tracking_domains.txt",
    sha256: sha256(sourceText),
    rawLines: sourceLines.length,
    uniqueLines: uniqueSource.length,
    validDomains: validSource.length,
    invalidEntries,
  },
  verificationSources: [
    {
      name: "HaGeZi Multi Pro",
      url: HAGEZI_URL,
      sha256: sha256(hageziText),
      parsedDomains: hageziDomains.size,
    },
    {
      name: "StevenBlack unified hosts",
      url: STEVENBLACK_URL,
      sha256: sha256(stevenBlackText),
      parsedDomains: stevenBlackDomains.size,
    },
  ],
  dualSourceMatches: dualSource.length,
  excludedProtected: protectedEntries.length,
  excludedAlreadyCovered: existingEntries.length,
  acceptedExactDomains: accepted.length,
  rulesetSha256: sha256(rulesetText),
};

await writeFile(
  resolve(projectRoot, AUDITED_ALL_RULESET_PATH),
  rulesetText,
  "utf8",
);
await writeFile(
  resolve(projectRoot, "blocklists/audited-all-ad-tracking.audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(report, null, 2));
