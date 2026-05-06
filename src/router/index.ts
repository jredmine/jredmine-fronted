import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useProjectContextStore } from '@/stores/project-context'
import { authRoutes } from './routes/auth'
import { mainRoutes } from './routes/main'

const routes = [...mainRoutes, ...authRoutes]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

function needsAuth(to: RouteLocationNormalized) {
  return to.matched.some((r) => r.meta.requiresAuth === true)
}

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (needsAuth(to) && !auth.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if ((to.name === 'Login' || to.name === 'Register') && auth.isAuthenticated) {
    return { name: 'Home' }
  }

  const appTitle = import.meta.env.VITE_APP_TITLE || 'JRedmine'
  const pageTitle = to.meta.title ? `${String(to.meta.title)} - ${appTitle}` : appTitle
  document.title = pageTitle

  return true
})

router.afterEach((to) => {
  if (to.name !== 'ProjectOverview') {
    useProjectContextStore().clear()
  }
})
