<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span>首页</span>
    </template>
    <p>欢迎使用 JRedmine。</p>
    <p v-if="auth.user" class="muted">
      当前用户：<strong>{{ auth.user.login }}</strong>
      <template v-if="auth.user.email">（{{ auth.user.email }}）</template>
    </p>
  </el-card>
</template>

<style scoped>
.muted {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-top: 8px;
}
</style>
