# SIKY HUB · blog-v5

> Siky 的个人技术博客，基于 Astro 7 纯静态生成，部署于 Cloudflare Pages。
> 在线站点：[siky.top](https://siky.top)

复刻并扩展了 [siky.top](https://siky.top) 的 Hub 门户设计语言——亮蓝底 + monospace 终端风 + 几何动画装饰，并在此基础上构建完整的博客系统。

## ✨ 特性

- **Hub 首页**：几何动画背景（菱形/圆/三角/方块漂浮）、SIKY_HUB 标题、一言 API 轮播、项目卡片入口、QR Clock 弹窗、十六进制彩蛋，附带最新文章列表
- **博客系统**：文章列表、详情页、上下篇导航、标签云 + 标签筛选页（`/tags/[tag]`）
- **阅读体验**：浮动目录 TOC（滚动高亮）、顶部阅读进度条、回到顶部、阅读时长估算、代码块复制按钮
- **明暗主题**：dark（默认蓝底）/ light 双主题，无闪屏切换，跨路由持久化；首页自动跟随，内页 Header 提供切换按钮
- **背景持久化**：View Transitions + `transition:persist`，路由切换时几何动画连续播放不重置
- **首图自动生成**：无 heroImage 的文章自动渲染品牌 SVG 封面（foreignObject 渲染中文，零依赖）
- **代码高亮**：Shiki `github-dark` 暗色主题
- **SEO**：sitemap、RSS feed、Open Graph、canonical URL
- **移动端**：汉堡菜单 + 响应式布局

## 🛠 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | [Astro 7](https://astro.build)（纯静态输出，无前端框架） |
| 语言 | TypeScript（strict）+ Markdown |
| 集成 | `@astrojs/mdx`、`@astrojs/rss`、`@astrojs/sitemap` |
| 图片 | `astro:assets` + sharp |
| 包管理 | pnpm |
| 部署 | Cloudflare Pages |
| 字体 | 本地 Atkinson（`astro:assets` fonts） |

## 📁 项目结构

```text
├── astro.config.mjs        # Astro 配置（site / Shiki / fonts）
├── content.config.ts       # 内容集合 schema（crtime/uptime→pubDate，tags 解析）
├── wrangler.jsonc          # Cloudflare Pages 部署配置
├── DEPLOY.md               # 部署步骤与验证清单
├── public/                 # 静态资源（favicon.svg, qr-clock.png）
└── src/
    ├── assets/             # 本地图片/字体（经 astro:assets 优化）
    ├── components/
    │   ├── BaseHead.astro      # <head> 元数据 + 无闪屏主题脚本 + ClientRouter
    │   ├── BgDecor.astro       # 几何动画背景（transition:persist）
    │   ├── Header.astro        # 导航 + 明暗切换 + 汉堡菜单 + GitHub
    │   ├── Footer.astro        # 十六进制彩蛋 + 版权
    │   ├── FormattedDate.astro # 日期本地化（zh-CN）
    │   ├── HeaderLink.astro    # 导航项（带 active 状态）
    │   └── PostCover.astro     # 缺省首图自动生成（SVG）
    ├── content/
    │   └── blog/               # ← git submodule（SikyChen/blog_repo）
    │       └── md/*.md          # 文章 Markdown
    ├── layouts/
    │   ├── HubLayout.astro     # 内页统一壳（body.hub + BgDecor + Header + Footer）
    │   └── BlogPost.astro      # 文章详情（TOC + 进度条 + 回到顶部 + 半透明面板）
    ├── pages/
    │   ├── index.astro         # 首页（Hub 门户 + 文章列表）
    │   ├── about.astro         # 关于
    │   ├── 404.astro           # 定制 404
    │   ├── rss.xml.js          # RSS feed
    │   ├── blog/
    │   │   ├── index.astro      # 文章列表
    │   │   └── [...slug].astro  # 文章详情（动态路由 + 上下篇 + 阅读时长）
    │   └── tags/
    │       ├── index.astro      # 标签云
    │       └── [tag].astro      # 标签筛选
    ├── consts.ts               # SITE_TITLE / SITE_DESCRIPTION
    └── styles/global.css       # 全局样式 + Hub 设计 token（dark/light）
```

## 📝 内容管理

文章内容以 **git submodule** 形式管理，主仓库只记录指针：

```bash
# 新环境克隆后初始化 submodule
git submodule update --init --recursive

# 拉取内容仓库最新
git submodule update --remote
```

文章 frontmatter 为掘金导出格式，schema 会自动转换：

| 字段 | 说明 |
|---|---|
| `title` | 标题（必填） |
| `description` | 摘要（可选） |
| `crtime` | 创建时间 → 映射为 `pubDate` |
| `uptime` | 更新时间 → 映射为 `updatedDate` |
| `tags` | 逗号分隔字符串（如 `"React,Router"`）→ 解析为数组 |
| `heroImage` | 封面图（可选，缺省时自动生成品牌 SVG） |

## 🚀 命令

| 命令 | 说明 |
|---|---|
| `pnpm install` | 安装依赖（Node ≥ 22.12） |
| `pnpm run dev` | 本地开发 http://localhost:4321 |
| `pnpm run build` | 生产构建到 `dist/` |
| `pnpm run preview` | 预览构建产物 |
| `pnpm run deploy` | 构建并部署到 Cloudflare Pages（需 `wrangler login`） |

## ☁️ 部署

目标平台 Cloudflare Pages，两种方式：

1. **Git 集成（推荐）**：推送仓库后在 CF 面板连接，构建命令 `pnpm run build`、输出 `dist`
2. **wrangler CLI**：`pnpm run deploy`

详细步骤与部署后验证清单见 [DEPLOY.md](DEPLOY.md)。

## 📄 文档

- [SPEC.md](SPEC.md) — 项目开发规范（目标、结构、代码风格、边界、已知问题）
- [DEPLOY.md](DEPLOY.md) — 部署指南

## Credit

设计语言源自 [siky.top](https://siky.top) Hub 门户（Hono + Vite），本仓库以 Astro 重写并扩展为博客。全局排版基础参考 [Bear Blog](https://github.com/HermanMartinus/bearblog/)（MIT）。
