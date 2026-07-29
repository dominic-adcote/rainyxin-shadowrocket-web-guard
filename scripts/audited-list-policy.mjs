export const AUDITED_ALL_RULESET_PATH =
  "blocklists/audited-all-ad-tracking.list";

export const AUDITED_ALL_RULESET_URL =
  "https://raw.githubusercontent.com/dominic-adcote/rainyxin-shadowrocket-web-guard/main/" +
  AUDITED_ALL_RULESET_PATH;

export const PROTECTED_DOMAIN_SUFFIXES = [
  "adobe.com",
  "alipay.com",
  "amazon.com",
  "amazonaws.com",
  "apple.com",
  "azure.com",
  "azureedge.net",
  "baidu.com",
  "bilibili.com",
  "block.rainyxin.cyou",
  "cloudflare.com",
  "cloudflare-dns.com",
  "cloudfront.net",
  "github.com",
  "githubusercontent.com",
  "google.com",
  "googleapis.com",
  "googleusercontent.com",
  "googlevideo.com",
  "gstatic.com",
  "icloud.com",
  "icloud-content.com",
  "jd.com",
  "live.com",
  "microsoft.com",
  "microsoftonline.com",
  "mozilla.org",
  "office.com",
  "office365.com",
  "paypal.com",
  "qq.com",
  "rainyxin.cyou",
  "reddit.com",
  "stripe.com",
  "taobao.com",
  "tencent.com",
  "tmall.com",
  "twitter.com",
  "twimg.com",
  "wechat.com",
  "weixin.qq.com",
  "wikipedia.org",
  "windows.com",
  "x.com",
  "youtube.com",
  "ytimg.com",
  "zhihu.com",
];

export function isDomainOrChildOf(domain, suffix) {
  return domain === suffix || domain.endsWith(`.${suffix}`);
}

export function isProtectedDomain(domain) {
  return PROTECTED_DOMAIN_SUFFIXES.some((suffix) =>
    isDomainOrChildOf(domain, suffix),
  );
}
