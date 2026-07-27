# Adcote Shadowrocket Web Guard

一个面向 Shadowrocket 的网页安全拦截模组。命中本地维护的广告、诈骗或博彩域名后，浏览器会被重定向到拦截页。

项目包含可生成、可校验、可导入的 Shadowrocket 模组，以及由自有服务器提供的 HTTPS 的拦截页。

## 当前设计

- 使用 Shadowrocket 原生 `[URL Rewrite]`、`[Script]` 和 `[MITM]`。
- 按 `ads`、`scam`、`gambling` 三类生成独立规则。
- 原始目标只保存在浏览器 URL 片段（`#target=`）中，不会发送给拦截页服务器。
- “无视风险，继续访问”需要二次确认，并只接受 `http` 或 `https` 目标。
- 博彩类别会自动转到互联网违法和不良信息举报中心的匿名举报页。
- Google 搜索网页会隐藏已识别的文字广告和购物广告容器。
- YouTube 会拒绝独立广告统计端点，并从 JSON 播放器响应中移除已知广告字段。
- 不封锁 `googlevideo.com`，因为它同时承载正常视频和广告媒体。
- App 开屏广告使用 `[Rule]` 静默 `REJECT`，不会打开或加载拦截页。

## 项目结构

```text
blocklists/domains.csv              分类域名清单（人工维护）
blocklists/ad-domains.txt           本地导入的 200 条网页广告域名
blocklists/cn-ad-domains.txt        本地导入的 333 条国内广告来源清单
blocklists/app-ad-domains.csv       App 广告静默拒绝清单
blocklists/gambling-domains.csv     双源交叉复核博彩域名清单
modules/rainyxin-web-guard.sgmodule 生成后的 Shadowrocket 模组
block-page/                         拦截页、交互逻辑和 9999 端口服务
deploy/                             systemd 与 Nginx 部署模板
scripts/generate-module.mjs         模组生成器
scripts/validate.mjs                清单和产物校验器
tests/generator.test.mjs            自动化测试
tests/block-page.test.mjs           拦截页安全逻辑测试
tests/ad-cleaners.test.mjs          Google 与 YouTube 清理脚本测试
docs/THREAT-MODEL.md                能力、隐私和边界说明
docs/SOURCES.md                     官方跳转和广告域名来源
```

## 本地生成与校验

需要 Node.js 18 或更高版本，不需要安装第三方依赖。

```bash
npm run build
npm test
```

提交前可运行：

```bash
npm run check
```

## 导入 Shadowrocket

在 Shadowrocket 中添加以下模块 URL：

```text
https://raw.githubusercontent.com/dominic-adcote/rainyxin-shadowrocket-web-guard/main/modules/rainyxin-web-guard.sgmodule
```

然后：

1. 在“配置 → 模块”中启用模块。
2. 为当前配置开启 HTTPS 解密。
3. 安装并在 iOS 设置中信任 Shadowrocket CA 证书。
4. 确保全局路由使用“配置”。
5. 访问清单中的测试地址，确认跳转到 `block.rainyxin.cyou`。

> HTTPS 网站只有在启用并信任 MITM 证书后才能被重写。未启用时，HTTP 规则仍可能生效，但 HTTPS 不会完整工作。

## 维护域名清单

编辑 `blocklists/domains.csv`：

```csv
category,domain,note
ads,ads.example.test,示例广告域名
scam,phishing.example.test,示例诈骗域名
gambling,betting.example.test,示例博彩域名
```

规则：

- `category` 只能是 `ads`、`scam`、`gambling`。
- `domain` 只写域名，不写协议、路径、端口或通配符。
- 一个根域名会同时匹配自身及其所有子域名。
- 国际化域名请先转换成 ASCII/Punycode。
- 不要加入银行、支付、系统更新等高风险域名，除非有可靠证据并经过复核。

保存后运行 `npm run build` 重新生成模组。

博彩域名单独维护在 `blocklists/gambling-domains.csv`，每条必须记录来源。当前批次以
StevenBlack 的 MIT 许可清单为收录来源，再与 HaGeZi 博彩清单交叉确认；只有同时出现且
域名名称含有明确博彩语义的条目才会加入。

批量网页广告域名维护在 `blocklists/ad-domains.txt`。文件允许空行和以 `#` 开头的
注释，其余每行必须是一个纯域名。构建时会与 `domains.csv` 合并并进行全局精确去重。

国内广告来源维护在 `blocklists/cn-ad-domains.txt`，支持 AdGuard
`||domain^` 格式和以 `!` 开头的注释。与 App 静默清单重叠的条目会保留在来源文件中，
但不会加入网页跳转或 MITM。

## 已审核的广告网络域名

当前审核统计（2026-07-27）：网页广告域名 517 条，App 广告规则 30 条，博彩域名 200 条。

网页广告清单由两部分组成：

- 本地导入清单 200 条，覆盖 Google、Meta、Amazon、Microsoft、Xandr、Criteo、
  Taboola、Outbrain、程序化交易平台、测量追踪、视频广告、移动广告和联盟营销等。
