<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

/** 骨架阶段占位：无后端时用于验证路由守卫与布局，接入 /api/auth/login 后删除 */
function enterDevShell() {
  auth.setToken('__jredmine_dev_placeholder__')
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  void router.replace(redirect || '/')
}
</script>

<template>
  <el-card class="login-card" shadow="hover">
    <template #header>
      <span>登录</span>
    </template>
    <el-alert
      title="后续对接 JRedmine 登录接口"
      type="info"
      description="提交至 POST /api/auth/login，解析 ApiResponse 中的 token 并写入 auth store。下方按钮仅用于本地验证路由与布局。"
      show-icon
      :closable="false"
    />
    <div class="login-card__actions">
      <el-button type="primary" @click="enterDevShell">进入系统（骨架占位）</el-button>
    </div>
  </el-card>
</template>

<style scoped>
.login-card {
  width: min(420px, 100%);
}

.login-card__actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
