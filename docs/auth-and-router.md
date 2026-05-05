# 鉴权与路由守卫约定

本文档针对 **Vue 3 + Vue Router + Pinia** 与 JRedmine 后端（JWT、无状态 Session）的协作方式，约定 Token 存取、请求拦截、路由守卫与登出/刷新策略。实现细节可在脚手架阶段落代码，此处只定规则。

## 1. 认证模型（与后端一致）

- **会话形态**：无 Cookie Session；依赖 **JWT**，请求头 `Authorization: Bearer <token>`。
- **公开接口**（无需 Token）：如登录、注册、`/api/auth/refresh`、密码重置等（精确列表以 [API 契约](./api-contract.md) 与后端 `SecurityConfig` 为准）。
- **受保护接口**：除上述外的 `/api/**` 需有效 Token。

## 2. Token 与用户信息存放（Pinia）

建议使用 Pinia 模块（命名示例：`useAuthStore`）维护：

| 状态 | 说明 |
|------|------|
| `accessToken` | 访问令牌；用于 axios 拦截器附加 Header |
| `expiresIn` / `expiresAt`（可选） | 若后端返回 `expiresIn`（秒），可换算绝对时间用于预刷新或提示 |
| `user` | 登录/刷新返回中的用户信息（如 `UserLoginResponseDTO.user`） |

**持久化策略（约定）**：

- **至少**将会话所需信息持久化到 `localStorage` 或 `sessionStorage` 之一（按是否「关闭浏览器即退出」选择）。团队需统一一种，避免混用导致难以排查。
- Token **禁止**出现在 URL 查询参数中；**禁止**提交到公开仓库或日志明文打印。

## 3. HTTP 客户端拦截器

与 [API 契约](./api-contract.md) 配合：

1. **请求**：若存在 `accessToken`，为受保护请求统一设置 `Authorization`。
2. **响应**：
   - **HTTP 401**：视为未认证或 Token 失效 → 清理本地认证状态 → 跳转登录页（或尝试刷新，见下节）。
   - **HTTP 403**：提示无权限，**不要**自动当作未登录处理。
   - **HTTP 200 且 `ApiResponse.success === false`**：按 `code` / `message` 做业务提示；是否与登录态有关由码表约定。

## 4. 刷新 Token 策略

后端提供 `POST /api/auth/refresh`，请求体字段 `token`（当前 refresh 或 access 以后端实现为准，需与 Swagger 对齐）。

**推荐约定**：

- 在 **401** 且存在可刷新凭据时，可 **串行** 尝试刷新一次，成功后重试原请求，失败则登出并跳转登录页，避免无限循环。
- 若后端未来区分 access / refresh 双令牌，在前端 store 中拆开字段并更新本文档与类型定义。

**当前实现**（`src/services/http.ts`）：对受保护请求返回 **401** 时，以单例 `refreshPromise` 避免并发多次调用 `POST /api/auth/refresh`；刷新成功则 `applyLoginPayload` 并**重试原请求**；若请求为 `/api/auth/refresh` 或刷新仍失败，则 `clearSession` 并跳转登录。登录、注册、密码相关路径不触发刷新重试。

## 5. Vue Router 路由元信息与守卫

### 5.1 `meta` 约定

| 字段 | 类型 | 含义 |
|------|------|------|
| `requiresAuth` | `boolean` | `true` 表示需要登录；默认策略由项目统一（例如默认全部需登录，仅白名单标记 `requiresAuth: false`） |
| `roles` / `permissions`（可选） | `string[]` | 若前端需按角色或权限隐藏路由，与后端返回的用户字段对齐后再使用 |

**注意**：细粒度权限以后端为准；前端路由守卫只做「是否已登录」与粗粒度角色，**不可**作为安全边界。

### 5.2 全局前置守卫（逻辑）

- 访问 `requiresAuth === true`（或默认需登录）的路由：无有效 Token → 重定向到登录页，并携带 `redirect` 便于登录后跳回。
- 已登录用户访问登录页：可重定向到首页或 `redirect` 目标，避免重复登录。

### 5.3 异步路由（可选）

若将来按模块拆分懒加载路由，保持 `meta.requiresAuth` 与模块边界一致即可。

## 6. 登出

- 调用后端登出接口（若后续提供）或仅前端清理 Pinia + 持久化存储。
- 跳转登录页，必要时用 `replace` 避免回退到受保护页。

## 7. 与 Element Plus 的衔接

- 全局面包屑、用户下拉菜单中的「退出」应调用统一 `logout()`，与上述登出约定一致。
- 请求层全局错误提示（如 `ElMessage`）对 401/403 使用不同文案，避免用户困惑。

---

**关联文档**：[API 契约](./api-contract.md) · [环境变量与构建/部署](./env-and-deploy.md)
