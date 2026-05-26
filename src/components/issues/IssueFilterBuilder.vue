<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'

import { fetchIssuePriorities } from '@/services/issues'
import { fetchProjectMembers } from '@/services/projects'
import { fetchTrackerList } from '@/services/trackers'
import { fetchIssueStatusList } from '@/services/workflows'
import { memberDisplayName } from '@/utils/project-members'
import { parseBackendErrorMessage } from '@/utils/http-error'
import {
  ISSUE_FILTER_DEFINITIONS,
  createFilterRow,
  type IssueFilterKey,
} from '@/utils/issue-filters'
import type {
  AssigneeFilterOption,
  IssueFilterRow,
  IssuePriorityItem,
  StatusFilterValue,
} from '@/types/issue-filter'
import type { IssueStatusItem } from '@/types/workflow'
import type { ProjectMember } from '@/types/project'
import type { TrackerListItem } from '@/types/tracker'

const props = defineProps<{
  modelValue: IssueFilterRow[]
  projectId: number | null
  projectTrackerIds?: number[] | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', rows: IssueFilterRow[]): void
  (e: 'apply'): void
  (e: 'clear'): void
}>()

const optionsLoading = ref(false)
const addFilterKey = ref<IssueFilterKey | ''>('')
const allStatuses = ref<IssueStatusItem[]>([])
const allTrackers = ref<TrackerListItem[]>([])
const allPriorities = ref<IssuePriorityItem[]>([])
const projectMembers = ref<ProjectMember[]>([])

const rows = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const usedKeys = computed(() => new Set(rows.value.map((r) => r.key)))

const addableFilters = computed(() =>
  ISSUE_FILTER_DEFINITIONS.filter((d) => !usedKeys.value.has(d.key)),
)

const trackerOptions = computed(() => {
  const ids = props.projectTrackerIds
  if (props.projectId != null && ids && ids.length > 0) {
    const allowed = new Set(ids)
    return allTrackers.value.filter((t) => allowed.has(t.id))
  }
  return allTrackers.value
})

const assigneeOptions = computed((): AssigneeFilterOption[] => {
  const base: AssigneeFilterOption[] = [
    { value: 'me', label: '<< 我 >>' },
    { value: 'unassigned', label: '未分配' },
  ]
  if (props.projectId != null) {
    const memberOpts = projectMembers.value.map((m) => ({
      value: m.userId as number,
      label: memberDisplayName(m),
    }))
    return [...base, ...memberOpts]
  }
  return base
})

function labelForKey(key: IssueFilterKey) {
  return ISSUE_FILTER_DEFINITIONS.find((d) => d.key === key)?.label ?? key
}

function updateRow(id: string, patch: Partial<IssueFilterRow>) {
  rows.value = rows.value.map((r) => (r.id === id ? { ...r, ...patch } : r))
}

function removeRow(id: string) {
  rows.value = rows.value.filter((r) => r.id !== id)
}

function onAddFilter(key: IssueFilterKey | '') {
  if (!key || usedKeys.value.has(key)) {
    addFilterKey.value = ''
    return
  }
  rows.value = [...rows.value, createFilterRow(key)]
  addFilterKey.value = ''
}

function onRowEnabledChange(id: string, enabled: boolean) {
  updateRow(id, { enabled })
}

function onStatusChange(id: string, value: StatusFilterValue) {
  updateRow(id, { value })
}

function onTrackerChange(id: string, value: number | undefined) {
  updateRow(id, { value: value ?? '' })
}

function onPriorityChange(id: string, value: number | undefined) {
  updateRow(id, { value: value ?? '' })
}

function onAssignedToChange(id: string, value: IssueFilterRow['value'] | undefined) {
  updateRow(id, { value: value ?? '' })
}

function trackerModelValue(row: IssueFilterRow) {
  return row.value === '' ? undefined : (row.value as number)
}

function priorityModelValue(row: IssueFilterRow) {
  return row.value === '' ? undefined : (row.value as number)
}

function assignedToModelValue(row: IssueFilterRow) {
  return row.value === '' ? undefined : row.value
}

function statusModelValue(row: IssueFilterRow) {
  return row.value as StatusFilterValue
}

