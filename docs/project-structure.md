# 目录结构与命名规范

本文档约定 **jredmine-fronted**（Vue 3 + Vite + TypeScript）初始化后的推荐目录布局与命名风格。项目在脚手架落地前可作为单一事实来源；若实际目录与下文略有出入，以 README 或本文件更新为准。

## 1. 目标原则

- **按领域/功能分包**，避免巨型 `views` 堆叠。
- **UI 与逻辑分离**：组合式函数、请求封装、类型定义分层存放。
- **可预测命名**：文件与导出名称一致、语义清晰，便于检索。

## 2. 推荐顶层结构（示例）

```text
src/
  assets/                 # 静态资源：图片、全局样式变量入口等
  components/             # 跨页面复用的展示组件
    common/               # 通用：空状态、分页封装等
    business/             # 业务强相关可复用块（可选）
  composables/            # 组合式函数 useXxx.ts
  layouts/                # 布局壳：主框架、空白登录布局等
  router/                 # 路由表、守卫注册
  stores/                 # Pinia stores
  services/               # API 调用封装（axios 实例、按模块划分的 api/*.ts）
  types/                  # 全局/模块 TypeScript 类型与枚举
  utils/                  # 与 Vue 无关的工具函数
  views/                  # 页面级组件（按模块分子目录）
    auth/
    projects/
    ...
  App.vue
  main.ts
```

说明：

- **`services`** 与 **`api`** 二选一命名即可；若使用 `services`，其内可按 `auth.ts`、`project.ts` 分文件。
- **`types`** 可按领域分子文件（如 `user.ts`、`api-response.ts`），或与 OpenAPI 生成物合并策略在 [API 契约](./api-contract.md) 中说明。

## 3. 命名规范

### 3.1 文件与目录

| 类型 | 约定 | 示例 |
|------|------|------|
| Vue 单文件组件 | **PascalCase** | `UserProfile.vue` |
| TS/JS 模块 | **camelCase**（工具、composable）或 **kebab-case**（团队任选其一，需统一） | `useAuth.ts` 或 `format-date.ts` |
| 页面组件 | 与路由 name 可对应，放在 `views/<模块>/` | `views/auth/LoginView.vue` |

### 3.2 Vue 组件名

- 多单词组件名（与 ESLint `vue/multi-word-component-names` 常见规则一致）。
- 路由 `name` 使用 **PascalCase** 或 **camelCase** 择一并统一，例如 `name: 'ProjectList'`。

### 3.3 Pinia Store

- 文件：`stores/auth.ts` → `useAuthStore`（`defineStore` id 与文件名对应，如 `'auth'`）。
- 避免在 store 中写大量 UI 逻辑；复杂异步放在 `services` 或 `composables`。

### 3.4 样式

- 组件内 `<style scoped>` 优先；全局变量用 `assets/styles` + SCSS/CSS 变量（若引入 Element Plus 主题定制，单独文档化）。
- 类名可采用 **BEM** 或与 Element Plus 深度选择器策略一致，团队选定一种。

### 3.5 导入路径

- Vite 配置 `@` 指向 `src/`（脚手架常见约定），例如 `import { x } from '@/services/auth'`。
- 避免过长相对路径 `../../../`。

## 4. 与后端模块的对应关系（建议）

| 前端分层 | 职责 |
|----------|------|
| `views/*` | 页面编排、调用 composable/store |
| `composables` | 列表筛选状态、表单提交流程、可复用请求逻辑 |
| `services` | 仅 HTTP 与 DTO 映射，不直接操作 DOM |
| `stores` | 跨页面会话态：当前用户、主题、侧边栏折叠等 |

Redmine 类功能（项目、工作项、Wiki 等）可按 **后端模块** 在 `views/` 下建子目录，减少交叉引用。

## 5. 测试与 Story（可选）

- 单元测试：`*.spec.ts` 与源文件就近或放在 `tests/unit/`（脚手架生成时统一）。
- 组件文档：若引入 Storybook，目录单独约定，不与本结构冲突即可。

---

**关联文档**：[前端开发计划](./frontend-development-plan.md) · [API 契约](./api-contract.md) · [鉴权与路由](./auth-and-router.md)
