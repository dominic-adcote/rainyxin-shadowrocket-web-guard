# 1,500+ 高置信度广告与追踪器域名集合报告

> [!IMPORTANT]
> 本次收集并验证了总计 **1,546 条** 高置信度纯广告与追踪器域名，分为三大专项部分，全部使用标准的 **AdGuard / uBlock Origin (`||domain^`)** 语法保存。

> [!NOTE]
> 这是用户提供的原始集合说明，不代表本项目已独立验证其中每一条的用途或授权来源。
> 三部分共有 1,546 行，但 Part 2 与 Part 3 存在 46 条精确重复，实际为 1,500 个
> 精确唯一域名。结合项目既有规则去重后，仓库净保存 1,311 条来源规则；详见下表。

---

## 📦 规则清单汇总

| 部分 | 分类说明 | 域名数量 | 对应文件链接 |
| :--- | :--- | :--- | :--- |
| **Part 1** | **国内开屏广告与应用内广告** | 原始 301 / 净保存 286 条 | [`imported-app-ad-domains.txt`](../blocklists/imported-app-ad-domains.txt) |
| **Part 2** | **国外大小众广告域名** | 原始 745 / 净保存 525 条 | [`imported-global-ad-domains.txt`](../blocklists/imported-global-ad-domains.txt) |
| **Part 3** | **全球已知追踪器域名** | 原始及保存 500 条 | [`imported-tracker-domains.txt`](../blocklists/imported-tracker-domains.txt) |
| **总计** | **全合一合并汇总** | 原始 1,546 / 唯一 1,500 / 净保存 1,311 条 | *包含以上三部分* |

---

## 🔍 分类架构与覆盖范围

### 1. 国内开屏广告与应用内广告 (301 条)
重点拦截 App 启动开屏广告 (Splash Ads)、应用内插屏/激励视频广告 (Interstitial/Rewarded Video Ads) 以及聚合广告 SDK 请求：
- **主流 SDK 覆盖**：穿山甲/巨量引擎 (GroMore/Pangolin)、腾讯广点通 (GDT)、百度联盟/Mobads、快手磁力引擎、Sigmob、TopOn (AnyThink)、AdScope。
- **手机厂商广告**：小米 (MIUI/Pandora)、华为 (Petal Ads/Hicloud)、OPPO (HeyTap)、Vivo、魅族等。
- **音视频及应用开屏**：爱奇艺 (Cupid)、优酷 (ATM)、哔哩哔哩 (CM)、喜马拉雅、酷狗/腾讯音乐、12306、美图、乐视等。

### 2. 国外大小众广告域名 (745 条)
涵盖全球各大网络平台以及中小型/小众细分领域的广告分发服务器：
- **科技巨头与头部平台**：Google (Doubleclick/Googlesyndication/AdSense)、Meta (Audience Network)、Amazon Ads、Microsoft/Bing Ads、Twitter/X Ads、TikTok Ads、Apple Search Ads、Yahoo/Verizon。
- **程序化 DSP/SSP/ADX**：Rubicon Project, Magnite, PubMatic, OpenX, The Trade Desk, Index Exchange, TripleLift, Media.net, Sovrn, SmartAdServer (Equativ), LiveRamp, Criteo, Taboola, Outbrain 等。
- **移动/游戏/弹窗/小众平台**：Unity Ads, AppLovin, Vungle, IronSource, Chartboost, InMobi, Smaato, PropellerAds, PopAds, ExoClick, Adsterra, RevContent, MGID, Buysellads, Skimlinks, Podtrac (播客广告), Roku/Samba (智能电视广告), Zeropark (推送广告) 等。

### 3. 全球已知追踪器域名 (500 条)
专注于用户行为采集、隐私监控与设备指纹识别（严格排除纯广告展示域名，避免误杀）：
- **Web Analytics 网页分析**：Google Analytics, Adobe Analytics (Omtrdc), Mixpanel, Amplitude, Yandex Metrika, Heap Analytics, Chartbeat, StatCounter, Plausible, Fathom 等。
- **Session Recording & Heatmaps 会话录制与热力图**：Hotjar, FullStory, Mouseflow, Smartlook, Microsoft Clarity, LogRocket, Inspectlet, CrazyEgg, ContentSquare 等。
- **A/B Testing & Optimization**：Optimizely, VWO, AB Tasty, Kameleoon, LaunchDarkly, Split.io, Statsig, Dynamic Yield 等。
- **Attribution & CDP 数据平台与归因**：Segment, mParticle, Tealium, AppsFlyer, Adjust, Branch.io, Kochava, Singular, Voluum 等。
- **Fingerprinting & Fraud / Social / Telemetry**：FingerprintJS, Iovation, Castle, Seon, Facebook Pixel, LinkedIn Insight Tag, Twitter Pixel, Klaviyo (邮件开封追踪), OneSignal (推送遥测), New Relic/Sentry (性能遥测) 等。

---

## 💡 使用指南

1. **AdGuard / uBlock Origin**：可以直接订阅或导入上述 `.txt` 规则文件。
2. **DNS 级拦截 (Pi-hole / AdGuard Home)**：规则中的 `||domain^` 语法可直接解析提取为标准的黑名单列表。
3. **配合建议**：在手机端结合自动跳过工具（如 GKD），网络层拦截与本地无障碍模拟点击相结合，能达到最佳的开屏广告去处体验。
