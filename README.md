# Peerly 同伴辅导问卷

可从 GitHub 部署的中文全栈问卷：静态前端部署在 Vercel，服务端 API 使用 Vercel Functions，问卷数据持久化到 Supabase Postgres。

## 功能

- 响应式中文问卷，手机和电脑均可填写
- 服务端字段校验和隐藏蜜罐反垃圾
- 密码保护的 `/admin` 管理后台
- 查看、删除回复及导出 UTF-8 CSV
- HttpOnly 签名会话；数据库密钥不会发送到浏览器
- Supabase 数据表启用 RLS，并撤销浏览器角色权限

## 推荐部署：Vercel + Supabase

这是本项目已经实现并推荐给少量问卷使用的方案。20 人左右的用量远低于两边的免费额度。

### 1. 创建 Supabase 数据库

1. 注册并创建一个 Supabase 项目。
2. 打开项目的 **SQL Editor**。
3. 复制 [`supabase/schema.sql`](supabase/schema.sql) 的全部内容并运行。
4. 在项目的 **Connect** 或 **Settings → API Keys** 中保存以下两项：
   - Project URL，例如 `https://xxxx.supabase.co`
   - Secret key，格式通常为 `sb_secret_...`

Secret key 只能放在服务端环境变量中，不能写入 GitHub 或浏览器代码。

### 2. 推送到 GitHub

将包含 `questionnaire-site` 的仓库推送到 GitHub。不要提交 `.env` 文件。

### 3. 从 GitHub 导入 Vercel

1. 在 Vercel 选择 **Add New → Project**，导入 GitHub 仓库。
2. 将 **Root Directory** 设为 `questionnaire-site`。
3. Framework Preset 选择 **Other**；不需要填写 Build Command。
4. 添加环境变量：

| 名称 | 值 |
| --- | --- |
| `SUPABASE_URL` | 第 1 步的 Project URL |
| `SUPABASE_SECRET_KEY` | 第 1 步的 Secret key |
| `ADMIN_PASSWORD` | 自己设置的强密码 |
| `SESSION_SECRET` | 至少 32 位随机字符串 |

5. 点击 **Deploy**。以后每次推送 GitHub，Vercel 都会自动重新部署。

部署完成后：

- `https://你的域名/` 是公开问卷。
- `https://你的域名/admin` 是管理后台。

如先部署后才补环境变量，需要在 Vercel 的 Deployments 页面重新部署一次。

## 本地预览

只预览页面和使用本地 JSON 存储时：

```powershell
Copy-Item .env.example .env
node server.js
```

打开 <http://localhost:3000>；后台地址为 <http://localhost:3000/admin>。本地服务使用 `data/submissions.json`，仅用于开发，云端部署使用 Supabase。

如已安装 Vercel CLI 并希望调试云端函数，可运行 `vercel dev`。

## 后端方案比较

| 方案 | 适合度 | 优点 | 注意事项 |
| --- | --- | --- | --- |
| **Vercel Functions + Supabase** | 推荐，已实现 | GitHub 自动部署；数据库持久化；免费额度充足；后台 API 清晰 | 首次需要创建 Supabase 表并配置 4 个环境变量 |
| Cloudflare Pages Functions + D1 | 很适合 | 免费额度大；全球边缘运行；前后端都在 Cloudflare | D1 绑定和迁移配置比当前方案稍复杂，需要改写 API 运行时 |
| Render Web Service + Postgres | 可选 | 传统常驻 Node 后端，结构容易理解 | 免费 Web Service 会休眠；免费 Postgres 有期限，不建议依赖本地文件存储 |

不建议把回复继续保存在部署服务器的 JSON 文件中：Serverless 文件系统或免费 Render 文件系统可能在重启、休眠或重新部署后丢失。

## 项目结构

```text
questionnaire-site/
├─ api/                  Vercel 服务端函数
│  ├─ submissions.js     公开提交接口
│  └─ admin/             登录、退出、读取、删除、导出接口
├─ lib/                  服务端认证、校验和 Supabase 公共模块
├─ public/               问卷和管理后台前端
├─ supabase/schema.sql   数据库建表及权限脚本
├─ test/                 Node 单元测试
├─ server.js             本地 JSON 开发服务器
└─ vercel.json           Vercel 路由和安全响应头
```

## 修改问卷

如果增删字段，需要同步修改：

1. `public/index.html` 中的表单；
2. `lib/submissions.js` 中的服务端校验；
3. `supabase/schema.sql` 中的数据表；
4. `public/admin.js` 中的后台展示和 `api/admin/export.js` 中的 CSV 列。
