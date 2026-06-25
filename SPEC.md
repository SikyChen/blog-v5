# SPEC.md — blog-v5 博客项目开发规范

> 本文档用于指导 AI（及人类协作者）在本项目上持续开发与优化。任何改动都应先与本文档对齐；若文档与代码现实冲突，先改文档再改代码。
>
> 最后更新：2026-06-25｜Astro 版本：7.x｜状态：初版（基于现有代码勘察 + 用户确认）

---

## 1. Objective（目标与用户）

### 项目定位
blog-v5 是 **Siky 的个人技术博客**，基于 Astro 7 静态站点生成器，内容以 Markdown 文章为主。

### 目标用户
- 读者：访问站点阅读技术文章的开发者。
- 作者（Siky 本人）：通过 git submodule 维护内容仓库，低门槛发布与更新文章。

### 本轮优化目标（用户确认）
1. **本地化与品牌**：去除 Astro 默认英文模板痕迹，替换为 Siky 的个人内容（站点标题、首页文案、About、Header 社交链接、favicon 等）。
2. **视觉与体验**：重做视觉设计、响应式、文章排版（prose）、代码高亮。
3. **功能增强**：基于现有 `tags` 字段做标签页/筛选；评估搜索、评论、文章目录、暗色模式等。

### 非目标（本轮不做）
- 不做 SSR / 动态后端（保持纯静态输出，部署到 Cloudflare Pages）。
- 不引入 React/Vue 等前端框架（除非功能确需，需先讨论）。
- 不重写内容仓库（blog_repo submodule）的历史与结构。

### 验收标准
- `pnpm build` 成功产出 `dist/`，无报错。
- 所有文章详情页在 Cloudflare Pages 预览环境可正常访问（HTTP 200）。
- 站点标题、首页、About 不再出现 Astro 默认占位文案。
- 新增功能有对应的页面入口且在移动端可用。

---

## 2. Commands（命令）

包管理器：**pnpm**（项目已有 `pnpm-lock.yaml`，禁止改用 npm/yarn）。

| 命令 | 用途 | 备注 |
|---|---|---|
| `pnpm install` | 安装依赖 | Node ≥ 22.12.0 |
| `pnpm run dev` | 本地开发（http://localhost:4321） | 改动 frontmatter/schema 后会自动重载 |
| `pnpm run build` | 生产构建到 `dist/` | **当前会失败**，见 §7 已知问题 |
| `pnpm run preview` | 预览构建产物 | 验证静态产物的真实行为 |
| `pnpm run astro ...` | 直接调用 astro CLI | |

### Git / Submodule 命令
内容以 submodule 形式管理：
```bash
git submodule add <repo> src/content/blog   # 已完成
git submodule update --init --recursive     # 新环境克隆后初始化
git submodule update --remote               # 拉取内容仓库最新
```
> 主仓库只记录 submodule 的 commit 指针；文章内容的增删在 `blog_repo` 仓库内进行。

---

## 3. Project Structure（项目结构）

```
blog-v5/
├── astro.config.mjs        # Astro 配置（site/integrations/fonts）
├── content.config.ts       # 内容集合 schema（已用 transform 映射 crtime/uptime → pubDate/updatedDate）
├── tsconfig.json           # 继承 astro/strict，开启 strictNullChecks
├── package.json
├── public/                 # 静态资源（favicon.svg, favicon.ico）
├── src/
│   ├── assets/             # 本地图片/字体（经 astro:assets 优化）
│   │   ├── blog-placeholder-1..5.jpg
│   │   └── fonts/atkinson-*.woff
│   ├── components/
│   │   ├── BaseHead.astro      # <head> 元数据 + 全局 CSS 引入
│   │   ├── Header.astro        # 顶部导航 + 社交链接（仍为 Astro 占位）
│   │   ├── HeaderLink.astro
│   │   ├── Footer.astro
│   │   └── FormattedDate.astro
│   ├── content/
│   │   └── blog/               # ← git submodule（blog_repo）
│   │       ├── md/*.md          # 文章 Markdown
│   │       ├── list.json        # 旧导出数据（见 §7 待清理）
│   │       └── assets/          # 文章内引用的图片
│   ├── layouts/
│   │   └── BlogPost.astro       # 文章详情布局
│   ├── pages/
│   │   ├── index.astro          # 首页（仍为 Astro 占位文案）
│   │   ├── about.astro          # About 页（Lorem ipsum，需本地化）
│   │   ├── rss.xml.js           # RSS feed
│   │   └── blog/
│   │       ├── index.astro      # 文章列表
│   │       └── [...slug].astro  # 文章详情动态路由
│   ├── consts.ts                # SITE_TITLE / SITE_DESCRIPTION（仍为默认值）
│   ├── env.d.ts
│   └── styles/global.css        # 全局样式（基于 Bear Blog）
└── src/content/blog            # submodule，勿直接提交内容到主仓库
```

