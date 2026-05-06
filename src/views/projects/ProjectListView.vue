<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import ProjectFormDialog from '@/views/projects/ProjectFormDialog.vue'
import { fetchProjectList, fetchProjectTree } from '@/services/projects'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { ProjectListItem, ProjectTreeNode } from '@/types/project'

const router = useRouter()

const loading = ref(false)
const records = ref<ProjectListItem[]>([])
const total = ref(0)
const query = ref({
  current: 1,
  size: 10,
  keyword: '',
})

const treeVisible = ref(false)
const treeLoading = ref(false)
const treeData = ref<ProjectTreeNode[]>([])

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)

function statusLabel(status: number | null | undefined) {
  if (status === 1) return '活跃'
  if (status === 5) return '关闭'
  if (status === 9) return '归档'
  return status != null ? String(status) : '—'
}

function statusTagType(status: number | null | undefined) {
  if (status === 1) return 'success'
  if (status === 5) return 'warning'
  if (status === 9) return 'info'
  return undefined
}

async function loadList() {
  loading.value = true
  try {
    const page = await fetchProjectList({
      current: query.value.current,
      size: query.value.size,
      keyword: query.value.keyword || undefined,
    })
    records.value = page.records ?? []
    total.value = page.total ?? 0
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载项目列表失败'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = 'create'
  editingId.value = null
  dialogVisible.value = true
}

function openEdit(row: ProjectListItem) {
  dialogMode.value = 'edit'
  editingId.value = row.id
  dialogVisible.value = true
}

function goProject(row: ProjectListItem) {
  void router.push({ name: 'ProjectOverview', params: { projectId: String(row.id) } })
}

async function openTree() {
  treeVisible.value = true
  treeLoading.value = true
  try {
    treeData.value = await fetchProjectTree()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载项目树失败'))
  } finally {
    treeLoading.value = false
  }
}

function onDialogSuccess() {
  void loadList()
}

onMounted(() => {
  void loadList()
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="list-header">
        <span>项目列表</span>
        <div class="list-header__actions">
          <el-button @click="openTree">项目树</el-button>
          <el-button type="primary" @click="openCreate">新建项目</el-button>
        </div>
      </div>
    </template>

    <div class="list-toolbar">
      <el-input
        v-model="query.keyword"
        clearable
        placeholder="关键词（名称/描述）"
        style="max-width: 280px"
        @keyup.enter="loadList"
      />
      <el-button type="primary" @click="() => { query.current = 1; loadList() }">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="records" stripe style="width: 100%">
      <el-table-column prop="name" label="名称" min-width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="goProject(row)">{{ row.name }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="identifier" label="标识符" width="140" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status != null" :type="statusTagType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="公开" width="80">
        <template #default="{ row }">
          {{ row.isPublic ? '是' : '否' }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="goProject(row)">进入</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
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

    <ProjectFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :project-id="editingId"
      @success="onDialogSuccess"
    />

    <el-dialog v-model="treeVisible" title="项目树" width="520px" destroy-on-close>
      <el-skeleton v-if="treeLoading" :rows="6" animated />
      <el-tree
        v-else
        :data="treeData"
        node-key="id"
        default-expand-all
        :props="{ label: 'name', children: 'children' }"
      />
    </el-dialog>
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
