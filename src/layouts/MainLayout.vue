<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useProjectContextStore } from '@/stores/project-context'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const projectContext = useProjectContextStore()

const menuItems = [
  { key: 'home', name: 'Home', title: '首页' },
  { key: 'projects', name: 'ProjectList', title: '项目列表' },
]

const activeMenu = computed(() => String(route.meta.menuKey || 'home'))
const breadcrumbs = computed(() => {
  const items = route.matched
    .map((item: { path: string; meta: { title?: unknown } }) => ({
      path: item.path,
      title: item.meta.title ? String(item.meta.title) : '',
    }))
    .filter((item: { title: string }) => Boolean(item.title))

  if (route.name === 'ProjectOverview' && projectContext.currentProject) {
    const next = [...items]
    if (next.length > 0) {
      next[next.length - 1] = {
        path: route.path,
        title: projectContext.currentProject.name,
      }
    }
    return next
  }
  return items
})

function gotoByName(name: string) {
  if (route.name !== name) {
    void router.push({ name })
  }
}

function onMenuSelect(key: string) {
  const target = menuItems.find((item) => item.key === key)
  if (target) gotoByName(target.name)
}

function logout() {
  auth.clearSession()
  void router.push({ name: 'Login' })
}
</script>

<template>
  <el-container class="main-layout">
    <el-header class="main-layout__header">
      <span class="main-layout__title">JRedmine</span>
      <div v-if="auth.isAuthenticated" class="main-layout__user">
        <span class="main-layout__name">{{ auth.displayName }}</span>
        <el-button link type="primary" @click="logout">退出</el-button>
      </div>
    </el-header>

    <el-container>
      <el-aside class="main-layout__aside" width="220px">
        <el-menu :default-active="activeMenu" @select="onMenuSelect">
          <el-menu-item v-for="item in menuItems" :key="item.key" :index="item.key">
            {{ item.title }}
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-layout__main">
        <el-breadcrumb class="main-layout__breadcrumb" separator="/">
          <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
        <router-view />
      </el-main>
    </el-container>
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

.main-layout__user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-layout__name {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.main-layout__aside {
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-blank);
}

.main-layout__main {
  width: 100%;
}

.main-layout__breadcrumb {
  margin-bottom: 16px;
}
</style>
