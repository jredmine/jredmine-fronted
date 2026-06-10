<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import {
  createIssue,
  fetchIssueDetail,
  fetchIssueList,
  fetchIssuePriorities,
  updateIssue,
} from '@/services/issues'
import {
  fetchIssueCategories,
  fetchProjectDetail,
  fetchProjectList,
  fetchProjectMembers,
} from '@/services/projects'
import { fetchTrackerList } from '@/services/trackers'
import { fetchIssueStatusList } from '@/services/workflows'
import { parseBackendErrorMessage } from '@/utils/http-error'
import { memberDisplayName } from '@/utils/project-members'
import { renderMarkdown } from '@/utils/wiki-content'
import type { IssueCreatePayload, IssueDetail, IssueListItem } from '@/types/issue'
import type { IssueCategoryItem, IssuePriorityItem } from '@/types/issue-filter'
import type { ProjectListItem, ProjectMember } from '@/types/project'
import type { TrackerListItem } from '@/types/tracker'
import type { IssueStatusItem } from '@/types/workflow'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 默认项目；编辑时仍可在表单中修改项目 */
    projectId: number | null
    mode?: 'create' | 'edit'
    issueId?: number | null
  }>(),
  {
    mode: 'create',
    issueId: null,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success', detail?: IssueDetail): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const isEdit = computed(() => props.mode === 'edit')
const showProjectPick = computed(() => isEdit.value || props.projectId == null)

const saving = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const descTab = ref<'edit' | 'preview'>('edit')

const trackersLoading = ref(false)
const allTrackers = ref<TrackerListItem[]>([])

const projectsLoading = ref(false)
const projectOptions = ref<ProjectListItem[]>([])

const statusesLoading = ref(false)
const statuses = ref<IssueStatusItem[]>([])

const prioritiesLoading = ref(false)
const priorities = ref<IssuePriorityItem[]>([])

const membersLoading = ref(false)
const members = ref<ProjectMember[]>([])

const categoriesLoading = ref(false)
const categories = ref<IssueCategoryItem[]>([])

const parentSearchLoading = ref(false)
const parentOptions = ref<IssueListItem[]>([])

interface IssueFormModel extends IssueCreatePayload {
  statusId?: number
  /** 0 表示未分配 */
  assignedToId: number
  /** 0 表示无类别 */
  categoryId: number
  /** 0 表示无父任务 */
  parentId: number
}

const form = reactive<IssueFormModel>({
  projectId: 0,
  trackerId: 0,
  subject: '',
  description: '',
  priorityId: 1,
  statusId: undefined,
  assignedToId: 0,
  categoryId: 0,
  parentId: 0,
  startDate: undefined,
  dueDate: undefined,
  estimatedHours: undefined,
  doneRatio: 0,
  isPrivate: false,
})

const effectiveProjectId = computed(() => {
  const pid = Number(form.projectId)
  return pid > 0 ? pid : props.projectId
})

const trackerOptions = computed(() => {
  const allowed = projectTrackerIds.value
  if (allowed && allowed.length > 0) {
    const set = new Set(allowed)
    return allTrackers.value.filter((t) => set.has(t.id))
  }
  return allTrackers.value
})

const projectTrackerIds = ref<number[] | null>(null)

const descriptionHtml = computed(() => renderMarkdown(form.description))

const rules = computed<FormRules>(() => ({
  projectId: showProjectPick.value
    ? [
        {
          required: true,
          validator: (_rule, value, callback) => {
            const n = Number(value)
            if (!n || n < 1) callback(new Error('请选择项目'))
            else callback()
          },
          trigger: 'change',
        },
      ]
    : [],
  trackerId: [{ required: true, message: '请选择跟踪器', trigger: 'change' }],
  subject: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  priorityId: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  statusId: isEdit.value ? [{ required: true, message: '请选择状态', trigger: 'change' }] : [],
}))

function resetForm() {
  form.projectId = props.projectId ?? 0
  form.trackerId = 0
  form.subject = ''
  form.description = ''
  form.priorityId = 1
  form.statusId = undefined
  form.assignedToId = 0
  form.categoryId = 0
  form.parentId = 0
  form.startDate = undefined
  form.dueDate = undefined
  form.estimatedHours = undefined
  form.doneRatio = 0
  form.isPrivate = false
  descTab.value = 'edit'
  formRef.value?.clearValidate()
}

function applyDetail(detail: IssueDetail) {
  form.projectId = detail.projectId ?? props.projectId ?? 0
  form.trackerId = detail.trackerId ?? 0
  form.subject = detail.subject ?? ''
  form.description = detail.description ?? ''
  form.priorityId = detail.priorityId ?? 1
  form.statusId = detail.statusId ?? undefined
  form.assignedToId = detail.assignedToId ?? 0
  form.categoryId = detail.categoryId ?? 0
  form.parentId = detail.parentId ?? 0
  form.startDate = detail.startDate ?? undefined
  form.dueDate = detail.dueDate ?? undefined
  form.estimatedHours = detail.estimatedHours ?? undefined
  form.doneRatio = detail.doneRatio ?? 0
  form.isPrivate = detail.isPrivate ?? false
}

function parentOptionLabel(item: IssueListItem) {
  return `#${item.id} ${item.subject}`
}

async function loadTrackers() {
  trackersLoading.value = true
  try {
    const page = await fetchTrackerList({ current: 1, size: 200 })
    allTrackers.value = page.records ?? []
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载跟踪器失败'))
  } finally {
    trackersLoading.value = false
  }
}

async function loadProjectOptions() {
  if (!showProjectPick.value) return
  projectsLoading.value = true
  try {
    const page = await fetchProjectList({ current: 1, size: 500 })
    projectOptions.value = page.records ?? []
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载项目列表失败'))
  } finally {
    projectsLoading.value = false
  }
}

async function loadStatuses() {
  if (!isEdit.value) return
  statusesLoading.value = true
  try {
    statuses.value = await fetchIssueStatusList()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载状态列表失败'))
  } finally {
    statusesLoading.value = false
  }
}

async function loadPriorities() {
  prioritiesLoading.value = true
  try {
    priorities.value = await fetchIssuePriorities()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载优先级列表失败'))
  } finally {
    prioritiesLoading.value = false
  }
}

async function loadProjectTrackers(pid: number) {
  try {
    const project = await fetchProjectDetail(pid)
    projectTrackerIds.value = project.trackerIds?.length ? project.trackerIds : null
    if (form.trackerId && trackerOptions.value.every((t) => t.id !== form.trackerId)) {
      form.trackerId = trackerOptions.value[0]?.id ?? 0
    }
  } catch {
    projectTrackerIds.value = null
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

async function loadCategories(pid: number) {
  categoriesLoading.value = true
  try {
    const page = await fetchIssueCategories(pid)
    categories.value = page.records ?? []
    if (form.categoryId && !categories.value.some((c) => c.id === form.categoryId)) {
      form.categoryId = 0
    }
  } catch (e) {
    categories.value = []
    ElMessage.error(parseBackendErrorMessage(e, '加载问题类别失败'))
  } finally {
    categoriesLoading.value = false
  }
}

async function searchParentIssues(keyword = '') {
  const pid = effectiveProjectId.value
  if (pid == null) {
    parentOptions.value = []
    return
  }
  parentSearchLoading.value = true
  try {
    const page = await fetchIssueList({
      projectId: pid,
      keyword: keyword.trim() || undefined,
      current: 1,
      size: 30,
    })
    parentOptions.value = (page.records ?? []).filter((item) => item.id !== props.issueId)
  } catch {
    parentOptions.value = []
  } finally {
    parentSearchLoading.value = false
  }
}

async function ensureParentOption(parentId: number) {
  if (parentId <= 0) return
  if (parentOptions.value.some((item) => item.id === parentId)) return
  try {
    const detail = await fetchIssueDetail(parentId)
    parentOptions.value = [
      {
        id: detail.id,
        subject: detail.subject,
        trackerId: detail.trackerId,
        trackerName: detail.trackerName,
        projectId: detail.projectId,
        projectName: detail.projectName,
        statusId: detail.statusId,
        statusName: detail.statusName,
        assignedToId: detail.assignedToId,
        assignedToName: detail.assignedToName,
        priorityId: detail.priorityId,
        priorityName: detail.priorityName,
        authorId: detail.authorId,
        authorName: detail.authorName,
        createdOn: detail.createdOn,
        updatedOn: detail.updatedOn,
        dueDate: detail.dueDate,
        doneRatio: detail.doneRatio,
        isPrivate: detail.isPrivate,
      },
      ...parentOptions.value,
    ]
  } catch {
    // ignore
  }
}

async function loadProjectScopedOptions(pid: number | null) {
  if (pid == null) {
    members.value = []
    categories.value = []
    projectTrackerIds.value = null
    parentOptions.value = []
    return
  }
  await Promise.all([loadProjectTrackers(pid), loadMembers(pid), loadCategories(pid), searchParentIssues()])
  if (form.parentId > 0) {
    await ensureParentOption(form.parentId)
  }
}

async function loadIssueForEdit() {
  const id = props.issueId
  if (id == null) return
  loading.value = true
  try {
    const detail = await fetchIssueDetail(id)
    applyDetail(detail)
    await loadProjectScopedOptions(detail.projectId ?? props.projectId)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载问题详情失败'))
    visible.value = false
  } finally {
    loading.value = false
  }
}

async function prepareDialog() {
  formRef.value?.clearValidate()
  await Promise.all([loadTrackers(), loadPriorities(), loadProjectOptions(), loadStatuses()])
  if (isEdit.value) {
    await loadIssueForEdit()
  } else {
    resetForm()
    const pid = props.projectId
    if (pid != null) {
      form.projectId = pid
      await loadProjectScopedOptions(pid)
    }
  }
}

async function submit() {
  if (!formRef.value) return

  await formRef.value.validate()

  const pid = effectiveProjectId.value
  if (pid == null || pid < 1) {
    ElMessage.warning('请选择项目')
    return
  }
  form.projectId = pid

  saving.value = true
  try {
    if (isEdit.value) {
      const id = props.issueId
      if (id == null) return
      const detail = await updateIssue(id, {
        projectId: pid,
        subject: form.subject,
        description: form.description || undefined,
        trackerId: Number(form.trackerId),
        statusId: form.statusId != null ? Number(form.statusId) : undefined,
        priorityId: Number(form.priorityId),
        assignedToId: form.assignedToId > 0 ? form.assignedToId : 0,
        categoryId: form.categoryId > 0 ? form.categoryId : 0,
        parentId: form.parentId > 0 ? form.parentId : 0,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
        estimatedHours: form.estimatedHours != null ? Number(form.estimatedHours) : undefined,
        doneRatio: form.doneRatio != null ? Number(form.doneRatio) : undefined,
        isPrivate: Boolean(form.isPrivate),
      })
      ElMessage.success('问题已更新')
      emit('success', detail)
      visible.value = false
      return
    }

    await createIssue({
      projectId: form.projectId,
      trackerId: Number(form.trackerId),
      subject: form.subject,
      description: form.description || undefined,
      priorityId: Number(form.priorityId),
      assignedToId: form.assignedToId > 0 ? form.assignedToId : undefined,
      categoryId: form.categoryId > 0 ? form.categoryId : undefined,
      parentId: form.parentId > 0 ? form.parentId : undefined,
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
      estimatedHours: form.estimatedHours != null ? Number(form.estimatedHours) : undefined,
      doneRatio: form.doneRatio != null ? Number(form.doneRatio) : undefined,
      isPrivate: Boolean(form.isPrivate),
    })
    ElMessage.success('问题创建成功')
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, isEdit.value ? '更新问题失败' : '创建问题失败'))
  } finally {
    saving.value = false
  }
}

watch(
  () => form.projectId,
  (pid, prev) => {
    const n = Number(pid)
    if (!n || n < 1) return
    if (Number(prev) === n) return
    void loadProjectScopedOptions(n)
    if (isEdit.value || Number(prev) > 0) {
      form.categoryId = 0
      form.parentId = 0
    }
  },
)

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
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑问题' : '新建问题'"
    width="760px"
    destroy-on-close
    class="issue-form-dialog"
  >
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="110px">
      <el-form-item v-if="showProjectPick" label="项目" prop="projectId">
        <el-select
          v-model="form.projectId"
          style="width: 100%"
          filterable
          :loading="projectsLoading"
          placeholder="请选择项目"
        >
          <el-option v-for="p in projectOptions" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="跟踪器" prop="trackerId">
        <el-select
          v-model="form.trackerId"
          style="width: 100%"
          filterable
          :loading="trackersLoading"
          :disabled="effectiveProjectId == null"
          placeholder="请选择跟踪器"
        >
          <el-option v-for="t in trackerOptions" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="isEdit" label="状态" prop="statusId">
        <el-select
          v-model="form.statusId"
          style="width: 100%"
          filterable
          :loading="statusesLoading"
          placeholder="请选择状态"
        >
          <el-option v-for="s in statuses" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="标题" prop="subject">
        <el-input v-model="form.subject" maxlength="255" show-word-limit placeholder="请输入问题标题" />
      </el-form-item>

      <el-form-item label="描述">
        <div class="issue-form-dialog__desc">
          <el-tabs v-model="descTab" class="issue-form-dialog__desc-tabs">
            <el-tab-pane label="编辑" name="edit">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="8"
                placeholder="支持 Markdown（标题、列表、代码块、链接等）"
              />
            </el-tab-pane>
            <el-tab-pane label="预览" name="preview">
              <div v-if="descriptionHtml" class="jr-markdown-body issue-form-dialog__preview" v-html="descriptionHtml" />
              <p v-else class="issue-form-dialog__preview-empty">暂无内容</p>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-form-item>

      <el-form-item label="优先级" prop="priorityId">
        <el-select
          v-model="form.priorityId"
          style="width: 100%"
          filterable
          :loading="prioritiesLoading"
          placeholder="请选择优先级"
        >
          <el-option v-for="p in priorities" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="指派给">
        <el-select
          v-model="form.assignedToId"
          style="width: 100%"
          filterable
          :loading="membersLoading"
          :disabled="effectiveProjectId == null"
          placeholder="未分配"
        >
          <el-option :value="0" label="未分配" />
          <el-option
            v-for="m in members"
            :key="m.userId"
            :label="memberDisplayName(m)"
            :value="m.userId"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="类别">
        <el-select
          v-model="form.categoryId"
          style="width: 100%"
          filterable
          :loading="categoriesLoading"
          :disabled="effectiveProjectId == null"
          placeholder="无类别"
        >
          <el-option :value="0" label="无类别" />
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="父任务">
        <el-select
          v-model="form.parentId"
          style="width: 100%"
          filterable
          remote
          reserve-keyword
          :remote-method="searchParentIssues"
          :loading="parentSearchLoading"
          :disabled="effectiveProjectId == null"
          placeholder="搜索同项目问题（#编号 或标题）"
        >
          <el-option :value="0" label="无父任务" />
          <el-option
            v-for="item in parentOptions"
            :key="item.id"
            :label="parentOptionLabel(item)"
            :value="item.id"
          />
        </el-select>
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
      <el-button type="primary" :loading="saving" @click="submit">{{ isEdit ? '保存' : '创建' }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.issue-form-dialog__desc {
  width: 100%;
}

.issue-form-dialog__desc-tabs :deep(.el-tabs__header) {
  margin-bottom: 8px;
}

.issue-form-dialog__preview {
  min-height: 120px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.issue-form-dialog__preview-empty {
  margin: 0;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 6px;
}
</style>
