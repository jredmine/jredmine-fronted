<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

function logout() {
  auth.clearSession()
  void router.push({ name: 'Login' })
}
</script>

<template>
  <el-container class="main-layout">
    <el-header class="main-layout__header">
      <span class="main-layout__title">JRedmine</span>
      <el-button v-if="auth.isAuthenticated" link type="primary" @click="logout">退出</el-button>
    </el-header>
    <el-main class="main-layout__main">
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.main-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color);
}

.main-layout__title {
  font-weight: 600;
}

.main-layout__main {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
