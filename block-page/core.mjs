export const BLOCK_PAGE_HOST = "block.rainyxin.cyou";
export const ZHEJIANG_REPORT_URL = "https://www.zjjubao.com/report/none";

export const CATEGORY_CONFIG = {
  ads: {
    label: "广告链接",
    title: "广告页面已被暂停",
    description:
      "该地址属于已知广告投放或推荐网络。继续访问可能产生跟踪请求、弹窗或跳转。",
    chip: "广告网络",
  },
  scam: {
    label: "疑似诈骗",
    title: "请停下来核验这个网页",
    description:
      "该地址出现在风险清单中。不要输入账号、密码、短信验证码，也不要按页面指引付款。",
    chip: "高风险",
  },
  gambling: {
    label: "博彩风险",
    title: "检测到博彩相关链接",
    description:
      "该地址被标记为博彩相关内容。页面将自动转到浙江省官方违法和不良信息举报入口。",
    chip: "博彩内容",
  },
};

export function parseTarget(hash, blockPageHost = BLOCK_PAGE_HOST) {
  if (!hash.startsWith("#target=")) return null;

  const rawTarget = hash.slice("#target=".length);
  if (!rawTarget) return null;

  try {
    const target = new URL(rawTarget);
    if (!["http:", "https:"].includes(target.protocol)) return null;
    if (target.hostname.toLowerCase() === blockPageHost.toLowerCase()) return null;
    return target;
  } catch {
    return null;
  }
}

export function parseBlockContext(href) {
  const current = new URL(href);
  const requestedCategory = current.searchParams.get("category") ?? "";
  const category = Object.hasOwn(CATEGORY_CONFIG, requestedCategory)
    ? requestedCategory
    : "scam";

  return {
    category,
    config: CATEGORY_CONFIG[category],
    source: current.searchParams.get("source") ?? "unknown",
    target: parseTarget(current.hash),
  };
}
