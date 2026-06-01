# fic-investly-ai

纯前端 AI 助手界面（Mock 数据），无需配置后端或环境变量即可运行。

## 技术栈

| 项 | 版本 |
|---|---|
| Next.js (App Router) | 14.2.30 |
| React | 18.3.1 |
| Tailwind CSS | v4 |
| 包管理 | npm 8+ |
| Node.js | 推荐 22.x，最低 18.x |

## 环境变量

复制 `.env.example` 为 `.env.local`，按实际后端地址修改：

| 变量 | 说明 |
|------|------|
| `API_PROXY_TARGET` | 后端根 URL（如 `http://192.168.1.10:8000`），用于 API 代理、文件上传、SSE |
| `NEXT_PUBLIC_API_BASE_URL` | 可选；留空则浏览器走同源 `/v1` 代理（推荐本地开发） |
| `DEV_UPLOAD_MODE` | 默认 `auto`：先转发后端 `PUT /v1/_dev/uploads`；404 时写入同级 `CAN-RAG-BackEnd/app/storage/uploads` |
| `DEV_UPLOAD_ROOT` | 可选；覆盖 auto 检测到的后端 uploads 目录 |

公司电脑 / 非本机后端时，**务必设置 `API_PROXY_TARGET`**，并重启 `npm run dev`。

## 本地运行

```bash
# 推荐使用 Node 22（可用 nvm）
nvm use

cp .env.example .env.local   # 按需修改 API_PROXY_TARGET
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 生产构建

```bash
npm run build
npm start
```

## 说明

- 使用 `npm install`，不要使用 pnpm / yarn。
- 若端口被占用，可执行 `npm run dev -- -p 3001` 指定端口。
