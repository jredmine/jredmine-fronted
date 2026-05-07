import type { RouteRecordRaw } from 'vue-router'
import EmptyLayout from '@/layouts/EmptyLayout.vue'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: EmptyLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: '登录' },
      },
    ],
  },
  {
    path: '/password/reset',
    component: EmptyLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'PasswordResetRequest',
        component: () => import('@/views/auth/PasswordResetRequestView.vue'),
        meta: { title: '找回密码' },
      },
    ],
  },
  {
    path: '/password/reset/confirm',
    component: EmptyLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'PasswordResetConfirm',
        component: () => import('@/views/auth/PasswordResetConfirmView.vue'),
        meta: { title: '重置密码' },
      },
    ],
  },
  {
    path: '/register',
    component: EmptyLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { title: '注册' },
      },
    ],
  },
]
