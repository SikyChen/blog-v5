# 部署到 Cloudflare Pages

本项目为 Astro 纯静态输出，部署到 Cloudflare Pages 有两种方式。推荐 **方式 A(Git 集成)**,推送即自动部署。

## 前置:推送主仓库到 GitHub

主仓库当前无 git remote,需先在 GitHub 创建仓库并推送(注意:内容仓库 `src/content/blog` 是 submodule,指向 `SikyChen/blog_repo`,需保持为公开仓库以便 CI 拉取):

```bash
git remote add origin git@github.com:SikyChen/blog-v5.git
git push -u origin main
```

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
