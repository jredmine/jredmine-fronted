# API 与后端契约约定

本文档约定 **jredmine-fronted** 与 **JRedmine**（Spring Boot）之间的接口形态、错误处理与可选的类型生成策略，便于前后端并行演进。

## 1. 基线与文档来源

| 项目 | 说明 |
|------|------|
| 默认 Base URL（开发） | 与后端 `server.port` 一致时多为 `http://localhost:8088`（以实际 `application*.yml` 为准） |
| API 前缀 | 业务接口普遍以 `/api` 为前缀（如 `/api/auth/login`） |
| OpenAPI / Swagger | 后端已放行：`/swagger-ui/**`、`/v3/api-docs/**` 等，可在浏览器打开 UI 查看当前契约 |

**建议**：实现阶段在本地启动 JRedmine 后，以 **OpenAPI 3 文档**（`/v3/api-docs` 或 UI 中导出的 JSON）为**事实来源**；若 DTO 发生变更，以后端与 Swagger 为准并同步前端类型或调用代码。

## 2. 统一响应包裹：`ApiResponse<T>`

后端统一使用 `ApiResponse<T>` 作为 HTTP JSON 体（成功与多数业务错误均可能仍为 200，需结合 `success` / `code` 判断；认证失败等为 HTTP 状态码 + JSON，见下文）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | `number` | 业务/协议码，成功常见为 `200`（与 `ResultCode` 对齐） |
| `message` | `string` | 提示文案 |
| `data` | `T \| null` | 载荷；分页场景见下节 |
| `timestamp` | `string`（ISO 日期时间） | 服务端生成时间 |
| `success` | `boolean` | 是否成功 |

前端约定：

- 封装 HTTP 客户端时，优先解析 **`success === true`** 再取 `data`；`success === false` 时用 `code`、`message` 做提示或分支（如无权限、重复资源等）。
- 不要将 **`HTTP 200` 与业务成功**混为一谈；需同时看 `success` / `code`。

## 3. 分页：`PageResponse<T>`

列表分页接口若在 `data` 中使用分页对象，字段与后端 `PageResponse` 对齐：

| 字段 | 类型 | 说明 |
|------|------|------|
| `records` | `T[]` | 当前页数据 |
| `total` | `number` | 总条数 |
| `current` | `number` | 当前页码 |
| `size` | `number` | 每页条数 |
| `pages` | `number` | 总页数 |

Element Plus `el-pagination` 等组件映射时，注意与后端字段命名一致（若前端惯用 `page`/`pageSize`，在适配层做一次转换即可）。

## 4. 业务错误码：`ResultCode`

后端使用 `ResultCode` 枚举表达常见场景（如 `401` 未授权、`403` 禁止、`404` 资源不存在、`409` 冲突等）。前端应：

- 在类型或常量层维护一份与后端**对齐的码表**（可手写，或由生成脚本同步），用于分支逻辑（例如登录过期跳转登录页）。
- **禁止**将文案写死为唯一依据；`message` 可能随业务调整，关键分支应优先依赖 `code`。

## 5. HTTP 状态与 Security 行为（摘要）

与 Spring Security 配置一致（以后端代码为准）：

- **无需登录**：如 `POST /api/auth/register`、`/api/auth/login`、`/api/auth/refresh`、密码重置相关 POST 等。
- **需登录**：其余 `/api/**` 默认需要携带有效 JWT。
- **401**：未认证或认证失败；响应体为 JSON（如 `ApiResponse` 形态），前端应清理本地登录态并引导重新登录（具体策略见 [鉴权与路由](./auth-and-router.md)）。
- **403**：已认证但无权限；宜提示用户无权限，避免与 401 混用提示文案。

## 6. 认证相关请求/响应（与实现强相关）

- **请求头**：已登录请求携带 `Authorization: Bearer <accessToken>`（与 `UserLoginResponseDTO.token` / `tokenType` 一致）。
- **登录成功**：`data` 中含 `token`、`tokenType`、`expiresIn`、`user` 等（见后端 `UserLoginResponseDTO`）。
- **刷新 Token**：`POST /api/auth/refresh`，请求体为 `TokenRefreshRequestDTO`，字段 `token`（必填）。

## 7. OpenAPI / TypeScript 类型生成（可选）

若团队希望减少手写类型与拼写错误，可采用以下策略之一：

1. **运行时校验**：对关键接口使用 Zod / Valibot 等定义 schema，与 UI 表单共用（不依赖代码生成）。
2. **OpenAPI 生成类型**：从 `/v3/api-docs` 导出 JSON，使用 `openapi-typescript` 等生成 `paths` / `components` 类型，再由封装层 `fetch` / axios 使用。
3. **手写 DTO**：接口数量可控时，在 `src/types/api` 等目录手写接口类型，与 Swagger 人工对齐。

**约定**：无论是否生成，**运行时仍以线上/本地真实接口与 Swagger 为准**；生成物变更应纳入 Code Review。

## 8. 版本与破坏性变更

- 后端若引入 `/api/v2` 或路径变更，前端应通过环境变量或配置层切换 Base Path，避免写死全路径。
- 对 `ApiResponse` / `PageResponse` 结构的修改视为**破坏性变更**，需前后端同步发版或兼容层。

---

**关联文档**：[鉴权与路由](./auth-and-router.md) · [环境变量与构建/部署](./env-and-deploy.md)
