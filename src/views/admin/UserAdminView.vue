<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import type { PageResponse } from '@/types/api-response'
import type { UserDetail, UserListItem, UserPreference } from '@/types/rbac'
import {
  createUser,
  deleteUser,
  fetchUserDetail,
  fetchUserList,
  fetchUserPreference,
  updateUser,
  updateUserPreference,
  updateUserStatus,
} from '@/services/users'
import { parseBackendErrorMessage } from '@/utils/http-error'

const loading = ref(false)
const queryLogin = ref('')
const page = ref<PageResponse<UserListItem>>({
  records: [],
  total: 0,
  current: 1,
  size: 10,
  pages: 0,
})

const tableData = computed(() => page.value.records)

const statusOptions = [
  { value: 1, label: '启用' },
  { value: 2, label: '锁定' },
  { value: 3, label: '待激活' },
]

const languageOptions = [
  { value: 'zh-CN', label: '简体中文（zh-CN）' },
  { value: 'en-US', label: 'English（en-US）' },
]

const mailNotificationOptions = [
  { value: 'all', label: '全部通知（all）' },
  { value: 'none', label: '不通知（none）' },
  { value: 'only_my_events', label: '仅我的事件（only_my_events）' },
]

const timeZoneOptions = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'UTC', label: 'UTC' },
]

function statusLabel(v: number | null | undefined) {
  const found = statusOptions.find((s) => s.value === v)
  return found ? found.label : String(v ?? '')
}

async function load() {
  loading.value = true
  try {
    const data = await fetchUserList({
      current: page.value.current,
      size: page.value.size,
      login: queryLogin.value || undefined,
    })
    page.value = data
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载用户列表失败'))
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value.current = 1
  void load()
}

function onSizeChange(size: number) {
  page.value.size = size
  page.value.current = 1
  void load()
}

function onCurrentChange(current: number) {
  page.value.current = current
  void load()
}

const userDialogVisible = ref(false)
const userDialogMode = ref<'create' | 'edit'>('create')
const userFormRef = ref<FormInstance>()
const userDialogLoading = ref(false)

const userForm = reactive({
  id: 0,
  login: '',
  password: '',
  firstname: '',
  lastname: '',
  email: '',
  admin: false,
  status: 1,
  language: 'zh-CN',
  mailNotification: 'all',
})

const userRules: FormRules = {
  login: [{ required: true, message: '请输入登录名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 40, message: '密码长度为 8～40 个字符', trigger: 'blur' },
  ],
  firstname: [{ required: true, message: '请输入名字', trigger: 'blur' }],
  lastname: [{ required: true, message: '请输入姓氏', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
}

const userEditRules: FormRules = {
  firstname: [{ required: true, message: '请输入名字', trigger: 'blur' }],
  lastname: [{ required: true, message: '请输入姓氏', trigger: 'blur' }],
}

function openCreate() {
  userDialogMode.value = 'create'
  userForm.id = 0
  userForm.login = ''
  userForm.password = ''
  userForm.firstname = ''
  userForm.lastname = ''
  userForm.email = ''
  userForm.admin = false
  userForm.status = 1
  userForm.language = 'zh-CN'
  userForm.mailNotification = 'all'
  userDialogVisible.value = true
}

async function openEdit(row: UserListItem) {
  userDialogMode.value = 'edit'
  userDialogVisible.value = true
  userDialogLoading.value = true
  try {
    const detail: UserDetail = await fetchUserDetail(row.id)
    userForm.id = detail.id
    userForm.login = detail.login
    userForm.password = ''
    userForm.firstname = detail.firstname
    userForm.lastname = detail.lastname
    userForm.email = '' // UserDetailResponseDTO 未返回 email
    userForm.admin = Boolean(detail.admin)
    userForm.status = detail.status ?? 1
    userForm.language = detail.language ?? 'zh-CN'
    userForm.mailNotification = detail.mailNotification ?? 'all'
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载用户详情失败'))
  } finally {
    userDialogLoading.value = false
  }
}

async function submitUser() {
  if (!userFormRef.value) return
  userFormRef.value.clearValidate()
  userDialogLoading.value = true
  try {
    const valid = await userFormRef.value.validate().catch(() => false)
    if (!valid) return

    if (userDialogMode.value === 'create') {
      await createUser({
        login: userForm.login,
        password: userForm.password,
        firstname: userForm.firstname,
        lastname: userForm.lastname,
        email: userForm.email,
        admin: userForm.admin,
        status: userForm.status,
        language: userForm.language,
        mailNotification: userForm.mailNotification,
      })
      ElMessage.success('创建成功')
    } else {
      await updateUser(userForm.id, {
        firstname: userForm.firstname,
        lastname: userForm.lastname,
        email: userForm.email || undefined,
        admin: userForm.admin,
        status: userForm.status,
        language: userForm.language,
        mailNotification: userForm.mailNotification,
      })
      ElMessage.success('更新成功')
    }
    userDialogVisible.value = false
    void load()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, userDialogMode.value === 'create' ? '创建失败' : '更新失败'))
  } finally {
    userDialogLoading.value = false
  }
}

const prefDialogVisible = ref(false)
const prefLoading = ref(false)
const prefFormRef = ref<FormInstance>()
const prefUser = ref<UserListItem | null>(null)
const prefForm = reactive({
  hideMail: false,
  timeZone: 'Asia/Shanghai',
  others: '',
})

const prefRules: FormRules = {
  timeZone: [{ required: true, message: '请输入时区', trigger: 'blur' }],
}

async function openPreference(row: UserListItem) {
  prefUser.value = row
  prefDialogVisible.value = true
  prefLoading.value = true
  try {
    const p: UserPreference = await fetchUserPreference(row.id)
    prefForm.hideMail = Boolean(p.hideMail)
    prefForm.timeZone = p.timeZone ?? 'Asia/Shanghai'
    prefForm.others = p.others ?? ''
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载偏好设置失败'))
  } finally {
    prefLoading.value = false
  }
}

async function submitPreference() {
  if (!prefFormRef.value || !prefUser.value) return
  const valid = await prefFormRef.value.validate().catch(() => false)
  if (!valid) return

  prefLoading.value = true
  try {
    await updateUserPreference(prefUser.value.id, {
      hideMail: prefForm.hideMail,
      timeZone: prefForm.timeZone,
      others: prefForm.others || undefined,
    })
    ElMessage.success('偏好设置已更新')
    prefDialogVisible.value = false
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '更新偏好设置失败'))
  } finally {
    prefLoading.value = false
  }
}

