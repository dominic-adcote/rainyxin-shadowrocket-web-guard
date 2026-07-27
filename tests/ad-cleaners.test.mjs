import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function runCleaner(filename, response) {
  const source = await readFile(
    new URL(`../scripts/${filename}`, import.meta.url),
    "utf8",
  );
  let result;
  vm.runInNewContext(source, {
    $response: response,
    $done(value) {
      result = value;
    },
  });
  return result;
}

test("Google 搜索清理器只向 HTML 注入一次隐藏样式", async () => {
  const response = {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: "<html><head><title>Google</title></head><body></body></html>",
  };

  const first = await runCleaner("google-search-ad-cleaner.js", response);
  assert.match(first.body, /adcote-google-search-adblock/);
  assert.match(first.body, /\[data-text-ad\]/);

  const second = await runCleaner("google-search-ad-cleaner.js", {
    ...response,
    body: first.body,
  });
  assert.equal(Object.keys(second).length, 0);
});

test("Google 搜索清理器忽略非 HTML 响应", async () => {
  const result = await runCleaner("google-search-ad-cleaner.js", {
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(Object.keys(result).length, 0);
});

test("YouTube 清理器递归移除广告字段并保留播放信息", async () => {
  const result = await runCleaner("youtube-ad-cleaner.js", {
    body: JSON.stringify({
      playabilityStatus: { status: "OK" },
      adPlacements: [{ id: "pre-roll" }],
      playerResponse: {
        streamingData: { formats: [{ itag: 18 }] },
        playerAds: [{ id: "banner" }],
        nested: { adSlots: [{ id: "mid-roll" }] },
      },
    }),
  });

  const payload = JSON.parse(result.body);
  assert.equal(payload.playabilityStatus.status, "OK");
  assert.equal(payload.adPlacements, undefined);
  assert.equal(payload.playerResponse.playerAds, undefined);
  assert.equal(payload.playerResponse.nested.adSlots, undefined);
  assert.equal(payload.playerResponse.streamingData.formats[0].itag, 18);
});

test("YouTube 清理器遇到非 JSON 时保持原响应", async () => {
  const result = await runCleaner("youtube-ad-cleaner.js", {
    body: "not-json",
  });
  assert.equal(Object.keys(result).length, 0);
});
