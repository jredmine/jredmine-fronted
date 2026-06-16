<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { createTimeEntry, fetchTimeEntryActivities } from '@/services/time-entries'
import { fetchProjectMembers } from '@/services/projects'
import { useAuthStore } from '@/stores/auth'
import { todayDateString } from '@/utils/datetime'
import { parseBackendErrorMessage } from '@/utils/http-error'
import { memberDisplayName } from '@/utils/project-members'
import type { TimeEntryActivity, TimeEntryCreatePayload } from '@/types/time-entry'
import type { ProjectMember } from '@/types/project'

const props = defineProps<{
  modelValue: boolean
  projectId: number | null
  issueId: number | null
  issueSubject?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const auth = useAuthStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const saving = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const activitiesLoading = ref(false)
const activities = ref<TimeEntryActivity[]>([])

const membersLoading = ref(false)
const members = ref<ProjectMember[]>([])

const form = reactive({
  spentOn: todayDateString(),
  hours: 1,
  activityId: undefined as number | undefined,
  userId: undefined as number | undefined,
  comments: '',
})

const rules: FormRules = {
  spentOn: [{ required: true, message: '请选择日期', trigger: 'change' }],
  hours: [{ required: true, message: '请输入工时', trigger: 'blur' }],
  activityId: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
}

const dialogTitle = computed(() => {
  const subject = props.issueSubject?.trim()
  if (subject) return `登记工时 — ${subject}`
  if (props.issueId != null) return `登记工时 — #${props.issueId}`
  return '登记工时'
})

function resetForm() {
  form.spentOn = todayDateString()
  form.hours = 1
  form.activityId = activities.value.find((a) => a.isDefault)?.id ?? activities.value[0]?.id
  form.userId = auth.user?.id
  form.comments = ''
  formRef.value?.clearValidate()
}

async function loadActivities() {
  activitiesLoading.value = true
  try {
    activities.value = await fetchTimeEntryActivities()
    if (form.activityId == null) {
      form.activityId = activities.value.find((a) => a.isDefault)?.id ?? activities.value[0]?.id
    }
  } catch (e) {
    activities.value = []
    ElMessage.error(parseBackendErrorMessage(e, '加载活动类型失败'))
  } finally {
    activitiesLoading.value = false
  }
}

async function loadMembers(pid: number) {
  membersLoading.value = true
  try {
    const page = await fetchProjectMembers(pid, { current: 1, size: 200 })
    members.value = page.records ?? []
  } catch (e) {
    members.value = []
    ElMessage.error(parseBackendErrorMessage(e, '加载项目成员失败'))
  } finally {
    membersLoading.value = false
  }
}

async function prepareDialog() {
  const pid = props.projectId
  if (pid == null) {
    ElMessage.warning('无法解析问题所属项目')
    visible.value = false
    return
  }

  loading.value = true
  formRef.value?.clearValidate()
  try {
    await Promise.all([loadActivities(), loadMembers(pid)])
    resetForm()
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!formRef.value) return
  const pid = props.projectId
  const iid = props.issueId
  if (pid == null || iid == null) {
    ElMessage.warning('缺少项目或问题信息')
    return
  }

  await formRef.value.validate()

  const payload: TimeEntryCreatePayload = {
    projectId: pid,
    issueId: iid,
    hours: Number(form.hours),
    spentOn: form.spentOn,
    activityId: Number(form.activityId),
    comments: form.comments.trim() || undefined,
  }
  if (form.userId != null && form.userId !== auth.user?.id) {
    payload.userId = form.userId
  }

  saving.value = true
  try {
    await createTimeEntry(payload)
    ElMessage.success('工时登记成功')
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '登记工时失败'))
  } finally {
    saving.value = false
  }
}

watch(
  () => visible.value,
  (v) => {
    if (v) void prepareDialog()
  },
)

onMounted(() => {
  if (visible.value) void prepareDialog()
})
</script>

<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="520px" destroy-on-close>
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="96px">
      <el-form-item label="日期" prop="spentOn">
        <el-date-picker
          v-model="form.spentOn"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="工作日期"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="工时" prop="hours">
        <el-input-number
          v-model="form.hours"
          :min="0.01"
          :max="999"
          :step="0.25"
          :precision="2"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="活动" prop="activityId">
        <el-select
          v-model="form.activityId"
          style="width: 100%"
          filterable
          :loading="activitiesLoading"
          placeholder="请选择活动类型"
        >
          <el-option v-for="a in activities" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="用户">
        <el-select
          v-model="form.userId"
          style="width: 100%"
          filterable
          :loading="membersLoading"
          placeholder="当前用户"
        >
          <el-option
            v-for="m in members"
            :key="m.userId"
            :label="memberDisplayName(m)"
            :value="m.userId"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.comments"
          type="textarea"
          :rows="3"
          maxlength="1024"
          show-word-limit
          placeholder="可选"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">登记</el-button>
    </template>
  </el-dialog>
</template>
