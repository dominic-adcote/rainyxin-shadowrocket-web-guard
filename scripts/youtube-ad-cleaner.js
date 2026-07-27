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

  const clean = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) clean(item);
      return;
    }

    for (const key of Object.keys(value)) {
      if (adKeys.has(key)) {
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
