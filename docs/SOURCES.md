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

## YouTube 边界

- Google Ads 官方说明列出 YouTube 搜索、首页、订阅和播放页中的视频广告位置：
  <https://support.google.com/google-ads/answer/2375464>
- YouTube 官方说明广告拦截器可能导致视频播放被限制：
  <https://support.google.com/youtube/answer/14129599>

YouTube 的具体播放器 JSON 字段和同域广告路径属于客户端实现细节，可能随时变化。
本项目只使用自编写的保守清理器，不复制第三方去广告脚本。
