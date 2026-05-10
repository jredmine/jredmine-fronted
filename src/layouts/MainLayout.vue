<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { useAuthStore } from '@/stores/auth'
import { useProjectContextStore } from '@/stores/project-context'
import { changePasswordApi } from '@/services/auth'
import { fetchCurrentUserPreference, updateCurrentUserPreference } from '@/services/users'
import { parseBackendErrorMessage } from '@/utils/http-error'
import { FolderOpened, House, Key, Lock, User } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const projectContext = useProjectContextStore()

const menuItems = [
  { key: 'home', name: 'Home', title: '首页', icon: House },
  { key: 'projects', name: 'ProjectList', title: '项目列表', icon: FolderOpened },
  { key: 'admin-users', name: 'AdminUsers', title: '用户管理', icon: User },
  { key: 'admin-roles', name: 'AdminRoles', title: '角色管理', icon: Key },
  { key: 'admin-permissions', name: 'AdminPermissions', title: '权限列表', icon: Lock },
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

/** 仅多级路径时显示面包屑，避免与侧栏重复「首页 / 一级模块名」 */
const showBreadcrumb = computed(() => breadcrumbs.value.length > 1)

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

const changePwdDialogVisible = ref(false)
const changePwdFormRef = ref<FormInstance>()
const changePwdLoading = ref(false)

const changePwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

function validateConfirmNewPassword(
  _rule: unknown,
  value: string,
  callback: (e?: Error) => void,
) {
  if (value !== changePwdForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const changePwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 40, message: '密码长度为 8～40 个字符', trigger: 'blur' },
  ],
  confirmNewPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmNewPassword, trigger: 'blur' },
  ],
}

function openChangePassword() {
  changePwdForm.oldPassword = ''
  changePwdForm.newPassword = ''
  changePwdForm.confirmNewPassword = ''
  changePwdDialogVisible.value = true
}

async function submitChangePassword() {
  if (!changePwdFormRef.value) return
  const valid = await changePwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  changePwdLoading.value = true
  try {
    await changePasswordApi({
      oldPassword: changePwdForm.oldPassword,
      newPassword: changePwdForm.newPassword,
      confirmNewPassword: changePwdForm.confirmNewPassword,
    })
    ElMessage.success('密码变更成功，请重新登录')
    changePwdDialogVisible.value = false
    logout()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '密码变更失败，请重试'))
  } finally {
    changePwdLoading.value = false
  }
}

const myPrefDialogVisible = ref(false)
const myPrefFormRef = ref<FormInstance>()
const myPrefLoading = ref(false)
const myPrefForm = reactive({
  hideMail: false,
  timeZone: 'Asia/Shanghai',
  others: '',
})

const timeZoneOptions = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'UTC', label: 'UTC' },
]

const myPrefRules: FormRules = {
  timeZone: [{ required: true, message: '请输入时区', trigger: 'blur' }],
}

async function openMyPreference() {
  myPrefDialogVisible.value = true
  myPrefLoading.value = true
  try {
    const pref = await fetchCurrentUserPreference()
    myPrefForm.hideMail = Boolean(pref.hideMail)
    myPrefForm.timeZone = pref.timeZone ?? 'Asia/Shanghai'
    myPrefForm.others = pref.others ?? ''
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载偏好设置失败'))
  } finally {
    myPrefLoading.value = false
  }
}

async function submitMyPreference() {
  if (!myPrefFormRef.value) return
  const valid = await myPrefFormRef.value.validate().catch(() => false)
  if (!valid) return

  myPrefLoading.value = true
  try {
    await updateCurrentUserPreference({
      hideMail: myPrefForm.hideMail,
      timeZone: myPrefForm.timeZone,
      others: myPrefForm.others || undefined,
    })
    ElMessage.success('偏好设置已更新')
    myPrefDialogVisible.value = false
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '更新偏好设置失败'))
  } finally {
    myPrefLoading.value = false
  }
}
</script>

<template>
  <el-container class="main-layout">
    <el-header class="main-layout__header" height="56px">
      <div class="main-layout__brand">
        <span class="main-layout__logo-mark" aria-hidden="true" />
        <span class="main-layout__title">JRedmine</span>
      </div>
      <div v-if="auth.isAuthenticated" class="main-layout__user">
        <span class="main-layout__name">{{ auth.displayName }}</span>
        <el-button link type="primary" @click="openMyPreference">我的偏好</el-button>
        <el-button link type="primary" @click="openChangePassword">修改密码</el-button>
        <el-button link type="primary" @click="logout">退出</el-button>
      </div>
    </el-header>

    <el-container class="main-layout__body">
      <el-aside class="main-layout__aside" width="232px">
        <el-menu class="main-layout__menu" :default-active="activeMenu" @select="onMenuSelect">
          <el-menu-item v-for="item in menuItems" :key="item.key" :index="item.key">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-layout__main">
        <div class="main-layout__content">
          <el-breadcrumb v-if="showBreadcrumb" class="main-layout__breadcrumb" separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <router-view />
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="changePwdDialogVisible" title="修改密码" width="420px" append-to-body>
      <el-form
        ref="changePwdFormRef"
        :model="changePwdForm"
        :rules="changePwdRules"
        label-position="top"
        @submit.prevent="submitChangePassword"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="changePwdForm.oldPassword" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="changePwdForm.newPassword" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmNewPassword">
          <el-input
            v-model="changePwdForm.confirmNewPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="changePwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="changePwdLoading" @click="submitChangePassword">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="myPrefDialogVisible" title="我的偏好" width="520px" append-to-body :close-on-click-modal="false">
      <el-form ref="myPrefFormRef" :model="myPrefForm" :rules="myPrefRules" label-position="top" v-loading="myPrefLoading">
        <el-form-item label="隐藏邮箱">
          <el-switch v-model="myPrefForm.hideMail" />
        </el-form-item>
        <el-form-item label="时区" prop="timeZone">
          <el-select v-model="myPrefForm.timeZone" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="tz in timeZoneOptions" :key="tz.value" :label="tz.label" :value="tz.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="其他设置（JSON）">
          <el-input v-model="myPrefForm.others" type="textarea" :rows="4" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="myPrefDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="myPrefLoading" @click="submitMyPreference">保存</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: var(--jr-page-bg);
}

.main-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  box-shadow: var(--jr-shadow-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.main-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-layout__logo-mark {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: linear-gradient(135deg, var(--jr-brand) 0%, #60a5fa 100%);
}

.main-layout__title {
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.main-layout__user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-layout__name {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}

.main-layout__body {
  flex: 1;
  min-height: 0;
}

.main-layout__aside {
  border-right: 1px solid var(--el-border-color-lighter);
  background: #fff;
  padding: 12px 8px 24px;
}

.main-layout__menu {
  border-right: none;
  background: transparent;
}

.main-layout__menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin-bottom: 4px;
}

.main-layout__menu :deep(.el-menu-item.is-active) {
  background: var(--jr-brand-soft);
  color: var(--jr-brand);
  font-weight: 600;
}

.main-layout__main {
  width: 100%;
  padding: 24px;
  background: var(--jr-page-bg);
}

.main-layout__content {
  max-width: 1400px;
  margin: 0 auto;
}

.main-layout__breadcrumb {
  margin-bottom: 16px;
  font-size: 13px;
}
</style>
