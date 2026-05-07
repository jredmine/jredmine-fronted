<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { confirmPasswordResetApi } from '@/services/auth'
import { parseBackendErrorMessage } from '@/utils/http-error'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  token: typeof route.query.token === 'string' ? route.query.token : '',
  newPassword: '',
  confirmPassword: '',
})

function validateConfirm(_rule: unknown, value: string, callback: (e?: Error) => void) {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  token: [{ required: true, message: '请输入重置 Token', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 40, message: '密码长度为 8～40 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await confirmPasswordResetApi({
      token: form.token,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    })
    ElMessage.success('密码重置成功，请使用新密码登录')
    const target: RouteLocationRaw = { name: 'Login' }
    void router.replace(target)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '密码重置失败，请重试'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card class="reset-card" shadow="hover">
    <template #header>
      <span>重置密码</span>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
      <el-form-item label="重置 Token" prop="token">
        <el-input v-model="form.token" clearable placeholder="从邮件链接中复制 Token，或通过链接自动带入" />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password autocomplete="new-password" />
      </el-form-item>

      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password autocomplete="new-password" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit" class="reset-card__submit">
          确认重置
        </el-button>
        <router-link :to="{ name: 'Login' }" class="reset-card__link">返回登录</router-link>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.reset-card {
  width: min(460px, 100%);
}

.reset-card__submit {
  width: 100%;
  margin-bottom: 12px;
}

.reset-card__link {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--el-color-primary);
  text-decoration: none;
}

.reset-card__link:hover {
  text-decoration: underline;
}
</style>
