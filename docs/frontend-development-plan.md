# JRedmine 前端开发计划（可执行版）

本文档将前端交付拆成**可验收的任务单元**，并与 **JRedmine** 后端现有 Controller、本仓库工程约定对齐，便于排期与追踪。  
执行时请同时打开：[API 契约](./api-contract.md)、[鉴权与路由](./auth-and-router.md)、[目录结构](./project-structure.md)。

---

## 1. 如何使用本计划

| 步骤 | 行动 |
|------|------|
| 1 | 按 **里程碑 M1→M5** 顺序推进；同一优先级（P0/P1…）内可按表格自上而下实施。 |
| 2 | 每个任务块下方的 **验收标准** 全部勾选后，视为该块「可合并 / 可演示」。 |
| 3 | 接口以 **运行中的后端 + Swagger** 为准：`/v3/api-docs` 或 Swagger UI；文档（如 `JRedmine/docs/*.md`）作细节补充，若与接口不一致以接口为准。 |
| 4 | 前端路由建议尽早引入 **`/projects/:projectId`** 上下文，后续 Wiki / 文档 / 论坛 / 版本模块共用，避免返工。 |

**后端仓库路径（本地常见布局）**：与本前端仓库并列的 `JRedmine/`（Spring Boot，`server.port` 默认 `8088`，本地开发配合 `vite.config.ts` 中 `/api` 代理）。

---

## 2. 后端能力映射（实施时快速定位）

以下便于前端模块与后端 Controller 对齐（路径前缀均为 REST 语境下的资源划分）：

| 领域 | Spring Controller（类级 `@RequestMapping` 前缀） |
|------|--------------------------------------------------|
| 认证 | `/api/auth` |
| 用户 | `/api/users` |
| 角色 / 权限 | `/api/roles`、`/api/permissions` |
| 项目（含版本等子资源） | `/api/projects` |
| 任务 | `/api/issues` |
| 工作流 | `/api/workflows` |
| 跟踪器 | `/api/trackers` |
| 工时 | `/api/time-entries` |
| 附件 | `/api/attachments` |
| 系统设置 | `/api/settings` |
| 报表 | `/api/reports` |
| 活动流 | `/api/activities` |
| 搜索 | `/api/search` |
| Wiki | `/api/projects/{projectId}/wiki` |
| 文档 | `/api/projects/{projectId}/documents` |
| 文档分类 | `/api/projects/{projectId}/document-categories` |
| 论坛板块 | `/api/projects/{projectId}/boards` |

---

## 3. 全局工程落地项（与业务并行）

在 **M1 之内**应逐项完成，否则后续页面会重复踩坑。

| ID | 任务 | 落地说明 |
|----|------|-----------|
| E1 | **API 封装层** | `src/services/` 按领域拆分；统一返回类型 `ApiResponse<T>`、`PageResponse<T>`（见 `src/types/api-response.ts` 与 [api-contract](./api-contract.md)）。 |
| E2 | **错误与提示** | `success === false` 与 HTTP `401`/`403`/`5xx` 分支；禁止仅用 `message` 做权限分支，关键逻辑依赖 `code`。 |
| E3 | **鉴权状态** | Pinia `auth` store：`token`、用户信息、`logout`；移除长期占位登录（骨架阶段按钮），改为真实 `login` / `refresh`。 |
| E4 | **路由元信息** | `meta.requiresAuth`、`meta.title`（可选）；全局守卫与 [auth-and-router](./auth-and-router.md) 一致。 |
| E5 | **项目上下文（强烈建议）** | Pinia `project` 或路由参数统一解析 `projectId`；侧栏菜单按项目 Module 开关预留（与后端项目模块启用对齐）。 |
| E6 | **类型策略** | 优先从 OpenAPI 生成 `paths/components` 类型；或手写 `src/types/api/*.ts`，与 Swagger 字段对齐并 Code Review。 |

**验收（全局）**

