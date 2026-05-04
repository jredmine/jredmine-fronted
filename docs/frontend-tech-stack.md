# JRedmine 前端技术栈选型

本文档说明 JRedmine 前端（`jredmine-fronted`）在框架与周边工具上的选型依据与建议，供后续脚手架与开发规范引用。  
实现代码在脚手架阶段落地；工程约定见第六节所列配套文档。

## 1. 与后端的配合关系

后端工程位于同工作区的 **JRedmine** 目录，技术特征包括 Spring Boot 3、Spring Security、JWT 等。前端需要重点支持：

- 基于 Token 的鉴权与请求拦截、刷新/登出策略
- 典型「业务系统」界面：列表、筛选、表单、工作流、部分看板/报表
- 与 RESTful API 的对接、错误与权限码的统一处理

以上需求**不绑定**某一门具体框架，但会显著影响「组件库 + 状态 + 路由」的选型组合是否顺手。

## 2. 主流方案对比（摘要）

| 维度 | Vue 3 | React | Angular |
|------|--------|--------|---------|
| 学习曲线 | 对熟悉模板与选项式/组合式 API 的开发者友好 | 需适应 JSX 与较分散的生态约定 | 最完整但最重，强规范、强 TypeScript |
| 国内资料与社区 | 企业后台、Element 系资料多 | 生态最大，岗位与库最丰富 | 国内相对少，企业级大项目常见 |
| 适合本项目的形态 | 表格/表单密集、中后台极常见 | 同样适合，常配 Ant Design 等 | 适合超大型与强规范团队，小团队成本偏高 |
| 构建与工程化 | Vite 一阶公民，冷启动与 HMR 快 | Vite 或 Rspack 等，生态成熟 | 通常 Angular CLI，自成体系 |

**结论（方向性，非排他）：**

- **Vue 3** 与 **React** 均可作为 JRedmine 前端的稳定主选；差异更多在团队经验与代码风格偏好。
- **Angular** 除非团队已有成熟经验或强制度与模块边界需求，否则对独立 Redmine 类子系统往往「过重」。

## 3. 对「Vue3 + Vite + TS + Pinia + Element Plus」的评估

你计划使用的组合在同类项目中**非常合理**，理由简述如下：

- **Vue 3 + Vite + TypeScript**：与当前行业实践一致，类型安全、构建速度快，长期维护成本可控。
- **Pinia**：Vue 官方推荐的状态管理，API 简单，与组合式 API 配合自然，适合会话、用户信息、全局配置等。
- **Element Plus**：面向中后台的成熟组件库，表格、表单、对话框、布局等与 Issue 跟踪、权限管理类界面契合度高。

可选补强（后续脚手架阶段再落实即可）：

- **Vue Router**：多模块、权限路由、懒加载。
- **Axios（或 ofetch / ky）**：HTTP 客户端，配合拦截器处理 JWT 与统一错误。
- **Vitest + Vue Test Utils**：单元与组件测试。
- **ESLint + Prettier + Stylelint（按需）**：代码风格与质量门禁。

## 4. 若选择 React 的等价映射（备选）

若团队更熟悉 React，可采用心智上对标的栈，能力上与 Vue 方案等价：

- **React 18 + Vite + TypeScript**
- **状态**：Zustand、Jotai 或 Redux Toolkit（按复杂度选）
- **UI**：Ant Design、MUI 或 Arco Design 等
- **路由**：React Router

该路径同样适合 JRedmine，但需团队在 Hooks、生态碎片化约定上达成一致。

## 5. 综合建议

1. **已确定主栈**：**Vue 3 + Vite + TypeScript + Pinia + Element Plus** 作为 JRedmine 前端默认方案。
2. 若团队对 **React** 明显更熟，仍可作为备选讨论，但本仓库以 Vue 系为准推进。
3. **不建议**为 JRedmine 单独引入 **Angular** 作为默认选项，除非已有明确组织级理由。

## 6. 配套工程文档

以下文档与《技术栈选型》并列于 `docs/`，约定与 **JRedmine** 后端的对接与仓库内实现习惯，脚手架与日常开发可据此执行：

| 文档 | 说明 |
|------|------|
| [frontend-development-plan.md](./frontend-development-plan.md) | **按 P0–P3 与里程碑 M1–M5 可执行开发计划**（与后端 Controller 映射、验收清单） |
| [api-contract.md](./api-contract.md) | 统一响应 `ApiResponse`、分页 `PageResponse`、`ResultCode`、OpenAPI 与可选类型生成 |
| [auth-and-router.md](./auth-and-router.md) | JWT、Pinia 会话、axios 拦截、Router `meta` 与守卫、刷新/登出策略 |
| [project-structure.md](./project-structure.md) | `src` 目录布局、命名与分层职责 |
| [env-and-deploy.md](./env-and-deploy.md) | `VITE_*` 环境变量、开发代理、生产构建与部署形态 |

---

**文档版本**：已补充第六节配套文档  
**适用仓库**：`jredmine-fronted`  
**关联后端**：`JRedmine`（Spring Boot）