- 国内来源清单共 333 条，其中 316 条进入网页规则；17 条因与 App 静默规则冲突而不
  进入网页跳转/MITM。该批与已有清单精确重叠 2 条，因此净增 314 条网页广告域名。
- 原人工清单还有 1 条未包含在两份导入文件中的独立域名：
  `syndicatedsearch.goog`。

以下是原人工审核中用途经服务商资料确认的代表性域名：

- Google AdSense/Ads：`googlesyndication.com`、`googleadservices.com`
- Google DoubleClick：`doubleclick.net`
- Google 搜索广告：`adsensecustomsearchads.com`、`syndicatedsearch.goog`
- Taboola：`cdn.taboola.com`、`trc.taboola.com`
- Outbrain：`widgets.outbrain.com`
- Microsoft Advertising：`bat.bing.com`
- 百度联盟：`cpro.baidu.com`、`cpro.baidustatic.com`

广告域名通常作为第三方资源加载。命中后可阻止广告资源，但不保证每次都会触发顶层页面跳转。

海外导入文件自述参考 EasyList、AdGuard DNS Filter、Peter Lowe、HaGeZi、OISD 和
StevenBlack；国内文件自述参考 EasyList China、AdGuard Chinese Filter、anti-AD、
AdRules、CJX、domain-list-community、Peter Lowe 和 HaGeZi。本项目确认了格式、
数量、重复和跨清单冲突，但没有采纳原文件的“零误报”承诺。部分根域同时承载广告商
官网或管理后台，启用后访问这些页面也会被拦截。

项目约定：每次修改 `domains.csv`、`ad-domains.txt`、`cn-ad-domains.txt`、
`app-ad-domains.csv` 或 `gambling-domains.csv`，都必须同步更新本节的审核日期
和数量。`npm run validate` 会校验三项数量，防止 README 与实际清单不一致。

## 已审核的博彩域名

- 本批恰好 200 条，完整数据见 `blocklists/gambling-domains.csv`。
- 收录来源：[StevenBlack gambling-only hosts](https://github.com/StevenBlack/hosts/tree/master/alternates/gambling-only)，许可证为 MIT。
- 交叉复核：[HaGeZi Gambling DNS Blocklist](https://github.com/hagezi/dns-blocklists#gambling)，不导入只在 HaGeZi 中出现的条目。
- 只保留名称中含 `bet`、`casino`、`poker`、`slot`、`bingo`、`lotto`、
  `lottery`、`gambl`、`jackpot`、`roulette`、`sportsbook`、`bookmaker`
  或 `wager` 的双源交集。
- `91视频 / 91porn` 的公开分类是成人内容而非博彩，因此没有为凑数而归入博彩清单。
- 规则按每 40 个域名拆分；命中后仍使用 `category=gambling` 跳转至拦截页。

## Google 搜索与 YouTube

- Google 搜索广告清理适用于 `google.com`、`google.co.uk`、`google.com.hk` 和
  `google.com.sg` 的网页搜索结果。Google 调整页面结构后，选择器可能需要更新。
- YouTube 清理覆盖网页和 App 常见的 JSON 播放器响应；服务端插入广告、加密/二进制
  响应或接口变化时可能无法移除。
- YouTube 官方可能检测广告拦截并限制播放。若出现播放器报错，可先停用模组确认。
- 模组不会封锁 `youtube.com`、`youtubei.googleapis.com` 或 `googlevideo.com` 整个域名，
  只处理明确的路径与响应字段。

## App 开屏广告

开屏广告使用独立清单生成 Shadowrocket `[Rule]`：

```text
DOMAIN,mi.gdt.qq.com,REJECT
DOMAIN-SUFFIX,pangolin-sdk-toutiao.com,REJECT
```

- `exact` 只拒绝一个精确主机，适合腾讯等共用大型根域的服务。
- `suffix` 拒绝专用广告根域及其子域，只用于用途明确的广告 SDK 域名。
- 规则在域名路由层直接丢弃请求，不跳转 `block.rainyxin.cyou`，也不加入 MITM。
- 首批覆盖腾讯优量汇、穿山甲、百度百青藤和 Unity Ads。
- 国内广告来源中与本节规则重叠的 17 条不会生成网页跳转或进入 MITM。
- 屏蔽广告 SDK 可能同时影响激励视频；需要通过观看广告领取奖励的 App 可临时停用模组。

## 拦截页

本地启动：

```bash
npm run start:block-page
```

本地开发服务默认监听 `127.0.0.1:9999`。生产环境中，Nginx 在公网 `9999` 端口终止 TLS，再反向代理到只监听 `127.0.0.1:9998` 的页面服务，从而不影响服务器现有的 Xray 443 端口。

页面不加载第三方字体、脚本、图片或分析服务，并设置 CSP、无引用来源和权限限制等安全响应头。

## 后续待办

- 接入可信且有许可证的诈骗域名源。
- 为博彩清单增加定期复核、失效域名清理和误报申诉流程。
- 增加误报申诉、临时放行和清单回滚机制。
- 用真实 iPhone + Shadowrocket 完成端到端测试。

## 许可证

[MIT](LICENSE)。第三方清单的来源与许可说明见
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