- [ ] 登录后可刷新浏览器仍保持会话（Token 持久化策略与文档一致）。
- [ ] 任意列表页出错时有可读的统一提示，控制台无未处理 Promise rejection。
- [ ] `pnpm build` 通过。

---

## 4. 按优先级排序的功能交付

### P0 — 基础设施与主路径（必须先完成）

#### P0-A 认证与用户会话

| 动作 | 对接参考 |
|------|----------|
| 登录、注册、刷新 Token | `AuthController`：`/api/auth/login`、`register`、`refresh` |
| 修改密码、密码重置流程（若产品需要） | `change-password`、`password/reset` 等 |

**交付物**

- 页面：`views/auth/LoginView.vue`（替换占位逻辑）、按需 `RegisterView.vue`、`ForgotPasswordView.vue`。
- 服务：`services/auth.ts`（封装上述接口）。
- Store：扩展 `stores/auth.ts`（用户信息、`expiresIn` 处理，按需刷新）。

**验收标准**

- [ ] 登录成功后将 `token`、用户信息落入 store + 持久化；退出后清除。
- [ ] 刷新 Token 策略：至少定义一种（定时刷新 / 401 后单次刷新重试），并在代码注释或 `docs/auth-and-router.md` 补一句说明实际采用方案。
- [ ] 未登录访问需授权路由时跳转登录，并携带 `redirect`。

---

#### P0-B 应用壳与导航

**交付物**

- `layouts/`：主框架（顶栏、侧栏占位）、面包屑占位（可选）。
- `router/`：路由模块化拆分；默认进入「项目列表」或「上次访问项目」策略（二选一写死在 README 或本文件）。

**验收标准**

- [ ] 登录后可访问主布局；侧栏存在一级菜单占位（可为空链接）。
- [ ] 路由懒加载无报错；页面标题或 `meta.title` 可区分模块。

---

#### P0-C 项目（进入一切「项目内」功能的前提）

| 动作 | 对接参考 |
|------|----------|
| 项目列表、树、CRUD、成员、模块 | `ProjectController`：`/api/projects` |

**交付物**

- 页面：`views/projects/`（列表 + 表单抽屉/对话框）。
- 服务：`services/projects.ts`。
- 路由：`/projects`、`/projects/:projectId`（详情或仪表盘占位）。

**验收标准**

- [ ] 可创建/编辑项目（若后端限制字段，以前端表单校验 + 错误提示呈现）。
- [ ] 可从列表进入某一项目的「项目内首页」（占位页即可，但 URL 必须含 `projectId`）。

---

#### P0-D 任务（Issue）核心路径

| 动作 | 对接参考 |
|------|----------|
| 列表、筛选、分页、排序 | `IssueController` |
| 详情、创建、更新、评论/活动、关联、关注者等 | 同上（可分迭代，但列表+详情+创建为 MVP 必需） |

**交付物**

- 页面：`views/issues/`（列表、详情、新建/编辑）。
- 服务：`services/issues.ts`。
- 路由：`/projects/:projectId/issues`、`:issueId` 等 RESTful 结构（与后端路径参数一致）。

**验收标准**

- [ ] 在项目上下文中可浏览任务列表并打开详情。
- [ ] 可创建一条任务并能在列表中再次看到（成功路径打通）。
- [ ] 列表请求参数与后端分页字段对齐（`PageResponse`）。

---

### P1 — 主链增强（高优先级）

#### P1-A 工时

| 对接 | `TimeEntryController`：`/api/time-entries` |
| 文档参考 | JRedmine `docs/工时记录*.md`、`工时报表*.md` |

**交付物**：`views/time-entries/`、`services/time-entries.ts`（统计与报表接口单独函数分组）。

**验收标准**

- [ ] 登记 / 编辑 / 删除工时（以后端实际开放操作为准）。
- [ ] 至少一个统计或列表视图可演示（与报表模块二选一优先时可注明）。

---

#### P1-B 附件

| 对接 | `AttachmentController`：`/api/attachments` |
| 文档参考 | `docs/附件管理接口使用指南.md` |

