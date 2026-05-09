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
      {
        path: 'projects/:projectId',
        name: 'ProjectOverview',
        component: () => import('@/views/projects/ProjectOverviewView.vue'),
        meta: { title: '项目', menuKey: 'projects' },
      },
      {
        path: 'projects/:projectId/issues',
        name: 'IssueList',
        component: () => import('@/views/issues/IssueListView.vue'),
        meta: { title: '任务', menuKey: 'projects' },
      },
      {
        path: 'projects/:projectId/issues/:issueId',
        name: 'IssueDetail',
        component: () => import('@/views/issues/IssueDetailView.vue'),
        meta: { title: '任务详情', menuKey: 'projects' },
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UserAdminView.vue'),
        meta: { title: '用户管理', menuKey: 'admin-users' },
      },
      {
        path: 'admin/roles',
        name: 'AdminRoles',
        component: () => import('@/views/admin/RoleAdminView.vue'),
        meta: { title: '角色管理', menuKey: 'admin-roles' },
      },
      {
        path: 'admin/permissions',
        name: 'AdminPermissions',
        component: () => import('@/views/admin/PermissionAdminView.vue'),
        meta: { title: '权限列表', menuKey: 'admin-permissions' },
      },
    ],
  },
]
