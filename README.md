# JRedmine 前端

Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus，包管理与脚本统一使用 **pnpm**。

## 环境要求

- **Node.js**：`>=20.19.0` 或 `>=22.12.0`（与 Vite 8 一致）；推荐使用 **Node 24**，仓库根目录提供 `.nvmrc`（`nvm use`）。
- **pnpm**：与本仓库 `package.json` 中 `packageManager` 字段一致为佳。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

开发时可将 JRedmine 后端开在 `http://localhost:8088`，当前 Vite 已将 **`/api`** 代理到该地址（见 `vite.config.ts`）。环境变量示例见 `.env.example`。

## 文档

设计与对接约定见 [`docs/`](./docs/)（技术栈、API 契约、鉴权与路由、目录结构、部署等）。
