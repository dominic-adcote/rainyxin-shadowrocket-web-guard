# 哔哩哔哩专项规则测试

## 测试前

1. 在 Shadowrocket 中刷新 `Adcote 全广告诈骗追踪拦截` 模组。
2. 完全退出哔哩哔哩 App 后重新打开。
3. 确认新模组的 `[Rule]` 中存在 `data.bilibili.com` 和
   `dataflow.biliapi.com`，且规则类型为精确 `DOMAIN`。

## 广告与追踪检查

- 冷启动时是否仍出现开屏广告。
- 首页推荐流、搜索结果和动态中是否仍出现带“广告”或“推广”标记的卡片。
- 视频播放前后、暂停页和播放器内是否出现推广内容。
- 直播间和游戏中心是否仍出现广告或推广弹层。

这些广告可能与正常内容共用 `app.bilibili.com` 或 `api.bilibili.com`。本批没有
封锁这两个主机，因此仍可能看到共域广告；不要为了消除单个广告而直接拒绝整个主 API。

## 必测正常功能

- 登录状态、首页推荐、搜索、动态和个人中心。
- 普通视频、番剧、1080P/高码率、进度拖动和自动连播。
- 弹幕、评论、点赞、投币、收藏、关注和分享。
- 直播播放与聊天、小程序、游戏下载或更新。

## 出现异常时

记录异常时间、功能、Shadowrocket 命中的完整域名和恢复所需的放行项。优先测试放行
以下两条 experimental 规则：

```text
data.bilibili.tv
tracker.chat.bilibili.com
```

若问题仍存在，再逐条测试其余精确域名。不要放行或封锁整个 `bilibili.com`、
`biliapi.com`、`biliapi.net`、`bilivideo.com` 或 `hdslb.com`。
