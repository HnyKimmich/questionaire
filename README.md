# Peerly

Peerly 是一个面向小规模同伴辅导场景的中文全栈问卷网站。项目不依赖前端框架，可在本地直接运行，也可使用 Vercel 和 Supabase 部署。

## 功能

- 分章节、单页式填写流程，适配桌面端和移动端
- 支持单选、多选、排序、文本输入和一层条件追问
- 除姓名外均为选答，可前后切换并保留填写状态
- 浏览器自动保存带版本号的草稿，支持继续填写或重新开始
- 按规范化姓名覆盖旧提交，只保留每位填写者的最新回复
- 密码保护的管理后台，支持按填写者查看和按问题统计
- 支持删除回复和导出 UTF-8 CSV
- 服务端校验、反垃圾蜜罐、签名会话和安全响应头
- Supabase RLS 与服务端密钥隔离，浏览器无法直接访问数据库

## 技术栈

- 前端：原生 HTML、CSS、JavaScript
- 本地服务：Node.js HTTP Server + JSON 文件
- 云端接口：Vercel Functions
- 数据库：Supabase Postgres
- 测试：Node.js 内置测试运行器

## 项目结构

```text
questionnaire-site/
├─ api/                    Vercel Serverless API
│  └─ admin/               登录、退出、回复管理和 CSV 导出
├─ lib/                    认证、校验、HTTP 和 Supabase 公共模块
├─ public/                 公开问卷与管理后台前端
│  └─ questionnaire.js     问卷结构和界面共用配置
├─ supabase/schema.sql     数据库结构、迁移和权限配置
├─ test/                   自动化测试
├─ server.js               本地开发服务器
└─ vercel.json             Vercel 路由与安全响应头
```

## 本地开发

项目需要 Node.js 20 或更高版本。

```powershell
node server.js
```

- 公开页面：<http://localhost:3000>
- 管理后台：<http://localhost:3000/admin>
- 本地回复保存在 `data/submissions.json`

运行测试：

```powershell
node --test
```

## 配置与维护

问卷配置集中在 `public/questionnaire.js`。学生端、管理后台和 CSV 导出共同读取该配置；修改问卷结构后应同步更新其中的 `version`，使旧版浏览器草稿失效。

服务端使用以下环境变量：

| 变量 | 用途 |
| --- | --- |
| `ADMIN_PASSWORD` | 管理后台密码 |
| `SESSION_SECRET` | 管理员会话签名密钥，至少 32 位 |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SECRET_KEY` | Supabase 服务端 Secret key |

不要提交 `.env`，也不要将 Supabase Secret key 放入浏览器代码。

## 部署

推荐使用 GitHub、Vercel 和 Supabase：

1. 在 Supabase 创建项目，在 SQL Editor 中运行 `supabase/schema.sql`。已有旧表时也需重新运行该脚本以完成迁移。
2. 获取 Supabase Project URL 和 Secret key。
3. 将项目推送到 GitHub，并在 Vercel 中导入仓库。
4. 若仓库外层还包含其他目录，将 Vercel 的 Root Directory 设为 `questionnaire-site`；Framework Preset 选择 **Other**，无需 Build Command。
5. 在 Vercel 配置 `SUPABASE_URL`、`SUPABASE_SECRET_KEY`、`ADMIN_PASSWORD` 和 `SESSION_SECRET`，然后部署。

部署完成后，根路径为公开问卷，`/admin` 为管理后台。环境变量发生变化后需要重新部署。
