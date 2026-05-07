<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { useAuthStore } from '@/stores/auth'
import { useProjectContextStore } from '@/stores/project-context'
import { changePasswordApi } from '@/services/auth'
import { parseBackendErrorMessage } from '@/utils/http-error'

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
</script>

<template>
  <el-container class="main-layout">
    <el-header class="main-layout__header">
      <span class="main-layout__title">JRedmine</span>
      <div v-if="auth.isAuthenticated" class="main-layout__user">
        <span class="main-layout__name">{{ auth.displayName }}</span>
        <el-button link type="primary" @click="openChangePassword">修改密码</el-button>
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
