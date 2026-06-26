# 部署到 Cloudflare Pages

本项目为 Astro 纯静态输出，部署到 Cloudflare Pages。推荐 **Git 集成**,推送 `blog-v5` 即自动部署。

## 仓库结构

- `blog-v5` 主仓库 → `github.com/SikyChen/blog-v5`(代码 + 布局)
- `blog_repo` 内容仓库 → `github.com/SikyChen/blog_repo`(文章 md,作为 `src/content/blog` submodule)

文章内容以 submodule 管理,`blog-v5` 记录的是 `blog_repo` 的某个 commit 指针。

## 方式 A:Git 集成(推荐)

1. 登录 Cloudflare → Workers & Pages → Create → Pages → Connect to Git
2. 选择 `SikyChen/blog-v5` 仓库
3. 构建配置:
   - Framework preset: `Astro`
   - Build command: `pnpm run build`
   - Build output directory: `dist`
   - Environment variables:
     - `NODE_VERSION` = `22`
     - `PNPM_VERSION` = `9`(或当前使用的版本,`pnpm -v` 查看)
4. Save and Deploy

> ⚠️ **submodule 注意**:Cloudflare Pages 默认会初始化 submodule。部署后第一时间检查 `/blog/` 是否有文章——若为空,说明 submodule 未拉取,需在仓库根加 `.gitmodules`(已有)并确认 `blog_repo` 为公开仓库;仍失败则改用方式 B。

## 方式 B:wrangler CLI 直传(本地构建后上传)

```bash
# 1. 安装 wrangler(已配置 deploy 脚本,可全局或 npx)
npm install -g wrangler

# 2. 登录(浏览器交互授权)
wrangler login

# 3. 一键构建 + 部署(读取 wrangler.jsonc 的 pages_build_output_dir=dist)
pnpm run deploy
```

首次部署会提示创建项目,输入项目名 `blog-v5` 即可。之后每次 `pnpm run deploy` 自动构建并上传。

## 部署后验证清单

- [ ] 首页 `https://siky.top/` 可访问,Hub 界面正常,几何动画播放
- [ ] `/blog/` 文章列表有 7 篇(submodule 拉取成功)
- [ ] 中文 slug 详情页可访问(如 `/blog/一起来实现一个简单的-react-router-吧/`)—— **重点验证 Cloudflare 对中文 URL 的处理**
- [ ] `/tags/` 标签云 + `/tags/React/` 等筛选页正常
- [ ] `/rss.xml` 可访问且包含文章
- [ ] `/sitemap-index.xml` 可访问
- [ ] 明暗切换按钮工作,刷新/换页后主题保持(localStorage 持久化)
- [ ] 路由切换时背景几何动画不重置(View Transitions + persist)
- [ ] 移动端布局正常

## 绑定自定义域名

Cloudflare Pages → 项目 → Custom domains → 添加 `siky.top`(及 `www.siky.top`)。若域名已在 Cloudflare DNS 管理,会自动配置 CNAME。

> 接管 siky.top 根域后,原 Hono+Vite Hub 页面将被本站替换。原 Hub 中的 QR CLOCK / 轻烟 / HONO+VITE 仍作为外链卡片指向各自子域,需确认那些子项目部署不受影响。

## 内容自动部署(改 md 即发布)

`blog_repo` 内容更新后自动触发 `blog-v5` 重建,通过两个 GitHub Actions 串联:

```
blog_repo push → [trigger workflow] → repository_dispatch → [update-content workflow]
  → 更新 blog-v5 submodule 指针并 push → Cloudflare Pages 自动构建
```

### 一次性配置

1. **创建 GitHub PAT**:GitHub → Settings → Developer settings → Personal access tokens (classic) → Generate new token,勾选 `repo` 权限。
2. **两个仓库都加 Secret**:在 `blog_repo` 和 `blog-v5` 仓库的 Settings → Secrets and variables → Actions → New repository secret,名称 `BLOG_V5_PAT`,值为上一步的 token。
3. **确认 workflow 文件已就位**:
   - `blog_repo`:`.github/workflows/trigger-blog-v5.yml`(push 时通知 blog-v5)
   - `blog-v5`:`.github/workflows/update-content.yml`(收到通知后更新 submodule 并 push)

### 日常发文流程(全自动)

```bash
# 在 blog_repo 仓库内
git add . && git commit -m "new post"
git push
# 之后自动:blog_repo → 触发 → blog-v5 更新指针 → push → Cloudflare 构建
```

无需手动操作 `blog-v5`。在 GitHub 两个仓库的 Actions 页可看到串联的运行记录。

### 手动触发

- `blog-v5` 仓库 Actions → `Update content submodule` → Run workflow(跳过 blog_repo,直接拉最新内容)
- `blog_repo` 仓库 Actions → `Trigger blog-v5 rebuild` → Run workflow(手动通知 blog-v5)

> 注:`blog_repo` 的 workflow 文件需 push 到 `SikyChen/blog_repo` 仓库才生效(主仓库内 `src/content/blog/.github/` 只是 submodule 工作区副本)。

## 缓存策略

[public/_headers](public/_headers) 配置 Cloudflare Pages 的缓存,确保文章更新后刷新即可见:

- **HTML 页面**(`/*`):`max-age=0, must-revalidate` —— 不缓存,每次请求都回源验证,内容更新立即可见
- **带 hash 的构建产物**(`/_astro/*`):`max-age=31536000, immutable` —— 一年长缓存,文件名含 hash,内容变即换名,安全
- **RSS / sitemap**:5 分钟短缓存,平衡实时性与流量

> 这解决了一个具体问题:更新文章 push 后,页面刷新不出新内容,需「清空缓存硬性重载」才可见。根因是 CF 默认缓存 HTML,`_headers` 强制 HTML 不缓存即可解决。`<meta http-equiv>` 对 CDN 无效,必须用 `_headers`。
