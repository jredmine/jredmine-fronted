<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import IssueFilterBuilder from '@/components/issues/IssueFilterBuilder.vue'
import IssueFormDialog from '@/views/issues/IssueFormDialog.vue'
import { fetchIssueList } from '@/services/issues'
import { fetchProjectDetail } from '@/services/projects'
import { useAuthStore } from '@/stores/auth'
import { useProjectContextStore } from '@/stores/project-context'
import { parseBackendErrorMessage } from '@/utils/http-error'
import {
  defaultFilterRows,
  filtersToListQuery,
  parseFiltersFromQuery,
  serializeFiltersToQuery,
} from '@/utils/issue-filters'
import type { IssueFilterRow } from '@/types/issue-filter'
import type { IssueListItem, IssueListQuery } from '@/types/issue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ctx = useProjectContextStore()
const { currentProject } = storeToRefs(ctx)

const loading = ref(false)
const records = ref<IssueListItem[]>([])
const total = ref(0)
const filterRows = ref<IssueFilterRow[]>([])

const query = ref({
  current: 1,
  size: 10,
  keyword: '',
  sortBy: 'updated_on',
  sortOrder: 'desc' as 'asc' | 'desc',
})

const routeProjectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

const isGlobalList = computed(() => route.name === 'IssueGlobalList')

const projectTrackerIds = computed(() => currentProject.value?.trackerIds ?? null)

const createVisible = ref(false)

function openCreate() {
  createVisible.value = true
}

function goDetail(row: IssueListItem) {
  const pid = routeProjectId.value ?? row.projectId
  if (pid == null) {
    ElMessage.warning('无法解析问题所属项目')
    return
  }
  void router.push({ name: 'IssueDetail', params: { projectId: String(pid), issueId: String(row.id) } })
}

function buildListParams(): IssueListQuery {
  const scopedPid = routeProjectId.value
  return {
    ...(scopedPid != null ? { projectId: scopedPid } : {}),
    current: query.value.current,
    size: query.value.size,
    keyword: query.value.keyword || undefined,
    sortBy: query.value.sortBy || undefined,
    sortOrder: query.value.sortOrder || undefined,
    ...filtersToListQuery(filterRows.value, auth.user?.id),
  }
}

function syncFiltersToRoute() {
  const filters = serializeFiltersToQuery(filterRows.value)
  const nextQuery = { ...route.query } as Record<string, string | string[]>
  if (filters) nextQuery.filters = filters
  else delete nextQuery.filters
  void router.replace({ query: nextQuery })
}

function initFiltersFromRoute() {
  const parsed = parseFiltersFromQuery(route.query.filters)
  filterRows.value = parsed.length > 0 ? parsed : defaultFilterRows()
}

async function loadProjectContext() {
  const pid = routeProjectId.value
  if (pid == null) return
  try {
    const d = await fetchProjectDetail(pid)
    ctx.setProject(d)
  } catch {
    // 项目上下文失败不阻塞列表
  }
}

async function loadList() {
  const scopedPid = routeProjectId.value
  if (!isGlobalList.value && scopedPid == null) return

  loading.value = true
  try {
    const page = await fetchIssueList(buildListParams())
    records.value = page.records ?? []
    total.value = page.total ?? 0
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载问题列表失败'))
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  query.value.current = 1
  syncFiltersToRoute()
  void loadList()
}

function clearFilters() {
  filterRows.value = defaultFilterRows()
  query.value.keyword = ''
  applyFilters()
}

function onCreateSuccess() {
  query.value.current = 1
  void loadList()
}

watch(
  () => [route.name, route.params.projectId] as const,
  () => {
    query.value.current = 1
    initFiltersFromRoute()
    void loadProjectContext()
    void loadList()
  },
  { immediate: true },
)

watch(
  () => route.query.filters,
  () => {
    const parsed = parseFiltersFromQuery(route.query.filters)
    if (parsed.length > 0) {
      filterRows.value = parsed
    }
  },
)
</script>

<template>
  <el-card class="jr-panel" shadow="never">
    <template #header>
      <div class="list-header">
        <span>问题</span>
        <div class="list-header__actions">
          <el-button type="primary" @click="openCreate">新建问题</el-button>
        </div>
      </div>
    </template>

    <p v-if="isGlobalList" class="list-scope-hint">
      列出您在相关项目中可见的全部问题（后端按权限过滤）；新建时可自由选择目标项目。
    </p>

    <IssueFilterBuilder
      v-model="filterRows"
      :project-id="routeProjectId"
      :project-tracker-ids="projectTrackerIds"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <div class="list-toolbar">
      <el-input
        v-model="query.keyword"
        clearable
        placeholder="关键词（标题/描述）"
        style="max-width: 280px"
        @keyup.enter="applyFilters"
      />
      <el-select v-model="query.sortBy" style="width: 160px">
        <el-option label="按创建时间" value="created_on" />
        <el-option label="按更新时间" value="updated_on" />
        <el-option label="按优先级" value="priority" />
        <el-option label="按截止日期" value="due_date" />
      </el-select>
      <el-select v-model="query.sortOrder" style="width: 120px">
        <el-option label="倒序" value="desc" />
        <el-option label="正序" value="asc" />
      </el-select>
      <el-button type="primary" @click="applyFilters">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="records" stripe style="width: 100%">
      <el-table-column prop="id" label="#" width="90" />
      <el-table-column v-if="isGlobalList" prop="projectName" label="项目" min-width="140" show-overflow-tooltip />
      <el-table-column prop="trackerName" label="跟踪器" width="120" show-overflow-tooltip />
      <el-table-column prop="subject" label="标题" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">
          <el-button link type="primary" @click="goDetail(row)">{{ row.subject }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="statusName" label="状态" width="120" show-overflow-tooltip />
      <el-table-column prop="priorityName" label="优先级" width="120" show-overflow-tooltip />
      <el-table-column prop="assignedToName" label="指派给" width="140" show-overflow-tooltip />
      <el-table-column prop="doneRatio" label="完成度" width="100">
        <template #default="{ row }">
          {{ row.doneRatio != null ? `${row.doneRatio}%` : '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="dueDate" label="截止" width="120" />
      <el-table-column prop="updatedOn" label="更新" width="170" />
    </el-table>

    <div class="list-pagination">
      <el-pagination
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadList"
        @size-change="() => { query.current = 1; loadList() }"
      />
    </div>

    <IssueFormDialog v-model="createVisible" :project-id="routeProjectId" @success="onCreateSuccess" />
  </el-card>
</template>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.list-header__actions {
  display: flex;
  gap: 8px;
}

.list-scope-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.list-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
