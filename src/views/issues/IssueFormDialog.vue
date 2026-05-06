<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { createIssue } from '@/services/issues'
import { fetchTrackerList } from '@/services/trackers'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { IssueCreatePayload } from '@/types/issue'
import type { TrackerListItem } from '@/types/tracker'

const props = defineProps<{
  modelValue: boolean
  projectId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const saving = ref(false)
const formRef = ref<FormInstance>()

const trackersLoading = ref(false)
const trackers = ref<TrackerListItem[]>([])

const form = reactive<IssueCreatePayload>({
  projectId: 0,
  trackerId: 0,
  subject: '',
  description: '',
  priorityId: 1,
  assignedToId: undefined,
  startDate: undefined,
  dueDate: undefined,
  estimatedHours: undefined,
  doneRatio: 0,
  isPrivate: false,
})

const rules: FormRules<IssueCreatePayload> = {
  trackerId: [{ required: true, message: '请选择跟踪器', trigger: 'change' }],
  subject: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  priorityId: [{ required: true, message: '请输入优先级 ID', trigger: 'blur' }],
}

function resetForm() {
  form.projectId = props.projectId ?? 0
  form.trackerId = 0
  form.subject = ''
  form.description = ''
  form.priorityId = 1
  form.assignedToId = undefined
  form.startDate = undefined
  form.dueDate = undefined
  form.estimatedHours = undefined
  form.doneRatio = 0
  form.isPrivate = false
  formRef.value?.clearValidate()
}

async function loadTrackers() {
  trackersLoading.value = true
  try {
    const page = await fetchTrackerList({ current: 1, size: 200 })
    trackers.value = page.records ?? []
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载跟踪器失败'))
  } finally {
    trackersLoading.value = false
  }
}

async function submit() {
  if (!formRef.value) return
  if (props.projectId == null) {
    ElMessage.warning('缺少项目 ID')
    return
  }
  form.projectId = props.projectId

  await formRef.value.validate()

  saving.value = true
  try {
    await createIssue({
      projectId: form.projectId,
      trackerId: Number(form.trackerId),
      subject: form.subject,
      description: form.description || undefined,
      priorityId: Number(form.priorityId),
      assignedToId: form.assignedToId ? Number(form.assignedToId) : undefined,
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
      estimatedHours: form.estimatedHours != null ? Number(form.estimatedHours) : undefined,
      doneRatio: form.doneRatio != null ? Number(form.doneRatio) : undefined,
      isPrivate: Boolean(form.isPrivate),
    })
    ElMessage.success('任务创建成功')
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '创建任务失败'))
  } finally {
    saving.value = false
  }
}

watch(
  () => visible.value,
  (v) => {
    if (v) {
      resetForm()
      void loadTrackers()
    }
  },
)

onMounted(() => {
  if (visible.value) void loadTrackers()
})
</script>

<template>
  <el-dialog v-model="visible" title="新建任务" width="720px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="跟踪器" prop="trackerId">
        <el-select
          v-model="form.trackerId"
          style="width: 100%"
          filterable
          :loading="trackersLoading"
          placeholder="请选择跟踪器"
        >
          <el-option v-for="t in trackers" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="标题" prop="subject">
        <el-input v-model="form.subject" maxlength="255" show-word-limit placeholder="请输入任务标题" />
      </el-form-item>

      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="4" placeholder="可选" />
      </el-form-item>

      <el-form-item label="优先级 ID" prop="priorityId">
        <el-input-number v-model="form.priorityId" :min="1" :max="9999" />
        <span class="hint">后端暂未提供优先级枚举接口时，可先填数值 ID。</span>
      </el-form-item>

      <el-form-item label="指派人 ID">
        <el-input-number v-model="form.assignedToId" :min="1" :max="999999999" placeholder="可选" />
      </el-form-item>

      <el-form-item label="开始/截止">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="开始日期"
          style="width: 170px"
        />
        <span style="margin: 0 10px">—</span>
        <el-date-picker
          v-model="form.dueDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="截止日期"
          style="width: 170px"
        />
      </el-form-item>

      <el-form-item label="预估工时">
        <el-input-number v-model="form.estimatedHours" :min="0" :max="100000" :step="0.5" />
      </el-form-item>

      <el-form-item label="完成度">
        <el-slider v-model="form.doneRatio" :min="0" :max="100" show-input />
      </el-form-item>

      <el-form-item label="私有">
        <el-switch v-model="form.isPrivate" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">创建</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

