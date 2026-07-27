# Adcote Shadowrocket Web Guard

一个面向 Shadowrocket 的网页安全拦截模组。命中本地维护的广告、诈骗或博彩域名后，浏览器会被重定向到：

`https://block.rainyxin.cyou/blocked?category=<类别>&source=shadowrocket`

当前是第一阶段：先完成可生成、可校验、可导入的 Shadowrocket 模组。拦截页和正式威胁情报源将在后续阶段接入。

## 当前设计

- 使用 Shadowrocket 原生 `[URL Rewrite]` 和 `[MITM]`。
- 按 `ads`、`scam`、`gambling` 三类生成独立规则。
- 默认只向拦截页传递类别和来源，不上传原始 URL。
- `block.rainyxin.cyou` 永远不会进入拦截清单，避免重定向循环。
- 清单中的 `.test` 域名只是演示项；部署前应替换或扩充为经审核的正式域名源。

## 项目结构

```text
blocklists/domains.csv              分类域名清单（人工维护）
modules/rainyxin-web-guard.sgmodule 生成后的 Shadowrocket 模组
scripts/generate-module.mjs         模组生成器
scripts/validate.mjs                清单和产物校验器
tests/generator.test.mjs            自动化测试
docs/THREAT-MODEL.md                能力、隐私和边界说明
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

## 发布前待办

- 为 `block.rainyxin.cyou` 配置 DNS、HTTPS 和拦截页。
- 接入可信且有许可证的广告/诈骗/博彩域名源。
- 增加误报申诉、临时放行和清单回滚机制。
- 用真实 iPhone + Shadowrocket 完成端到端测试。

## 许可证

[MIT](LICENSE)
