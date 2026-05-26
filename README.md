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

## 本地运行

```bash
# 推荐使用 Node 22（可用 nvm）
nvm use

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
