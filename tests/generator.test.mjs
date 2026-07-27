import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOCK_PAGE_HOST,
  assertNoCrossListOverlap,
  buildModule,
  deduplicate,
  parseAppAdCsv,
  parseCsv,
} from "../scripts/lib.mjs";

test("按类别生成三条重定向规则", () => {
  const entries = parseCsv(`category,domain,note
ads,ads.example.test,广告
scam,phishing.example.test,诈骗
gambling,casino.example.test,博彩`);

  const moduleText = buildModule(entries);

  assert.match(moduleText, /\[URL Rewrite\]/);
  assert.match(moduleText, /category=ads&source=shadowrocket/);
  assert.match(moduleText, /category=scam&source=shadowrocket/);
  assert.match(moduleText, /category=gambling&source=shadowrocket/);
  assert.match(moduleText, /block\.rainyxin\.cyou:9999\/blocked/);
  assert.match(moduleText, /#target=\$1:\/\/\$2/);
  assert.match(moduleText, /www\|s\)\\\.youtube\\\.com/);
  assert.match(moduleText, /\[Script\]/);
  assert.match(moduleText, /google-search-ad-cleaner\.js/);
  assert.match(moduleText, /youtube-ad-cleaner\.js/);
  assert.match(moduleText, /youtubei\.googleapis\.com/);
  assert.match(moduleText, /hostname = %APPEND%/);
});

test("App 广告域名生成静默 REJECT 规则", () => {
  const entries = parseCsv(`category,domain,note
ads,ads.example.test,网页广告
scam,phishing.example.test,诈骗
gambling,casino.example.test,博彩`);
  const appAdEntries = parseAppAdCsv(`provider,match,domain,note
腾讯优量汇,exact,mi.gdt.qq.com,移动广告请求
穿山甲,suffix,pangolin-sdk-toutiao.com,广告 SDK`);

  const moduleText = buildModule(entries, appAdEntries);

  assert.match(moduleText, /\[Rule\]/);
  assert.match(moduleText, /DOMAIN,mi\.gdt\.qq\.com,REJECT/);
  assert.match(
    moduleText,
    /DOMAIN-SUFFIX,pangolin-sdk-toutiao\.com,REJECT/,
  );
});

test("App 广告规则不进入跳转与 MITM 清单", () => {
  const entries = parseCsv("category,domain,note\nads,ads.example.test,网页广告");
  const appAdEntries = parseAppAdCsv(`provider,match,domain,note
腾讯优量汇,exact,mi.gdt.qq.com,移动广告请求`);
  const moduleText = buildModule(entries, appAdEntries);
  const rewriteSection = moduleText.split("[URL Rewrite]")[1].split("[Script]")[0];
  const mitmSection = moduleText.split("[MITM]")[1];

  assert.doesNotMatch(rewriteSection, /mi\.gdt\.qq\.com/);
  assert.doesNotMatch(mitmSection, /mi\.gdt\.qq\.com/);
});

test("拒绝无效或重复的 App 广告清单项", () => {
  assert.throws(
    () => parseAppAdCsv(`provider,match,domain,note
腾讯优量汇,wildcard,mi.gdt.qq.com,错误`),
    /匹配方式无效/,
  );
  assert.throws(
    () => parseAppAdCsv(`provider,match,domain,note
腾讯优量汇,exact,*.gdt.qq.com,错误`),
    /域名无效/,
  );

  const duplicate = parseAppAdCsv(`provider,match,domain,note
腾讯优量汇,exact,mi.gdt.qq.com,一
腾讯优量汇,exact,mi.gdt.qq.com,二`);
  assert.throws(
    () => deduplicate(duplicate, ({ match, domain }) => `${match}:${domain}`),
    /域名重复/,
  );
});

test("拒绝网页跳转与 App 静默清单重叠", () => {
  const entries = parseCsv(
    "category,domain,note\nads,ads.example.test,网页广告",
  );
  const appAdEntries = parseAppAdCsv(`provider,match,domain,note
示例,suffix,example.test,冲突`);

  assert.throws(
    () => assertNoCrossListOverlap(entries, appAdEntries),
    /清单重叠/,
  );
});

test("匹配根域名和任意子域名", () => {
  const entries = parseCsv("category,domain,note\nads,ads.example.test,广告");
  const moduleText = buildModule(entries);
  const rewriteLine = moduleText
    .split("\n")
    .find((line) => line.includes("category=ads"));
  const pattern = rewriteLine.split(" ")[0];
  const regex = new RegExp(pattern);

  assert.equal(regex.test("https://ads.example.test/"), true);
  assert.equal(regex.test("https://cdn.ads.example.test/banner"), true);
  assert.equal(regex.test("https://a.b.c.ads.example.test/banner"), true);
  assert.equal(regex.test("https://ads.example.test?campaign=1"), true);
  assert.equal(regex.test("https://notads.example.test/"), false);
});

test("拒绝重复域名", () => {
  const entries = parseCsv(`category,domain,note
ads,duplicate.example.test,一
scam,duplicate.example.test,二`);

  assert.throws(() => deduplicate(entries), /域名重复/);
});

test("拒绝拦截页自身及其父域", () => {
  assert.throws(
    () => parseCsv(`category,domain,note\nads,${BLOCK_PAGE_HOST},错误`),
    /拦截页自身/,
  );
  assert.throws(
    () => parseCsv("category,domain,note\nads,rainyxin.cyou,错误"),
    /拦截页自身/,
  );
});

test("拒绝 URL、通配符和非法类别", () => {
  assert.throws(
    () => parseCsv("category,domain,note\nads,https://example.test,错误"),
    /域名无效/,
  );
  assert.throws(
    () => parseCsv("category,domain,note\nads,*.example.test,错误"),
    /域名无效/,
  );
  assert.throws(
    () => parseCsv("category,domain,note\nmalware,example.test,错误"),
    /类别无效/,
  );
});