### 路由约定
- 文章 URL：`/blog/<slug>/`，`slug` 由 Astro glob loader 从文件名生成（**会被小写化、空格转连字符、`~` 等特殊字符被剥离**）。
- 列表页链接使用 `post.id`（即 slug），勿手动拼接文件名。
- 文章 frontmatter 的 `id` 字段（如 `"9"`）是旧系统文章 ID，**不是路由 slug**，不要用于构造 URL。

### 内容 Schema（content.config.ts）
文章 frontmatter 实际字段（掘金导出格式）：
- `title` (string, 必填)
- `description` (string, 可选)
- `crtime` (date, 必填) → 经 transform 映射为 `pubDate`
- `uptime` (date, 可选) → 经 transform 映射为 `updatedDate`
- `tags` (string, 形如 `"JavaScript,React,Router"`) — 暂未在 schema 中声明，标签功能需先规范化
- `id` / `author` / `pv` 等旧字段

> **新增文章时**：在 `blog_repo` 仓库的 `md/` 下新建 `.md`，至少包含 `title`、`crtime`、`description`。如做标签功能，需先在 schema 中声明 `tags` 并定义解析方式（字符串逗号分隔 vs 数组）。

---

## 4. Code Style（代码风格）

### 通用
- **语言**：与用户沟通、注释、文档使用中文；代码标识符用英文。
- 缩进：**Tab**（现有 `.astro`/`.ts` 均用 Tab，保持一致）。
- 引号：字符串用单引号 `'`（与现有代码一致）。
- 分号：语句末尾加分号（现有风格）。
- 文件末尾保留空行。

### Astro / TypeScript
- 组件用 `.astro`，逻辑用 TypeScript，启用 strict 模式。
- 类型优先用 `type` 导入：`import { type CollectionEntry } from 'astro:content'`。
- 页面 `<head>` 统一通过 `<BaseHead />` 注入，不要在各页面重复写 meta。
- 日期展示统一用 `<FormattedDate date={...} />`。
- 样式：页面级用 `<style>` scoped；全局变量放 `src/styles/global.css` 的 `:root`。

### 内容引用
- 图片优先用 `astro:assets` 的 `<Image />` 或 `import` 方式（享受优化）；外链图（掘金 CDN）保持 `<img>`/Markdown 语法即可。
- 不要在主仓库内直接修改 `src/content/blog/` 下的内容文件——那是 submodule，改动应在 blog_repo 仓库进行。

---

## 5. Testing Strategy（测试策略）

### 现状
项目**无自动化测试框架**。tsconfig 为 strict，类型检查是当前主要的静态保障。

### 验证清单（每次改动后手动执行）
1. `pnpm run dev` —— 首页、列表页、各文章详情页可访问，无 `InvalidContentEntryDataError`。
2. `pnpm run build` —— 构建成功，无 `UNRESOLVED_IMPORT` 等错误。
3. `pnpm run preview` —— 用编码后的 URL 验证中文 slug 详情页返回 200。
4. 移动端视口（≤720px）下布局不溢出。

### 何时引入测试
- 若新增复杂工具函数（如 slug 生成、标签解析），可引入 Vitest 做单元测试。
- 视觉回归暂不要求；如需，再评估 Playwright。
- **不强制**为纯静态展示型页面写测试。

---

## 6. Boundaries（边界规则）

用户选择「保守」模式。以下为 AI 行为边界：

### 可以直接做
- 修改 `src/` 下的代码、样式、组件、页面。
- 修改 `astro.config.mjs`、`tsconfig.json`、`content.config.ts`。
- 运行 `pnpm run dev/build/preview` 验证。
- 在 `blog_repo` 仓库内增删文章（需明确告知用户）。

### 必须先确认
- **构建/部署配置变更**：改 `site` 域名、加 Cloudflare 适配器、改 `base` 路径。
- **删数据文件**：如删除 `list.json`、占位图等。
- **改 frontmatter 规范**：如把 `crtime` 改名 `pubDate`、调整 `tags` 解析方式（影响所有文章）。
- **引入新依赖**：尤其是 UI 框架（React/Vue）、Tailwind、评论系统、搜索方案。
- **submodule 指针变更**：`git submodule` 相关操作。
- **不可逆操作**：`git push`、删除 git 历史、force push。

### 禁止
- 在主仓库内直接提交 `src/content/blog/` 下的内容（应走 submodule）。
- 改用 npm/yarn 替代 pnpm。
- 未经确认修改 `.git`、`.gitmodules`。
- 删除或覆盖用户未创建、且与描述不符的文件。

---

## 7. Known Issues（已知问题与技术债）

> 优化工作的优先级起点。每项修复后请勾选并简述验证方式。

