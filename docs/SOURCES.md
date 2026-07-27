# 域名与跳转来源

更新时间：2026-07-27

## 浙江省官方举报入口

- 浙江省互联网违法和不良信息举报中心：
  <https://www.zjjubao.com/>
- 匿名举报页：
  <https://www.zjjubao.com/report/none>
- 举报指南：
  <https://www.zjjubao.com/about/guide>

首页和举报指南显示该站由浙江互联网信息办公室主办；匿名举报页的危害类型包含“赌博类”和“诈骗类”。

## 广告网络

- Google AdSense 帮助文档使用
  `pagead2.googlesyndication.com`：
  <https://support.google.com/adsense/answer/9183243>
- Google Ads 帮助文档的网络诊断示例使用 `googleadservices.com`：
  <https://support.google.com/google-ads/answer/16708237>
- Search Ads 360 帮助文档展示 `doubleclick.net` 点击跟踪地址：
  <https://support.google.com/sa360/answer/9238312>
- Google AdSense 搜索广告迁移说明列出
  `adsensecustomsearchads.com` 和 `syndicatedsearch.goog`：
  <https://support.google.com/adsense/answer/14201307>
- Taboola 官方 Web 集成文档使用
  `cdn.taboola.com`，官方 Cookie 政策列出 `trc.taboola.com`：
  <https://developers.taboola.com/web-integrations/docs/js-tag>
  <https://policies.taboola.com/cookie-policy/>
- Outbrain 官方实现指南使用
  `widgets.outbrain.com`：
  <https://developer.outbrain.com/outbrain-javascript-implementation-guide/>
- Microsoft Advertising 官方 UET 文档使用
  `bat.bing.com`：
  <https://learn.microsoft.com/advertising/msa-help/hlp_ba_conc_uet_setup_master>
- 百度联盟官方页面使用 `cpro.baidu.com`，其 H5 广告接入资料使用
  `cpro.baidustatic.com`：
  <https://cpro.baidu.com/union.html>

这些主机只作为保守的初始清单。加入更多域名前，应确认用途、评估误报和站点破坏风险，并记录来源。

## 用户提供的 200 条广告域名

2026-07-27 导入的 `blocklists/ad-domains.txt` 来自用户指定的本地文件。原文件注明参考：

- EasyList
- AdGuard DNS Filter
- Peter Lowe's Ad and tracking server list
- HaGeZi DNS Blocklists
- OISD
- StevenBlack/hosts

本次导入完成了以下可复现检查：

- 200 行有效域名，精确重复为 0。
- 与原网页广告清单有 8 条重叠；这些条目已从 `domains.csv` 迁移到新清单。
- 清单内部有 23 个子域已被同清单父域覆盖，但为保留原始审核记录没有删除。
- 与 App 广告静默拒绝清单的覆盖冲突为 0。

原文件没有携带逐条证据或可验证的生成脚本，因此本项目不声称已经独立重现其“每条至少
三个来源”或“零误报”结论。诸如 `taboola.com`、`outbrain.com`、`criteo.com`
等根域可能同时承载广告商官网、文档或管理入口，用户主动访问时也会被拦截。

## 用户提供的 333 条国内广告域名

2026-07-27 导入的 `blocklists/cn-ad-domains.txt` 来自用户指定的本地文件。原文件
注明参考 EasyList China、AdGuard Chinese Filter、anti-AD、AdRules、CJX's
Annoyance List、domain-list-community、Peter Lowe 和 HaGeZi。

本次导入完成了以下可复现检查：

- 333 条有效 AdGuard `||domain^` 域名规则，精确重复为 0。
- 与已有网页清单精确重叠 2 条；这些百度联盟条目已迁移到国内来源清单。
- 清单内部有 48 组子域已被同清单父域覆盖，为保留来源记录没有删除。
- 17 个来源域名会与 App 静默规则重叠，因此不加入网页跳转或 MITM。
- 最终有 316 条国内来源规则进入网页模块，网页广告唯一域名合计 517 条。

