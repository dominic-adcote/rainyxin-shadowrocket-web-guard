(() => {
  const body = typeof $response?.body === "string" ? $response.body : "";
  if (!body) {
    $done({});
    return;
  }

  const adKeys = new Set([
    "adBreakHeartbeatParams",
    "adBreakParams",
    "adPlacements",
    "adSafetyReason",
    "adServingDataEntry",
    "adSlots",
    "playerAds",
  ]);

  const adRendererKeys = new Set([
    "adSlotRenderer",
    "carouselAdRenderer",
    "compactPromotedVideoRenderer",
    "displayAdRenderer",
    "inFeedAdLayoutRenderer",
    "mastheadAdRenderer",
    "playerLegacyDesktopWatchAdsRenderer",
    "promotedSparklesTextSearchRenderer",
    "promotedSparklesWebRenderer",
    "promotedVideoRenderer",
    "searchPyvRenderer",
    "videoDisplayAdRenderer",
  ]);

  const feedWrapperKeys = new Set([
    "itemSectionRenderer",
    "richItemRenderer",
    "richSectionRenderer",
    "shelfRenderer",
  ]);

  const containsAdRenderer = (value, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 8) return false;
    if (Array.isArray(value)) {
      return value.some((item) => containsAdRenderer(item, depth + 1));
    }

    for (const [key, child] of Object.entries(value)) {
      if (adRendererKeys.has(key)) return true;
      if (containsAdRenderer(child, depth + 1)) return true;
    }
    return false;
  };

  const isFeedAdItem = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const keys = Object.keys(value);
    if (keys.some((key) => adRendererKeys.has(key))) return true;

    return keys.some(
      (key) => feedWrapperKeys.has(key) && containsAdRenderer(value[key]),
    );
  };

  const clean = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (let index = value.length - 1; index >= 0; index -= 1) {
        if (isFeedAdItem(value[index])) {
          value.splice(index, 1);
        } else {
          clean(value[index]);
        }
      }
      return;
    }

    for (const key of Object.keys(value)) {
      if (adKeys.has(key) || adRendererKeys.has(key)) {
        delete value[key];
      } else {
        clean(value[key]);
      }
    }
  };

  try {
    const payload = JSON.parse(body);
    clean(payload);
    $done({ body: JSON.stringify(payload) });
  } catch {
    $done({});
  }
})();