### P0 — 阻断构建
- [x] ~~**`pnpm build` 失败**~~：[about.astro:2](src/pages/about.astro#L2) 引用 `src/assets/blog-placeholder-about.jpg`，该文件不存在。**已修复（2026-06-25，用户补充配图）**，`pnpm build` 通过，10 页产出。

### P1 — 影响访问/SEO
- [ ] **详情页 404 风险**：dev/preview 下中文 slug 返回 200（已验证），但需在 **Cloudflare Pages 真实环境**验证。文件名含中文/空格/`~` 在不同部署环境可能因 URL 编码或文件系统差异 404。建议方案：在 frontmatter 显式声明 `slug` 字段（英文短横线），或用 slugify 生成稳定 slug，避免依赖原始中文文件名。
- [ ] **`astro.config.mjs` 的 `site` 仍为 `https://example.com`**：影响 sitemap、RSS、canonical URL、OG 链接。需改为真实域名。
- [ ] **`consts.ts` 标题/描述仍为默认**：`SITE_TITLE='Astro Blog'`、`SITE_DESCRIPTION='Welcome to my website!'`。

### P2 — 本地化与品牌（本轮重点）
- [x] ~~[pages/index.astro](src/pages/index.astro) 首页是 Astro astronaut 占位文案。~~ **已复刻 siky.top Hub 首页（2026-06-25）**：几何动画背景（`BgDecor.astro`）+ SIKY_HUB 标题 + 一言 API 轮播 + 4 张卡片（BLOG→`/blog/` 内链，HONO+VITE / 轻烟→外链，QR CLOCK→弹窗）+ 十六进制彩蛋 + **新增文章列表**（最新 5 篇）。设计 token 与 hub 样式见 [global.css](src/styles/global.css) 的 `siky.top Hub 风格` 段。
- [x] ~~[pages/about.astro](src/pages/about.astro) 是 Lorem ipsum → 改中文占位。~~ **已改中文占位（2026-06-25）**。
- [x] ~~[components/Header.astro](src/components/Header.astro) 社交链接指向 Astro 官方 → 换 GitHub（SikyChen），并适配 hub monospace 风格。~~ **已完成**：Header 重写为 hub 风格（SIKY_HUB wordmark + HOME/BLOG/ABOUT 导航 + GitHub 图标），HeaderLink 改纯透传。
- [x] ~~[components/Footer.astro](src/components/Footer.astro) 待检查。~~ **已重写**：hub 风格 + 十六进制彩蛋 + 版权。
- [x] ~~favicon 待换个人品牌图标（当前仍是 Astro 默认）。~~ **已换（2026-06-25）**：黑底圆角 + 白色方框 + 黄色点缀，呼应 Hub 几何风格；移除旧 `favicon.ico`。

### P2 补充 — 配套换肤（2026-06-25 完成）
- [x] 新增 [layouts/HubLayout.astro](src/layouts/HubLayout.astro)：`body.hub` + BgDecor + Header + Footer 壳，供博客列表/详情/About 复用。
- [x] [blog/index.astro](src/pages/blog/index.astro) 重写为蓝底 monospace 卡片列表。
- [x] [BlogPost.astro](src/layouts/BlogPost.astro) 重写为 HubLayout + 蓝底 prose + 上下篇导航（prev/next 由 [...slug].astro 计算）。
- [x] [FormattedDate.astro](src/components/FormattedDate.astro) 日期本地化 `zh-CN`。
- [x] [global.css](src/styles/global.css) 新增 `.hub-page` 与 `.hub .prose` 样式段（白字、黄链接、深色代码块、引用、表格适配蓝底）。

### P3 — 功能与体验（本轮重点）
- [x] ~~**标签系统**~~ **已完成（2026-06-25）**：[content.config.ts](src/content.config.ts) 加 `tags` 字段（逗号字符串转数组）；详情页可点击标签、列表页卡片标签 + 标签入口；新增 [tags/index.astro](src/pages/tags/index.astro) 标签云 + [tags/[tag].astro](src/pages/tags/[tag].astro) 标签筛选页（6 个标签）。
- [x] ~~代码块无高亮~~ **已配置 Shiki `github-dark` 暗色主题**（[astro.config.mjs](src/astro.config.mjs) `markdown.shikiConfig`），适配蓝底。
- [x] ~~暗色模式~~ **已完成（2026-06-25）**：整站颜色 token 化（`--hub-fg`/`--hub-decor`/`--hub-card-bg`/`--hub-border` 等），`:root` dark 默认 + `[data-theme=light]` 覆写；BaseHead 无闪屏脚本（localStorage → 系统偏好）；Header 右上角明暗切换按钮（首页无 Header 自动跟随）；切换持久化跨路由。
- [x] ~~移动端汉堡菜单~~ **已完成**：≤720px 导航折叠为下拉面板，汉堡按钮带动画。
- [x] ~~RSS 链接错误~~ **已修复**：[rss.xml.js](src/pages/rss.xml.js) 链接从 `/blog/md/<slug>/` 改为 `/blog/<slug>/`，并显式映射字段（避免 heroImage 序列化问题）。
- [x] ~~文章封面图~~ **列表页已支持** heroImage 缩略图展示（当前无文章声明，将来加上即自动渲染）。
- [ ] 无评论、无搜索（搜索暂不做，评论按需评估）。

### P4 — 体验优化
- [x] ~~移动端汉堡菜单~~ **已完成**：≤720px 导航折叠下拉 + 动画，按钮靠右挨着明暗切换。
- [x] ~~文章封面图~~ **列表页已支持** heroImage 缩略图。
- [x] ~~阅读进度条 + 回到顶部~~ **已完成（2026-06-25）**：固定顶部进度条 + 右下角回到顶部按钮（滚动 >600px 显隐）。
- [x] ~~文章目录 TOC~~ **已完成**：浮动目录按钮（左下角）+ 面板，IntersectionObserver 滚动高亮，ESC/点击关闭。
- [x] ~~文章半透明背景~~ **已完成**：`.post` 加 `--hub-article-bg` 半透明面板 + `backdrop-filter`，避免悬浮几何元素干扰正文。
- [x] ~~阅读时长~~ **已完成（2026-06-25）**：[blog/[...slug].astro](src/pages/blog/[...slug].astro) 按 CN 300 字/分 + EN 200 词/分估算，详情页 meta 展示「约 N 分钟」。
- [x] ~~代码块复制按钮~~ **已完成**：详情页每个 `<pre>` 注入复制按钮（hover 显，复制后「已复制」反馈）。
- [x] ~~OG 分享图~~ **已完成**：heroImage 经 HubLayout 透传到 BaseHead 的 `og:image`（无封面时回退占位图）。
- [x] ~~文章首图缺省自动生成~~ **已完成（2026-06-25）**：[PostCover.astro](src/components/PostCover.astro) 内联 SVG 品牌封面（hub 风格 + 几何装饰 + 标题 + wordmark + 标签），无 heroImage 时由 [BlogPost.astro](src/layouts/BlogPost.astro) 渲染为详情页首图。用 foreignObject 渲染标题，浏览器系统字体渲染中文，零依赖。
- [x] ~~404 页面定制~~ **已完成**：[404.astro](src/pages/404.astro) hub 风格，大号「4 0 4」+ 友好文案 + 返回首页/浏览博客入口，未知路由自动兜底。

### 仍待推进
- [ ] **评论系统**（Giscus/Utterances 等，需你提供 GitHub 仓库用于 Giscus 配置）。
- [ ] **部署执行**（需 push 主仓库到 GitHub + Cloudflare 授权，见 [DEPLOY.md](DEPLOY.md)）。
- `src/content/blog/list.json` 属 submodule 内容，按约定不动。

### P4 — 清理
- [ ] `src/content/blog/list.json`：旧导出数据，与 md frontmatter 重复。确认无用途后删除（先问用户）。
- [ ] `src/assets/blog-placeholder-2..5.jpg` 是否仍被引用，未用则清理。

---

## 8. Deployment（部署）

- 目标平台：**Cloudflare Pages**（静态托管）。
- 构建命令：`pnpm run build`，输出目录：`dist`。
- 部署配置：[wrangler.jsonc](wrangler.jsonc)（`pages_build_output_dir: dist`）+ `pnpm run deploy`（构建后 `wrangler pages deploy`）+ [.node-version](.node-version) 锁定 Node 22。
- 部署步骤与验证清单见 [DEPLOY.md](DEPLOY.md)。
- 主仓库需先 push 到 GitHub（当前无 remote），内容仓库 `src/content/blog` 为 submodule（`SikyChen/blog_repo`，需公开以便 CI 拉取）。
- 纯静态输出**无需** Cloudflare adapter；仅当未来引入 SSR/中间件时才加 `@astrojs/cloudflare`。
- `site` 字段已设为 `https://siky.top`。
- **部署后必查**：① `/blog/` 文章是否拉取（submodule）② 中文 slug 详情页 404 ③ `/rss.xml`、`/sitemap-index.xml` 可达 ④ 明暗主题持久化 ⑤ 背景动画跨路由连续。

---

## 附：勘察事实快照（2026-06-25）
- 文章数：7 篇，均在 `src/content/blog/md/`。
- 依赖：`astro@7`、`@astrojs/mdx`、`@astrojs/rss`、`@astrojs/sitemap`、`sharp`。
- dev server 默认端口 4321，preview 端口 4322。
- 已修复：`content.config.ts` schema 与 frontmatter 不匹配（`pubDate` 缺失）→ 改用 `crtime`/`uptime` + transform。
