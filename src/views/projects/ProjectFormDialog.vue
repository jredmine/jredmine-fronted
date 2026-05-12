<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { createProject, fetchProjectDetail, fetchProjectList, updateProject } from '@/services/projects'
import { fetchTrackerList } from '@/services/trackers'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { ProjectDetail, ProjectListItem } from '@/types/project'
import type { TrackerListItem } from '@/types/tracker'

const MODULE_OPTIONS = [
  { code: 'issues', label: '任务管理' },
  { code: 'wiki', label: 'Wiki' },
  { code: 'boards', label: '论坛' },
  { code: 'documents', label: '文档管理' },
  { code: 'files', label: '文件管理' },
  { code: 'repository', label: '代码仓库' },
  { code: 'time_tracking', label: '时间跟踪' },
  { code: 'news', label: '新闻' },
  { code: 'calendar', label: '日历' },
  { code: 'gantt', label: '甘特图' },
] as const

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

const parentOptions = ref<ProjectListItem[]>([])
const parentLoading = ref(false)

async function searchParentProjects(keyword: string) {
  parentLoading.value = true
  try {
    const res = await fetchProjectList({ keyword, size: 50 })
    parentOptions.value = res.records.filter((p) => p.id !== props.projectId)
  } catch {
    parentOptions.value = []
  } finally {
    parentLoading.value = false
  }
}

async function loadParentProjects() {
  await searchParentProjects('')
}

const trackerOptions = ref<TrackerListItem[]>([])

async function loadTrackers() {
  try {
    const res = await fetchTrackerList({ size: 100 })
    trackerOptions.value = res.records
  } catch {
    trackerOptions.value = []
  }
}

const form = reactive({
  name: '',
  identifier: '',
  description: '',
  homepage: '',
  isPublic: true,
  inheritMembers: false,
  parentId: undefined as number | undefined,
  enabledModules: [] as string[],
  trackerIds: [] as number[],
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
  form.enabledModules = []
  form.trackerIds = []
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
  form.enabledModules = d.enabledModules ?? []
  form.trackerIds = d.trackerIds ?? []
  form.status = d.status ?? 1
}

watch(
  () => [props.modelValue, props.mode, props.projectId] as const,
  async ([open, mode, id]) => {
    if (!open) return
    formRef.value?.clearValidate()
    loadParentProjects()
    loadTrackers()
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
        enabledModules: form.enabledModules.length ? form.enabledModules : undefined,
        trackerIds: form.trackerIds.length ? form.trackerIds : undefined,
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
        enabledModules: form.enabledModules.length ? form.enabledModules : undefined,
        trackerIds: form.trackerIds.length ? form.trackerIds : undefined,
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
      <el-form-item label="父项目（可选）">
        <el-select
          v-model="form.parentId"
          filterable
          remote
          clearable
          placeholder="搜索并选择父项目"
          :remote-method="searchParentProjects"
          :loading="parentLoading"
          style="width: 100%"
        >
          <el-option
            v-for="p in parentOptions"
            :key="p.id"
            :label="p.name"
            :value="p.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="启用的模块">
        <el-select
          v-model="form.enabledModules"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择要启用的模块"
          style="width: 100%"
        >
          <el-option
            v-for="m in MODULE_OPTIONS"
            :key="m.code"
            :label="m.label"
            :value="m.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="跟踪器">
        <el-select
          v-model="form.trackerIds"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择跟踪器"
          style="width: 100%"
        >
          <el-option
            v-for="t in trackerOptions"
            :key="t.id"
            :label="t.name"
            :value="t.id"
          />
        </el-select>
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