**交付物**：通用组件（上传列表、进度、预览入口）+ `services/attachments.ts`；先挂接到 **任务详情**，后续 Wiki/文档复用。

**验收标准**

- [ ] 任务详情可上传、列出、下载或预览（以后端实现能力为准）。
- [ ] 大文件失败时有明确反馈（超时、大小限制）。

---

#### P1-C 搜索

| 对接 | `SearchController`：`/api/search` |

**交付物**：顶栏搜索框或独立搜索页；`services/search.ts`；搜索历史 UI（若后端提供对应接口）。

**验收标准**

- [ ] 一种实体类型（如任务）可搜索并跳转详情。
- [ ] 空结果与异常有提示。

---

#### P1-D 活动流

| 对接 | `ActivityController`：`/api/activities` |

**交付物**：`views/activities/` 或嵌入项目概览；支持按项目 / 用户过滤（与后端参数对齐）。

**验收标准**

- [ ] 项目维度活动列表可展示并分页。

---

### P2 — 项目内深度与协作（可并行排期）

| 模块 | 对接 | 建议路由 |
|------|------|----------|
| 版本与路线图 | `ProjectController` 下 `versions`、`roadmap`、`release` 等 | `/projects/:projectId/versions`、`.../roadmap` |
| 报表 | `ReportController` | `/projects/:projectId/reports` 或全局 `/reports` |
| 甘特 | `IssueController` 甘特相关接口 | `/projects/:projectId/issues/gantt` |
| Wiki | `WikiController` | `/projects/:projectId/wiki` |
| 文档 | `DocumentController`、`DocumentCategoryController` | `/projects/:projectId/documents` |
| 论坛 | `BoardController` 及消息相关 API | `/projects/:projectId/boards` |

**各模块通用验收标准（按需勾选）**

- [ ] 列表 + 详情 + 创建/编辑主路径至少一条可走通。
- [ ] 权限不足时有 403 提示，而非静默失败。
- [ ] 与 **项目 Module 是否启用** 有关的功能，在后端关闭模块时有友好提示（若后端返回可区分错误码）。

---

### P3 — 管理与配置

| 模块 | 对接 |
|------|------|
| 用户 | `UserController` |
| 角色 / 权限 | `RoleController`、`PermissionController` |
| 工作流 / 跟踪器（配置侧） | `WorkflowController`、`TrackerController` |
| 系统设置 | `SettingController` |

**验收标准**

- [ ] 管理员角色可访问（路由守卫 + 后端双重约束；前端不得以「隐藏按钮」代替鉴权）。
- [ ] 敏感设置变更需二次确认（前端交互）。

---

## 5. 里程碑划分（建议排期）

### M1：可演示「登录 + 项目 + 任务」最小闭环

包含：P0-A～P0-D 全部；全局 E1～E4。  
**演示脚本**：注册/登录 → 创建项目 → 创建任务 → 列表可见 → 退出再登录仍可访问。

---

### M2：协作与信息检索

包含：P1-A～P1-D。  
**演示脚本**：在任务上上传附件 → 登记工时 → 全局搜索找到任务 → 查看项目活动流。

---

### M3：计划、发布与度量

包含：P2 中的版本/路线图 + 报表 + 甘特（可按资源三选二先进迭代，但需在下方备注优先级）。

---

### M4：知识库与讨论

包含：P2 中的 Wiki、文档、论坛（可分两次发布）。

---

### M5：治理与配置

包含：P3；补齐 E5、E6 中尚未完成项。

---

## 6. 迭代记录（团队填写）

| 迭代 | 日期 | 目标 | 实际交付 PR/说明 |
|------|------|------|------------------|
| 例：Sprint 1 | | M1 | |
| 例：Sprint 2 | | M2 | |

---

## 7. 文档修订

当后端新增 Controller 或路由前缀变更时，同步更新本文 **第 2 节** 与对应优先级章节中的路径说明。

**版本**：1.0（与当前 JRedmine REST 划分对齐，接口细节以 Swagger 为准）
