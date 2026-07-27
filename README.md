# Adcote Shadowrocket Web Guard

一个面向 Shadowrocket 的网页安全拦截模组。命中本地维护的广告、诈骗或博彩域名后，浏览器会被重定向到拦截页。

项目包含可生成、可校验、可导入的 Shadowrocket 模组，以及由自有服务器提供的 HTTPS 的拦截页。

## 当前设计

- 使用 Shadowrocket 原生 `[URL Rewrite]` 和 `[MITM]`。
- 按 `ads`、`scam`、`gambling` 三类生成独立规则。
- 原始目标只保存在浏览器 URL 片段（`#target=`）中，不会发送给拦截页服务器。
- “无视风险，继续访问”需要二次确认，并只接受 `http` 或 `https` 目标。
- 博彩类别会自动转到互联网违法和不良信息举报中心的匿名举报页。

## 项目结构

```text
blocklists/domains.csv              分类域名清单（人工维护）
modules/rainyxin-web-guard.sgmodule 生成后的 Shadowrocket 模组
block-page/                         拦截页、交互逻辑和 9999 端口服务
deploy/                             systemd 与 Nginx 部署模板
scripts/generate-module.mjs         模组生成器
scripts/validate.mjs                清单和产物校验器
tests/generator.test.mjs            自动化测试
tests/block-page.test.mjs           拦截页安全逻辑测试
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

## 已审核的广告网络域名

当前仅加入服务商文档能够明确确认用途的主机：

- Google AdSense：`pagead2.googlesyndication.com`
- Taboola：`cdn.taboola.com`、`trc.taboola.com`
- Outbrain：`widgets.outbrain.com`
- Microsoft Advertising：`bat.bing.com`
- 百度联盟：`cpro.baidu.com`、`cpro.baidustatic.com`

广告域名通常作为第三方资源加载。命中后可阻止广告资源，但不保证每次都会触发顶层页面跳转。

## 拦截页

本地启动：

```bash
npm run start:block-page
```

本地开发服务默认监听 `127.0.0.1:9999`。生产环境中，Nginx 在公网 `9999` 端口终止 TLS，再反向代理到只监听 `127.0.0.1:9998` 的页面服务，从而不影响服务器现有的 Xray 443 端口。

页面不加载第三方字体、脚本、图片或分析服务，并设置 CSP、无引用来源和权限限制等安全响应头。

## 后续待办

- 接入可信且有许可证的诈骗和博彩域名源。
- 增加误报申诉、临时放行和清单回滚机制。
- 用真实 iPhone + Shadowrocket 完成端到端测试。

## 许可证

[MIT](LICENSE)
