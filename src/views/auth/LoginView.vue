<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { loginApi } from '@/services/auth'
import { parseBackendErrorMessage } from '@/utils/http-error'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  login: '',
  password: '',
})

const rules: FormRules = {
  login: [{ required: true, message: '请输入登录名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const data = await loginApi(form.login, form.password)
    auth.applyLoginPayload(data)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect
    const target: RouteLocationRaw =
      typeof redirect === 'string' && redirect ? redirect : { name: 'Home' }
    void router.replace(target)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '登录失败，请重试'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card class="login-card jr-auth-card" shadow="hover">
    <template #header>
      <span>登录</span>
    </template>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
      <el-form-item label="登录名" prop="login">
        <el-input v-model="form.login" autocomplete="username" clearable />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          autocomplete="current-password"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit" class="login-card__submit">
          登录
        </el-button>
        <div class="login-card__links">
          <router-link :to="{ name: 'PasswordResetRequest' }" class="login-card__link">
            忘记密码
          </router-link>
          <router-link :to="{ name: 'Register' }" class="login-card__link">注册账号</router-link>
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.login-card {
  width: min(420px, 100%);
}

.login-card__submit {
  width: 100%;
  margin-bottom: 12px;
}

.login-card__links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.login-card__link {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--el-color-primary);
  text-decoration: none;
}

.login-card__link:hover {
  text-decoration: underline;
}
</style>
