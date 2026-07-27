import test from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORY_CONFIG,
  ZHEJIANG_REPORT_URL,
  parseBlockContext,
  parseTarget,
} from "../block-page/core.mjs";

test("从 URL 片段恢复原始目标且不发送给服务器", () => {
  const context = parseBlockContext(
    "https://block.rainyxin.cyou/blocked?category=ads&source=shadowrocket#target=https://ads.example.test/path?a=1&b=2",
  );

  assert.equal(context.category, "ads");
  assert.equal(context.target.href, "https://ads.example.test/path?a=1&b=2");
});

test("只允许 HTTP(S) 目标且拒绝拦截页自身", () => {
  assert.equal(parseTarget("#target=javascript:alert(1)"), null);
  assert.equal(
    parseTarget("#target=https://block.rainyxin.cyou/blocked"),
    null,
  );
  assert.equal(
    parseTarget("#target=https://safe.example.test/")?.hostname,
    "safe.example.test",
  );
});

test("未知类别按诈骗风险处理", () => {
  const context = parseBlockContext(
    "https://block.rainyxin.cyou/blocked?category=unknown",
  );

  assert.equal(context.category, "scam");
  assert.equal(context.config, CATEGORY_CONFIG.scam);
});

test("博彩类别使用浙江省官方举报入口", () => {
  const context = parseBlockContext(
    "https://block.rainyxin.cyou/blocked?category=gambling",
  );

  assert.equal(context.category, "gambling");
  assert.equal(ZHEJIANG_REPORT_URL, "https://www.zjjubao.com/report/none");
});