被排除出网页规则的条目包括现有腾讯优量汇、穿山甲和百度移动广告规则，以及过宽的
`gdt.qq.com`、`e.qq.com`。这样可以保留 App 开屏广告静默失败的行为，避免其请求
加载 HTML 拦截页。原文件同样没有逐条证据或生成脚本，本项目不作“零误报”承诺。

## 海外广告增补 100 条

2026-07-27 增补批次保存在 `blocklists/overseas-ad-domains-100.txt`：

- 收录来源：StevenBlack/hosts：
  <https://github.com/StevenBlack/hosts>
- 交叉复核：HaGeZi Multi LIGHT：
  <https://github.com/hagezi/dns-blocklists>

筛选流程从两份清单的 4,203 个交叉命中开始，排除现有网页、App 和博彩清单的自身及
父子域覆盖项、中国域名、成人或博彩站点广告主机，再要求名称含 `ad`、`ads`、
`adserver`、`advertising`、`banner`、`pixel`、`affiliate`、`click`、
`promo` 或 `tracking` 等明确语义。最终人工选取 100 个不同广告基础设施主体。

StevenBlack/hosts 是这 100 条数据的 MIT 许可来源；HaGeZi Multi LIGHT 仅用于独立
交叉复核，没有加入只存在于 HaGeZi 的条目。

## YouTube 边界

- Google Ads 官方说明列出 YouTube 搜索、首页、订阅和播放页中的视频广告位置：
  <https://support.google.com/google-ads/answer/2375464>
- YouTube 官方说明广告拦截器可能导致视频播放被限制：
  <https://support.google.com/youtube/answer/14129599>

YouTube 的具体播放器 JSON 字段和同域广告路径属于客户端实现细节，可能随时变化。
本项目只使用自编写的保守清理器，不复制第三方去广告脚本。

## App 广告网络

- 腾讯优量汇开发者协议确认优量汇 SDK 用于在 App 和网站中展示广告：
  <https://public.gdtimg.com/adnet-web/static/agreement/%E8%85%BE%E8%AE%AF%E5%B9%BF%E5%91%8A%E4%BC%98%E9%87%8F%E6%B1%87%E5%BC%80%E5%8F%91%E8%80%85%E5%8D%8F%E8%AE%AE-20250514.pdf>
- V2Fly 社区域名库将腾讯、字节跳动、百度和 Unity 的相关主机标记为广告/追踪用途：
  <https://github.com/v2fly/domain-list-community/blob/master/data/tencent>
  <https://github.com/v2fly/domain-list-community/blob/master/data/bytedance>
  <https://github.com/v2fly/domain-list-community/blob/master/data/baidu>
  <https://github.com/v2fly/domain-list-community/blob/master/data/unity>
- 腾讯优量汇常见 GDT 精确请求主机与路径交叉参考：
  <https://gist.github.com/Y123456-hzy/dd342a1a61daf8c250b112faa1381918>

本项目没有整表导入第三方清单，只人工选取广告用途较明确的条目。腾讯旗下大量正常服务
共用 `qq.com` 与 `gtimg.com`，因此只封锁清单列出的精确主机。

## 博彩域名

- 收录来源：StevenBlack `gambling-only` hosts：
  <https://github.com/StevenBlack/hosts/tree/master/alternates/gambling-only>
- 交叉复核：HaGeZi Gambling DNS Blocklist：
  <https://github.com/hagezi/dns-blocklists#gambling>

2026-07-27 批次从两份清单的 3,597 个交叉命中中选出 200 条。选取时进一步要求域名
名称含明确博彩语义，并在 `casino`、`bet`、`poker`、`slot`、`bingo`、`lotto`、
`lottery`、`gambl`、`jackpot`、`roulette`、`sportsbook`、`bookmaker` 和
`wager` 关键词组之间轮换，减少单一站点镜像对清单的占用。

StevenBlack 是这 200 条数据的许可来源；HaGeZi 只用于独立交叉复核，没有收录只存在于
HaGeZi 的域名。第三方许可声明见 `THIRD_PARTY_NOTICES.md`。

“91视频 / 91porn”的公开资料将其分类为成人视频网站，不是博彩网站。本项目没有因为
关键词搜索而将其错误归入博彩类别；若将来增加成人内容类别，应另设清单和独立策略。
