import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOCK_PAGE_HOST,
  buildModule,
  deduplicate,
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
  assert.match(moduleText, /hostname = %APPEND%/);
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
