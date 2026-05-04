# 环境变量与构建 / 部署说明

本文档约定 **jredmine-fronted**（Vite + Vue 3）在不同环境下的配置方式，以及与 JRedmine 后端联调、部署时的常见模式。**具体变量名以实现阶段 `.env.example` 为准**，此处定义语义与使用规则。

## 1. Vite 环境文件惯例

| 文件 | 用途 |
|------|------|
| `.env` | 所有环境共享的默认值（若存在；注意不要提交密钥） |
| `.env.development` | `vite` 开发模式（`npm run dev`） |
| `.env.production` | `vite build` 生产构建 |

**规则**：

- 仅暴露给前端的变量必须以 **`VITE_`** 前缀命名，否则不会注入客户端 bundle。
- **禁止**将服务端密钥、数据库连接等写入任何 `VITE_*` 变量。
- 仓库中提供 **`.env.example`**（无秘密，只有键名与示例值），`.env.local` 个人覆盖加入 `.gitignore`。

## 2. 建议的环境变量（语义级）

| 变量（示例） | 说明 |
|--------------|------|
| `VITE_API_BASE_URL` | 后端 API 根地址，如 `http://localhost:8088` 或生产域名；axios `baseURL` 拼接 `/api/...` |
| `VITE_APP_TITLE` | 浏览器标题或壳层展示名称（可选） |

若前后端同域部署且通过反向代理将 `/api` 转到后端，可将 `VITE_API_BASE_URL` 设为 **空字符串** 或 **当前 origin**，由代理统一转发（见下节）。

## 3. 开发环境联调（CORS / 代理）

本地常用两种方式：

1. **直连后端**：后端开启 CORS 允许前端来源（如 `http://localhost:5173`），`VITE_API_BASE_URL` 指向 `http://localhost:8088`。
2. **Vite 代理**（推荐减少 CORS 配置）：在 `vite.config.ts` 中配置 `server.proxy`，例如将 `/api` 代理到 `http://localhost:8088`，此时前端请求可使用相对路径 `/api`，`VITE_API_BASE_URL` 可为空。

**约定**：团队选定一种并在 README 中写清启动顺序（先启后端或并行）。

## 4. 生产构建

- 命令：`pnpm build` / `npm run build`（以 package.json 为准）。
- 产出：`dist/` 静态资源，可部署到任意静态托管（Nginx、OSS + CDN、Docker + `nginx` 镜像等）。

## 5. 部署形态建议

### 5.1 前后端分离、不同域名

- 浏览器页面域名与 API 域名不同 → 依赖后端 **CORS** 与（若使用 Cookie）**SameSite** 策略；本项目 JWT 放 Header，通常只需 CORS。
- `VITE_API_BASE_URL` 设为生产 API 根 URL（含协议与端口）。

### 5.2 同域反向代理

- 用户只访问一个域名；Nginx（示例）将 `/api` 转发到 Spring Boot 服务，前端静态资源由 Nginx 根目录提供。
- 此时前端 axios 可使用相对路径 `/api`，避免硬编码域名。

示例逻辑（非强制配置）：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8088/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 5.3 容器化（可选）

- 前端 Docker 多用多阶段构建：Node 阶段 `pnpm build`，最终镜像仅含 `dist/` + Nginx。
- 后端单独容器；通过编排工具或 K8s Ingress 统一入口。

## 6. 缓存与版本

- 静态资源文件名带 hash（Vite 默认），部署新版本后用户通常自动拉新 JS/CSS。
- 若需 **运行时配置**（不重新 build 改 API 地址），可采用注入 `config.js` 或在网关层统一处理；属于进阶方案，需要时单独开文档。

## 7. 健康检查与监控

- 前端 SPA 无进程健康接口；可由 CDN/Nginx 对 `index.html` 做存活检测。
- 后端健康（如 Spring Boot Actuator）由运维单独配置，不在本文档范围。

---

**关联文档**：[API 契约](./api-contract.md) · [鉴权与路由](./auth-and-router.md)