async function loadOptions() {
  optionsLoading.value = true
  try {
    const tasks: Promise<unknown>[] = [
      fetchIssueStatusList().then((s) => {
        allStatuses.value = s
      }),
      fetchTrackerList({ current: 1, size: 200 }).then((p) => {
        allTrackers.value = p.records ?? []
      }),
      fetchIssuePriorities().then((p) => {
        allPriorities.value = p
      }),
    ]
    if (props.projectId != null) {
      tasks.push(
        fetchProjectMembers(props.projectId, { current: 1, size: 500 }).then((p) => {
          projectMembers.value = p.records ?? []
        }),
      )
    } else {
      projectMembers.value = []
    }
    await Promise.all(tasks)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载筛选选项失败'))
  } finally {
    optionsLoading.value = false
  }
}

watch(
  () => props.projectId,
  () => {
    void loadOptions()
  },
  { immediate: true },
)

watch(trackerOptions, () => {
  for (const row of rows.value) {
    if (row.key !== 'tracker' || typeof row.value !== 'number') continue
    if (!trackerOptions.value.some((t) => t.id === row.value)) {
      updateRow(row.id, { value: '' })
    }
  }
})
</script>

<template>
  <section class="issue-filter-builder" aria-label="过滤器">
    <div v-loading="optionsLoading" class="issue-filter-builder__body">
      <div v-for="row in rows" :key="row.id" class="issue-filter-builder__row">
        <el-checkbox
          :model-value="row.enabled"
          @update:model-value="onRowEnabledChange(row.id, $event)"
        />
        <span class="issue-filter-builder__label">{{ labelForKey(row.key) }}</span>
        <span class="issue-filter-builder__op">等于</span>

        <el-select
          v-if="row.key === 'status'"
          :model-value="statusModelValue(row)"
          class="issue-filter-builder__value"
          placeholder="选择状态"
          @update:model-value="onStatusChange(row.id, $event)"
        >
          <el-option label="打开" value="open" />
          <el-option label="已关闭" value="closed" />
          <el-option-group v-if="allStatuses.some((s) => !s.isClosed)" label="具体状态">
            <el-option
              v-for="s in allStatuses.filter((x) => !x.isClosed)"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-option-group>
          <el-option-group v-if="allStatuses.some((s) => s.isClosed)" label="已关闭状态">
            <el-option
              v-for="s in allStatuses.filter((x) => x.isClosed)"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-option-group>
        </el-select>

        <el-select
          v-else-if="row.key === 'tracker'"
          :model-value="trackerModelValue(row)"
          clearable
          class="issue-filter-builder__value"
          placeholder="选择跟踪器"
          @update:model-value="onTrackerChange(row.id, $event)"
        >
          <el-option v-for="t in trackerOptions" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>

        <el-select
          v-else-if="row.key === 'priority'"
          :model-value="priorityModelValue(row)"
          clearable
          class="issue-filter-builder__value"
          placeholder="选择优先级"
          @update:model-value="onPriorityChange(row.id, $event)"
        >
          <el-option v-for="p in allPriorities" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>

        <el-select
          v-else-if="row.key === 'assignedTo'"
          :model-value="assignedToModelValue(row)"
          clearable
          class="issue-filter-builder__value"
          placeholder="选择指派给"
          @update:model-value="onAssignedToChange(row.id, $event)"
        >
          <el-option
            v-for="opt in assigneeOptions"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>

        <el-button link type="danger" class="issue-filter-builder__remove" @click="removeRow(row.id)">
          删除
        </el-button>
      </div>

      <div class="issue-filter-builder__footer">
        <el-select
          v-model="addFilterKey"
          placeholder="增加过滤器"
          class="issue-filter-builder__add"
          :disabled="addableFilters.length === 0"
          @change="onAddFilter"
        >
          <el-option
            v-for="f in addableFilters"
            :key="f.key"
            :label="f.label"
            :value="f.key"
          />
        </el-select>

        <div class="issue-filter-builder__actions">
          <el-button type="primary" :icon="Check" @click="emit('apply')">应用</el-button>
          <el-button :icon="Refresh" @click="emit('clear')">清除</el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.issue-filter-builder {
  margin-bottom: 16px;
  padding: 12px 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--jr-radius-lg, 8px);
}

.issue-filter-builder__body {
  min-height: 40px;
}

.issue-filter-builder__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin-bottom: 10px;
}

.issue-filter-builder__label {
  min-width: 48px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.issue-filter-builder__op {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.issue-filter-builder__value {
  width: 200px;
}

.issue-filter-builder__remove {
  margin-left: 4px;
}

.issue-filter-builder__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.issue-filter-builder__add {
  width: 160px;
}

.issue-filter-builder__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
</style>
