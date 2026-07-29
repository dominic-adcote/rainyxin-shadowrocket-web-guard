(() => {
  const body = typeof $response?.body === "string" ? $response.body : "";
  if (!body) {
    $done({});
    return;
  }

  const promotionKeys = new Set([
    "advertiserResults",
    "advertiser_results",
    "promotedContent",
    "promotedMetadata",
    "promotedTrendMetadata",
    "promoted_content",
    "promoted_metadata",
    "promoted_trend",
  ]);

  const hasPromotionMarker = (value, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 10) return false;
    if (Array.isArray(value)) {
      return value.some((item) => hasPromotionMarker(item, depth + 1));
    }

    for (const [key, child] of Object.entries(value)) {
      if (
        promotionKeys.has(key) &&
        child !== null &&
        child !== undefined &&
        child !== false
      ) {
        return true;
      }
      if (hasPromotionMarker(child, depth + 1)) return true;
    }
    return false;
  };

  const isPromotedTimelineEntry = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const entryId = value.entryId ?? value.entry_id;
    if (
      typeof entryId === "string" &&
      /(?:^|[-_])(promoted|promotion|advertisement)(?:[-_]|$)/i.test(entryId)
    ) {
      return true;
    }

    if (
      Object.entries(value).some(
        ([key, child]) =>
          promotionKeys.has(key) &&
          child !== null &&
          child !== undefined &&
          child !== false,
      )
    ) {
      return true;
    }

    const looksLikeTimelineItem =
      "content" in value ||
      "item" in value ||
      "itemContent" in value ||
      "moduleItem" in value ||
      "module_item" in value;

    return looksLikeTimelineItem && hasPromotionMarker(value);
  };

  const clean = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (let index = value.length - 1; index >= 0; index -= 1) {
        if (isPromotedTimelineEntry(value[index])) {
          value.splice(index, 1);
        } else {
          clean(value[index]);
        }
      }
      return;
    }

    for (const key of Object.keys(value)) {
      if (promotionKeys.has(key)) {
        if (
          value[key] !== null &&
          value[key] !== undefined &&
          value[key] !== false
        ) {
          delete value[key];
        }
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
