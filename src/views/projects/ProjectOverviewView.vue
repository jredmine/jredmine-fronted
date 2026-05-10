<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import ProjectFormDialog from '@/views/projects/ProjectFormDialog.vue'
import { fetchProjectDetail, fetchProjectMembers } from '@/services/projects'
import { useProjectContextStore } from '@/stores/project-context'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { ProjectMember } from '@/types/project'

const route = useRoute()
const router = useRouter()
const ctx = useProjectContextStore()
const { currentProject } = storeToRefs(ctx)

const loading = ref(false)
const activeTab = ref('overview')

const dialogVisible = ref(false)

const membersLoading = ref(false)
const members = ref<ProjectMember[]>([])
const memberTotal = ref(0)
const memberQuery = ref({ current: 1, size: 10 })

const projectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

function statusLabel(status: number | null | undefined) {
  if (status === 1) return '活跃'
  if (status === 5) return '关闭'
  if (status === 9) return '归档'
  return status != null ? String(status) : '—'
}

function roleNames(row: ProjectMember) {
  return row.roles?.map((r) => r.roleName).filter(Boolean).join('、') || '—'
}

async function loadDetail() {
  const id = projectId.value
  if (id == null) return
  loading.value = true
  try {
    const d = await fetchProjectDetail(id)
    ctx.setProject(d)
    const appTitle = import.meta.env.VITE_APP_TITLE || 'JRedmine'
    document.title = `${d.name} - ${appTitle}`
  } catch (e) {
    ctx.clear()
    ElMessage.error(parseBackendErrorMessage(e, '加载项目失败'))
  } finally {
    loading.value = false
  }
}

async function loadMembers() {
  const id = projectId.value
  if (id == null) return
  membersLoading.value = true
  try {
    const page = await fetchProjectMembers(id, {
      current: memberQuery.value.current,
      size: memberQuery.value.size,
    })
    members.value = page.records ?? []
    memberTotal.value = page.total ?? 0
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载成员失败'))
  } finally {
    membersLoading.value = false
  }
}

watch(
  () => route.params.projectId,
  () => {
    void loadDetail()
    memberQuery.value.current = 1
    if (activeTab.value === 'members') void loadMembers()
  },
  { immediate: true },
)

watch(activeTab, (tab) => {
  if (tab === 'members') void loadMembers()
})

function onMemberPageChange() {
  void loadMembers()
}

function openEdit() {
  dialogVisible.value = true
}

function onFormSuccess() {
  void loadDetail()
  if (activeTab.value === 'members') void loadMembers()
}
</script>

<template>
  <el-card v-loading="loading" class="jr-panel" shadow="never">
    <template #header>
      <div class="overview-header">
        <span>{{ currentProject?.name ?? '项目' }}</span>
        <div class="overview-header__actions">
          <el-button @click="router.push({ name: 'ProjectList' })">返回列表</el-button>
          <el-button type="primary" :disabled="projectId == null" @click="openEdit">编辑项目</el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="概览" name="overview">
        <template v-if="currentProject">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="标识符">{{ currentProject.identifier || '—' }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ statusLabel(currentProject.status) }}</el-descriptions-item>
            <el-descriptions-item label="公开">{{ currentProject.isPublic ? '是' : '否' }}</el-descriptions-item>
            <el-descriptions-item label="父项目 ID">{{ currentProject.parentId ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="主页" :span="2">{{ currentProject.homepage || '—' }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ currentProject.description || '—' }}</el-descriptions-item>
          </el-descriptions>
          <p class="hint">模块与跟踪器等字段将在后续与后端详情 DTO 对齐后展示与编辑。</p>
        </template>
      </el-tab-pane>
      <el-tab-pane label="任务" name="issues">
        <el-empty description="进入任务列表以查看与创建任务">
          <el-button
            type="primary"
            :disabled="projectId == null"
            @click="router.push({ name: 'IssueList', params: { projectId: String(projectId) } })"
          >
            打开任务列表
          </el-button>
        </el-empty>
      </el-tab-pane>
      <el-tab-pane label="成员" name="members">
        <el-table v-loading="membersLoading" :data="members" stripe style="width: 100%">
          <el-table-column prop="login" label="登录名" width="140" />
          <el-table-column label="姓名" min-width="120">
            <template #default="{ row }">
              {{ [row.firstname, row.lastname].filter(Boolean).join(' ') || '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column label="角色" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ roleNames(row) }}</template>
          </el-table-column>
        </el-table>
        <div class="member-pagination">
          <el-pagination
            v-model:current-page="memberQuery.current"
            v-model:page-size="memberQuery.size"
            :total="memberTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="onMemberPageChange"
            @size-change="() => { memberQuery.current = 1; onMemberPageChange() }"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

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

.member-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
