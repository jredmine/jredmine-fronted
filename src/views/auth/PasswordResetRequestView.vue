<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { requestPasswordResetApi } from '@/services/auth'
import { parseBackendErrorMessage } from '@/utils/http-error'

const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await requestPasswordResetApi({ email: form.email })
    ElMessage.success('如果该邮箱已注册，重置邮件已发送，请查收')
    void router.push({ name: 'PasswordResetConfirm' })
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '请求失败，请重试'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card class="reset-card jr-auth-card" shadow="hover">
    <template #header>
      <span>找回密码</span>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" type="email" autocomplete="email" clearable />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit" class="reset-card__submit">
          发送重置邮件
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
