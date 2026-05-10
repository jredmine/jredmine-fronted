<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { registerApi } from '@/services/auth'
import { parseBackendErrorMessage } from '@/utils/http-error'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  login: '',
  password: '',
  confirmPassword: '',
  firstname: '',
  lastname: '',
  email: '',
})

function validateConfirm(_rule: unknown, value: string, callback: (e?: Error) => void) {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  login: [{ required: true, message: '请输入登录名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 40, message: '密码长度为 8～40 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
  firstname: [{ required: true, message: '请输入名字', trigger: 'blur' }],
  lastname: [{ required: true, message: '请输入姓氏', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await registerApi({
      login: form.login,
      password: form.password,
      confirmPassword: form.confirmPassword,
      firstname: form.firstname,
      lastname: form.lastname,
      email: form.email,
    })
    ElMessage.success('注册成功，请登录')
    void router.push({ name: 'Login' })
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '注册失败，请重试'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card class="register-card jr-auth-card" shadow="hover">
    <template #header>
      <span>注册</span>
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
          autocomplete="new-password"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>
      <el-form-item label="名字" prop="firstname">
        <el-input v-model="form.firstname" autocomplete="given-name" />
      </el-form-item>
      <el-form-item label="姓氏" prop="lastname">
        <el-input v-model="form.lastname" autocomplete="family-name" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" type="email" autocomplete="email" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit" class="register-card__submit">
          注册
        </el-button>
        <router-link :to="{ name: 'Login' }" class="register-card__link">返回登录</router-link>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.register-card {
  width: min(440px, 100%);
}

.register-card__submit {
  width: 100%;
  margin-bottom: 12px;
}

.register-card__link {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--el-color-primary);
  text-decoration: none;
}

.register-card__link:hover {
  text-decoration: underline;
}
</style>
