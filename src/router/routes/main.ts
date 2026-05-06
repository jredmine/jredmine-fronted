import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

export const mainRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/HomeView.vue'),
        meta: { title: '首页', menuKey: 'home' },
      },
      {
        path: 'projects',
        name: 'ProjectList',
        component: () => import('@/views/projects/ProjectListView.vue'),
        meta: { title: '项目列表', menuKey: 'projects' },
      },
    ],
  },
]
