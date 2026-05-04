<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span>首页</span>
    </template>
    <p>JRedmine 前端骨架已就绪。</p>
    <p v-if="auth.accessToken" class="muted">当前已携带访问令牌（长度 {{ auth.accessToken.length }}）。对接后端后请改为真实登录流程。</p>
  </el-card>
</template>

<style scoped>
.muted {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-top: 8px;
}
</style>
