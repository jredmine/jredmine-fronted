<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { createProject, fetchProjectDetail, updateProject } from '@/services/projects'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { ProjectDetail } from '@/types/project'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  projectId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  success: []
}>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: '',
  identifier: '',
  description: '',
  homepage: '',
  isPublic: true,
  inheritMembers: false,
  parentId: undefined as number | undefined,
  status: 1 as number,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  identifier: [
    {
      pattern: /^[a-z0-9_-]*$/,
      message: '仅小写字母、数字、连字符、下划线，可留空由后端生成',
      trigger: 'blur',
    },
  ],
}

function resetForm() {
  form.name = ''
  form.identifier = ''
  form.description = ''
  form.homepage = ''
  form.isPublic = true
  form.inheritMembers = false
  form.parentId = undefined
  form.status = 1
}

function applyDetail(d: ProjectDetail) {
  form.name = d.name ?? ''
  form.identifier = d.identifier ?? ''
  form.description = d.description ?? ''
  form.homepage = d.homepage ?? ''
  form.isPublic = d.isPublic ?? true
  form.inheritMembers = d.inheritMembers ?? false
  form.parentId = d.parentId ?? undefined
  form.status = d.status ?? 1
}

watch(
  () => [props.modelValue, props.mode, props.projectId] as const,
  async ([open, mode, id]) => {
    if (!open) return
    formRef.value?.clearValidate()
    if (mode === 'create') {
      resetForm()
      return
    }
    if (id == null) return
    loading.value = true
    try {
      const d = await fetchProjectDetail(id)
      applyDetail(d)
    } catch (e) {
      ElMessage.error(parseBackendErrorMessage(e, '加载项目失败'))
      emit('update:modelValue', false)
    } finally {
      loading.value = false
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (props.mode === 'create') {
      await createProject({
        name: form.name,
        identifier: form.identifier || undefined,
        description: form.description || undefined,
        homepage: form.homepage || undefined,
        isPublic: form.isPublic,
        inheritMembers: form.inheritMembers,
        parentId: form.parentId ?? undefined,
      })
      ElMessage.success('项目创建成功')
    } else if (props.projectId != null) {
      await updateProject(props.projectId, {
        name: form.name,
        identifier: form.identifier || undefined,
        description: form.description || undefined,
        homepage: form.homepage || undefined,
        isPublic: form.isPublic,
        inheritMembers: form.inheritMembers,
        parentId: form.parentId ?? undefined,
        status: form.status,
      })
      ElMessage.success('项目已更新')
    }
    emit('success')
    close()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '保存失败'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'create' ? '新建项目' : '编辑项目'"
    width="560px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-position="top">
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="form.name" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="标识符（可选）" prop="identifier">
        <el-input v-model="form.identifier" placeholder="如 my-project" />
      </el-form-item>
      <el-form-item v-if="mode === 'edit'" label="状态">
        <el-select v-model="form.status" style="width: 100%">
          <el-option :value="1" label="活跃" />
          <el-option :value="5" label="关闭" />
          <el-option :value="9" label="归档" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="主页">
        <el-input v-model="form.homepage" placeholder="https://..." />
      </el-form-item>
      <el-form-item label="父项目 ID（可选）">
        <el-input-number
          v-model="form.parentId"
          :min="1"
          clearable
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="公开项目">
        <el-switch v-model="form.isPublic" />
      </el-form-item>
      <el-form-item label="继承父项目成员">
        <el-switch v-model="form.inheritMembers" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>
