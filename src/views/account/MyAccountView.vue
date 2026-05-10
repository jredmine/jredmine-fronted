<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { useAuthStore } from '@/stores/auth'
import {
  fetchCurrentUser,
  fetchCurrentUserPreference,
  updateCurrentUserPreference,
  updateCurrentUserProfile,
} from '@/services/users'
import { parseBackendErrorMessage } from '@/utils/http-error'

const auth = useAuthStore()

const pageLoading = ref(true)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  language: 'zh-CN',
  mailNotification: 'all',
  hideMail: false,
  timeZone: 'Asia/Shanghai',
  others: '',
})

const metaLogin = ref('')
const metaCreatedOn = ref<string | null>(null)

/** 展示为 YYYY-MM-DD HH:mm:ss（本地时区），去掉 ISO 中的 T 与毫秒时区后缀 */
function formatDateTime(raw: string | null | undefined): string {
  if (raw == null || raw === '') return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const displayCreatedOn = computed(() => formatDateTime(metaCreatedOn.value))

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

const rules: FormRules = {
  firstname: [{ required: true, message: '请输入名字', trigger: 'blur' }],
  lastname: [{ required: true, message: '请输入姓氏', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  timeZone: [{ required: true, message: '请选择时区', trigger: 'change' }],
}

async function load() {
  pageLoading.value = true
  try {
    const [detail, preference] = await Promise.all([fetchCurrentUser(), fetchCurrentUserPreference()])
    metaLogin.value = detail.login
    metaCreatedOn.value = detail.createdOn ?? null

    form.firstname = detail.firstname ?? ''
    form.lastname = detail.lastname ?? ''
    form.email = detail.email ?? ''
    form.language = detail.language ?? 'zh-CN'
    form.mailNotification = detail.mailNotification ?? 'all'

    form.hideMail = Boolean(preference.hideMail)
    form.timeZone = preference.timeZone ?? 'Asia/Shanghai'
    form.others = preference.others ?? ''
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载账号信息失败'))
  } finally {
    pageLoading.value = false
  }
}

async function saveAll() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const updated = await updateCurrentUserProfile({
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      email: form.email.trim(),
      language: form.language || undefined,
      mailNotification: form.mailNotification || undefined,
    })
    auth.syncUserFromDetail(updated)
    metaCreatedOn.value = updated.createdOn ?? metaCreatedOn.value

    await updateCurrentUserPreference({
      hideMail: form.hideMail,
      timeZone: form.timeZone,
      others: form.others || undefined,
    })

    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <el-card class="jr-panel account-page" shadow="never" v-loading="pageLoading">
    <template #header>
      <div class="account-page__header">
        <span>我的账号</span>
        <el-button type="primary" :loading="saving" @click="saveAll">保存</el-button>
      </div>
    </template>

    <el-row :gutter="24">
      <el-col :xs="24" :lg="16">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <h3 class="account-page__section-title">基本信息</h3>
          <el-form-item label="名字" prop="firstname">
            <el-input v-model="form.firstname" maxlength="30" show-word-limit autocomplete="given-name" />
          </el-form-item>
          <el-form-item label="姓氏" prop="lastname">
            <el-input v-model="form.lastname" maxlength="255" show-word-limit autocomplete="family-name" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" maxlength="255" autocomplete="email" />
          </el-form-item>
          <el-form-item label="界面语言">
            <el-select v-model="form.language" style="width: 100%">
              <el-option v-for="o in languageOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item>

          <h3 class="account-page__section-title">邮件通知</h3>
          <el-form-item label="通知策略">
            <el-select v-model="form.mailNotification" style="width: 100%">
              <el-option
                v-for="o in mailNotificationOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </el-form-item>

          <h3 class="account-page__section-title">偏好设置</h3>
          <el-form-item label="在界面中隐藏我的邮箱">
            <el-switch v-model="form.hideMail" />
          </el-form-item>
          <el-form-item label="时区" prop="timeZone">
            <el-select v-model="form.timeZone" filterable allow-create default-first-option style="width: 100%">
              <el-option v-for="tz in timeZoneOptions" :key="tz.value" :label="tz.label" :value="tz.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="其他设置（JSON）">
            <el-input v-model="form.others" type="textarea" :rows="3" placeholder="可选，扩展偏好" />
          </el-form-item>
        </el-form>

        <p class="account-page__hint">修改登录密码请使用顶栏「修改密码」。</p>
      </el-col>

      <el-col :xs="24" :lg="8">
        <div class="account-page__side">
          <p class="account-page__side-row">
            <span class="account-page__side-label">登录名</span>
            <span class="account-page__side-value">{{ metaLogin }}</span>
          </p>
          <p class="account-page__side-row">
            <span class="account-page__side-label">创建于</span>
            <span class="account-page__side-value">{{ displayCreatedOn }}</span>
          </p>
          <el-alert type="info" show-icon :closable="false" title="说明">
            RSS/Atom 密钥等与访问令牌相关的功能依赖后端接口，若有模型再接前端。
          </el-alert>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.account-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.account-page__section-title {
  margin: 20px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.account-page__section-title:first-child {
  margin-top: 0;
}

.account-page__hint {
  margin-top: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.account-page__side {
  padding: 16px;
  border-radius: var(--jr-radius);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.account-page__side-row {
  margin: 0 0 12px;
  font-size: 14px;
}

.account-page__side-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.account-page__side-value {
  word-break: break-all;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.el-alert {
  margin-top: 8px;
}
</style>
