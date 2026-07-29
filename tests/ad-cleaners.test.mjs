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

test("YouTube 清理器移除首页、搜索与 Shorts 广告容器", async () => {
  const result = await runCleaner("youtube-ad-cleaner.js", {
    body: JSON.stringify({
      contents: [
        {
          richItemRenderer: {
            content: {
              videoRenderer: { videoId: "normal-video" },
            },
          },
        },
        {
          richItemRenderer: {
            content: {
              promotedVideoRenderer: { adId: "feed-ad" },
            },
          },
        },
        {
          adSlotRenderer: {
            slotId: "shorts-ad",
          },
        },
      ],
      searchResults: {
        promotedSparklesTextSearchRenderer: { adId: "search-ad" },
        videoRenderer: { videoId: "search-result" },
      },
    }),
  });

  const payload = JSON.parse(result.body);
  assert.equal(payload.contents.length, 1);
  assert.equal(
    payload.contents[0].richItemRenderer.content.videoRenderer.videoId,
    "normal-video",
  );
  assert.equal(
    payload.searchResults.promotedSparklesTextSearchRenderer,
    undefined,
  );
  assert.equal(payload.searchResults.videoRenderer.videoId, "search-result");
});

test("YouTube 清理器遇到非 JSON 时保持原响应", async () => {
  const result = await runCleaner("youtube-ad-cleaner.js", {
    body: "not-json",
  });
  assert.equal(Object.keys(result).length, 0);
});

test("X 清理器只移除带明确推广标记的时间线条目", async () => {
  const result = await runCleaner("x-ad-cleaner.js", {
    body: JSON.stringify({
      data: {
        home: {
          home_timeline_urt: {
            instructions: [
              {
                type: "TimelineAddEntries",
                entries: [
                  {
                    entryId: "tweet-1",
                    content: {
                      itemContent: {
                        tweet_results: {
                          result: {
                            legacy: {
                              full_text: "Normal post mentioning promoted music",
                            },
                          },
                        },
                      },
                    },
                  },
                  {
                    entryId: "promoted-tweet-2",
                    content: {
                      itemContent: {
                        tweet_results: { result: { rest_id: "2" } },
                      },
                    },
                  },
                  {
                    entryId: "tweet-3",
                    content: {
                      itemContent: {
                        promotedMetadata: {
                          advertiser_results: { result: { rest_id: "ad" } },
                        },
                      },
                    },
                  },
                  {
                    moduleItem: {
                      item: {
                        itemContent: {
                          promoted_content: {
                            advertiser_results: { result: { rest_id: "4" } },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    }),
  });

  const payload = JSON.parse(result.body);
  const entries =
    payload.data.home.home_timeline_urt.instructions[0].entries;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].entryId, "tweet-1");
  assert.match(
    entries[0].content.itemContent.tweet_results.result.legacy.full_text,
    /promoted music/,
  );
});

test("X 清理器保留推广字段为空的普通帖子", async () => {
  const result = await runCleaner("x-ad-cleaner.js", {
    body: JSON.stringify({
      data: {
        home: {
          instructions: [
            {
              entries: [
                {
                  entryId: "tweet-ordinary",
                  content: {
                    itemContent: {
                      promotedMetadata: null,
                      promoted_content: false,
                      tweet_results: {
                        result: {
                          rest_id: "ordinary",
                          legacy: { full_text: "Normal post" },
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    }),
  });

  const entries = JSON.parse(result.body).data.home.instructions[0].entries;
  assert.equal(entries.length, 1);
  assert.equal(
    entries[0].content.itemContent.tweet_results.result.rest_id,
    "ordinary",
  );
});

test("X 清理器遇到非 JSON 时保持原响应", async () => {
  const result = await runCleaner("x-ad-cleaner.js", {
    body: "not-json",
  });
  assert.equal(Object.keys(result).length, 0);
});
