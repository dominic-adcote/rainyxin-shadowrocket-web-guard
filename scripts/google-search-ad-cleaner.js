(() => {
  const marker = "adcote-google-search-adblock";
  const body = typeof $response?.body === "string" ? $response.body : "";
  const headers = $response?.headers || {};
  const contentType =
    headers["Content-Type"] ||
    headers["content-type"] ||
    "";

  if (!body || !String(contentType).toLowerCase().includes("text/html")) {
    $done({});
    return;
  }

  if (body.includes(`id="${marker}"`)) {
    $done({});
    return;
  }

  const style = `<style id="${marker}">` +
    `[data-text-ad],[data-ta-slot],[data-pla-slot],` +
    `.uEierd,.commercial-unit-desktop-top,.commercial-unit-desktop-rhs{` +
    `display:none!important;visibility:hidden!important}` +
    `</style>`;

  const nextBody = /<\/head>/i.test(body)
    ? body.replace(/<\/head>/i, `${style}</head>`)
    : `${style}${body}`;

  $done({ body: nextBody });
})();