async function onChangeStatus(row: UserListItem, status: number) {
  try {
    await updateUserStatus(row.id, { status })
    ElMessage.success('状态已更新')
    void load()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '更新状态失败'))
  }
}

async function onDelete(row: UserListItem) {
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.login}」？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '删除失败'))
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="admin-toolbar">
        <span>用户管理</span>
        <div class="admin-toolbar__right">
          <el-input v-model="queryLogin" placeholder="按登录名搜索" clearable style="width: 240px" @keyup.enter="onSearch" />
          <el-button type="primary" :loading="loading" @click="onSearch">查询</el-button>
          <el-button type="success" @click="openCreate">新增用户</el-button>
        </div>
      </div>
    </template>

    <el-table :data="tableData" v-loading="loading" row-key="id">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="login" label="登录名" min-width="160" />
      <el-table-column label="姓名" min-width="160">
        <template #default="{ row }">{{ `${row.firstname ?? ''} ${row.lastname ?? ''}`.trim() }}</template>
      </el-table-column>
      <el-table-column prop="admin" label="管理员" width="100">
        <template #default="{ row }">{{ row.admin ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-dropdown @command="(cmd) => onChangeStatus(row, cmd)">
            <span class="status-link">{{ statusLabel(row.status) }}</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="s in statusOptions" :key="s.value" :command="s.value">
                  {{ s.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="openPreference(row)">偏好设置</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="admin-pager">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :total="page.total"
        :current-page="page.current"
        :page-size="page.size"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>

    <el-dialog
      v-model="userDialogVisible"
      :title="userDialogMode === 'create' ? '新增用户' : '编辑用户'"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userDialogMode === 'create' ? userRules : userEditRules"
        label-position="top"
        v-loading="userDialogLoading"
      >
        <el-form-item label="登录名" prop="login">
          <el-input v-model="userForm.login" :disabled="userDialogMode === 'edit'" autocomplete="username" />
        </el-form-item>

        <el-form-item v-if="userDialogMode === 'create'" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" show-password autocomplete="new-password" />
        </el-form-item>

        <el-form-item label="名字" prop="firstname">
          <el-input v-model="userForm.firstname" autocomplete="given-name" />
        </el-form-item>
        <el-form-item label="姓氏" prop="lastname">
          <el-input v-model="userForm.lastname" autocomplete="family-name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" type="email" autocomplete="email" placeholder="可选（后端详情未返回时可能为空）" />
        </el-form-item>

        <div class="user-grid">
          <el-form-item label="管理员">
            <el-switch v-model="userForm.admin" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="userForm.status" style="width: 100%">
              <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="语言">
            <el-select v-model="userForm.language" filterable allow-create default-first-option style="width: 100%">
              <el-option v-for="l in languageOptions" :key="l.value" :label="l.label" :value="l.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="邮件通知">
            <el-select
              v-model="userForm.mailNotification"
              filterable
              allow-create
              default-first-option
              style="width: 100%"
            >
              <el-option v-for="m in mailNotificationOptions" :key="m.value" :label="m.label" :value="m.value" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="userDialogLoading" @click="submitUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="prefDialogVisible"
      title="偏好设置"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="prefFormRef" :model="prefForm" :rules="prefRules" label-position="top" v-loading="prefLoading">
        <el-form-item label="隐藏邮箱">
          <el-switch v-model="prefForm.hideMail" />
        </el-form-item>
        <el-form-item label="时区" prop="timeZone">
          <el-select v-model="prefForm.timeZone" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="tz in timeZoneOptions" :key="tz.value" :label="tz.label" :value="tz.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="其他设置（JSON）">
          <el-input v-model="prefForm.others" type="textarea" :rows="4" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="prefDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="prefLoading" @click="submitPreference">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.admin-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.status-link {
  cursor: pointer;
  color: var(--el-color-primary);
}

.status-link:hover {
  text-decoration: underline;
}

.user-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>

