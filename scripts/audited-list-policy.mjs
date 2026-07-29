export const AUDITED_ALL_RULESET_PATH =
  "blocklists/audited-all-ad-tracking.list";

export const AUDITED_ALL_RULESET_URL =
  "https://raw.githubusercontent.com/dominic-adcote/rainyxin-shadowrocket-web-guard/main/" +
  AUDITED_ALL_RULESET_PATH;

export const CN_AD_CDN_RULESET_PATH = "blocklists/cn-ad-cdn-2000.list";

export const CN_AD_CDN_RULESET_URL =
  "https://raw.githubusercontent.com/dominic-adcote/rainyxin-shadowrocket-web-guard/main/" +
  CN_AD_CDN_RULESET_PATH;

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

export const CN_PROTECTED_DOMAIN_SUFFIXES = [
  "163.com",
  "ac.cn",
  "alicdn.com",
  "baidustatic.com",
  "bytedance.com",
  "dbankcdn.com",
  "dbankcloud.cn",
  "edu.cn",
  "gov.cn",
  "huawei.com",
  "iqiyi.com",
  "kuaishou.com",
  "meituan.com",
  "mi.com",
  "miui.com",
  "msn.cn",
  "netease.com",
  "openai.com",
  "oppo.com",
  "pinduoduo.com",
  "qq.com.cn",
  "sina.com.cn",
  "snssdk.com",
  "sohu.com",
  "tencent-cloud.net",
  "toutiao.com",
  "uc.cn",
  "vivo.com",
  "weibo.com",
  "xiaomi.com",
  "youku.com",
];

const CN_SENSITIVE_DOMAIN_PATTERN =
  /account|auth|bank|dns|download|login|payment|update|(?:^|[.-])pay(?:[.-]|$)/i;

export function isDomainOrChildOf(domain, suffix) {
  return domain === suffix || domain.endsWith(`.${suffix}`);
}

export function isProtectedDomain(domain) {
  return PROTECTED_DOMAIN_SUFFIXES.some((suffix) =>
    isDomainOrChildOf(domain, suffix),
  );
}

export function isCnProtectedDomain(domain) {
  return (
    isProtectedDomain(domain) ||
    CN_PROTECTED_DOMAIN_SUFFIXES.some((suffix) =>
      isDomainOrChildOf(domain, suffix),
    )
  );
}

export function isCnSensitiveDomain(domain) {
  return CN_SENSITIVE_DOMAIN_PATTERN.test(domain);
}
