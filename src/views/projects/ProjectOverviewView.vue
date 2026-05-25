<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

import ProjectFormDialog from '@/views/projects/ProjectFormDialog.vue'
import { deleteProject, fetchProjectDetail, fetchProjectStatistics } from '@/services/projects'
import { useProjectContextStore } from '@/stores/project-context'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { ProjectStatistics, ProjectTrackerCountItem } from '@/types/project'

const route = useRoute()
const router = useRouter()
const ctx = useProjectContextStore()
const { currentProject } = storeToRefs(ctx)

const dialogVisible = ref(false)
const refreshLoading = ref(false)
const statsLoading = ref(false)
const statistics = ref<ProjectStatistics | null>(null)

const projectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

const issuesModuleEnabled = computed(() => {
  const modules = currentProject.value?.enabledModules
  if (!modules || modules.length === 0) return true
  return modules.includes('issues')
})

const trackerRows = computed(() => statistics.value?.issueStatistics?.byTracker ?? [])

function trackerOpenCount(row: ProjectTrackerCountItem) {
  if (row.openCount != null) return row.openCount
  return row.count
}

function trackerClosedCount(row: ProjectTrackerCountItem) {
  if (row.closedCount != null) return row.closedCount
  return 0
}

function statusLabel(status: number | null | undefined) {
  if (status === 1) return '活跃'
  if (status === 5) return '关闭'
  if (status === 9) return '归档'
  return status != null ? String(status) : '—'
}

async function loadStatistics() {
  const id = projectId.value
  if (id == null || !issuesModuleEnabled.value) {
    statistics.value = null
    return
  }
  statsLoading.value = true
  try {
    statistics.value = await fetchProjectStatistics(id)
  } catch (e) {
    statistics.value = null
    ElMessage.error(parseBackendErrorMessage(e, '加载问题统计失败'))
  } finally {
    statsLoading.value = false
  }
}

async function refreshDetail() {
  const id = projectId.value
  if (id == null) return
  refreshLoading.value = true
  try {
    const d = await fetchProjectDetail(id)
    ctx.setProject(d)
    await loadStatistics()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '刷新项目失败'))
  } finally {
    refreshLoading.value = false
  }
}

function openEdit() {
  dialogVisible.value = true
}

function onFormSuccess() {
  void refreshDetail()
}

function goIssueList() {
  const id = projectId.value
  if (id == null) return
  void router.push({ name: 'IssueList', params: { projectId: String(id) } })
}

async function onDelete() {
  const project = currentProject.value
  const id = projectId.value
  if (!project || id == null) return

  try {
    await ElMessageBox.confirm(
      `确认删除项目「${project.name}」？删除后将归档该项目；若存在未归档的子项目则无法删除。`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  try {
    await deleteProject(id)
    ElMessage.success('项目已删除')
    ctx.clear()
    void router.push({ name: 'ProjectList' })
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '删除项目失败'))
  }
}

watch(
  () => [projectId.value, issuesModuleEnabled.value] as const,
  () => {
    void loadStatistics()
  },
  { immediate: true },
)
</script>

<template>
  <el-card v-loading="refreshLoading" class="jr-panel" shadow="never">
    <template #header>
      <div class="overview-header">
        <span>概览</span>
        <div class="overview-header__actions">
          <el-button type="primary" :disabled="projectId == null" @click="openEdit">编辑项目</el-button>
          <el-button
            v-if="currentProject && currentProject.status !== 9"
            type="danger"
            plain
            :disabled="projectId == null"
            @click="onDelete"
          >
            删除项目
          </el-button>
        </div>
      </div>
    </template>

    <template v-if="currentProject">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标识符">{{ currentProject.identifier || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(currentProject.status) }}</el-descriptions-item>
        <el-descriptions-item label="公开">{{ currentProject.isPublic ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="父项目 ID">{{ currentProject.parentId ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="主页" :span="2">{{ currentProject.homepage || '—' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentProject.description || '—' }}</el-descriptions-item>
      </el-descriptions>

      <section v-if="issuesModuleEnabled" class="issue-tracking">
        <h3 class="issue-tracking__title">
          <el-icon class="issue-tracking__icon"><Search /></el-icon>
          问题跟踪
        </h3>
        <div v-loading="statsLoading" class="issue-tracking__body">
          <el-table
            v-if="trackerRows.length > 0"
            :data="trackerRows"
            border
            size="small"
            class="issue-tracking__table"
            :show-header="true"
          >
            <el-table-column prop="trackerName" label="" min-width="100">
              <template #default="{ row }">
                <span class="issue-tracking__tracker">{{ row.trackerName || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="打开" width="88" align="right">
              <template #default="{ row }">
                {{ trackerOpenCount(row) }}
              </template>
            </el-table-column>
            <el-table-column label="已关闭" width="88" align="right">
              <template #default="{ row }">
                {{ trackerClosedCount(row) }}
              </template>
            </el-table-column>
            <el-table-column label="合计" width="88" align="right">
              <template #default="{ row }">
                {{ row.count }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else-if="!statsLoading" description="暂无问题统计" :image-size="64" />

          <div v-if="trackerRows.length > 0" class="issue-tracking__footer">
            <el-link type="primary" :underline="false" @click="goIssueList">查看所有问题</el-link>
          </div>
        </div>
      </section>
      <p v-else class="hint">当前项目未启用「问题」模块，不显示问题跟踪统计。</p>
    </template>
    <el-empty v-else description="正在加载项目信息…" />

    <ProjectFormDialog
      v-model="dialogVisible"
      mode="edit"
      :project-id="projectId"
      @success="onFormSuccess"
    />
  </el-card>
</template>

<style scoped>
.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.overview-header__actions {
  display: flex;
  gap: 8px;
}

.hint {
  margin-top: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.issue-tracking {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.issue-tracking__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.issue-tracking__icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.issue-tracking__body {
  min-height: 48px;
}

.issue-tracking__table {
  max-width: 420px;
}

.issue-tracking__table :deep(.el-table__header th) {
  font-weight: 600;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.issue-tracking__tracker {
  font-weight: 500;
}

.issue-tracking__footer {
  margin-top: 10px;
  font-size: 13px;
}
</style>
