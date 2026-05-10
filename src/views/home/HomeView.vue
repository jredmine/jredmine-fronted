<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <el-card class="jr-panel" shadow="never">
    <div class="home-welcome">
      <h1 class="home-welcome__title">欢迎回来</h1>
      <p class="home-welcome__lead">
        应用壳与导航已就绪：可从左侧进入「项目列表」，或通过「问题」查看您在可见项目中的全部问题。
      </p>
      <p v-if="auth.user" class="home-welcome__meta">
        当前用户：<strong>{{ auth.user.login }}</strong>
        <template v-if="auth.user.email">（{{ auth.user.email }}）</template>
      </p>
    </div>
  </el-card>
</template>

<style scoped>
.home-welcome__title {
  margin: 0 0 8px;
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.home-welcome__lead {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.65;
  font-size: 14px;
}

.home-welcome__meta {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
