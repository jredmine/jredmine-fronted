<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import type { PageResponse } from '@/types/api-response'
import type { Permission, RoleDetail, RoleListItem } from '@/types/rbac'
import {
  addManagedRole,
  copyRole,
  createRole,
  deleteRole,
  fetchManagedRoles,
  fetchRoleDetail,
  fetchRoleList,
  removeManagedRole,
  updateManagedRoles,
  updateRole,
} from '@/services/roles'
import { fetchAllPermissions } from '@/services/permissions'
import { parseBackendErrorMessage } from '@/utils/http-error'

const loading = ref(false)
const queryName = ref('')
const page = ref<PageResponse<RoleListItem>>({
  records: [],
  total: 0,
  current: 1,
  size: 10,
  pages: 0,
})

const tableData = computed(() => page.value.records)

const permLoading = ref(false)
const allPerms = ref<Permission[]>([])
const permQuery = ref('')

const permGroups = computed(() => {
  const q = permQuery.value.trim().toLowerCase()
  const list = q
    ? allPerms.value.filter((p) => {
        return (
          p.key.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        )
      })
    : allPerms.value

  const map = new Map<string, Permission[]>()
  for (const p of list) {
    const k = p.category || '其他'
    const arr = map.get(k) || []
    arr.push(p)
    map.set(k, arr)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.key.localeCompare(b.key)),
    }))
})

async function loadPermissionsOnce() {
  if (allPerms.value.length > 0 || permLoading.value) return
  permLoading.value = true
  try {
    allPerms.value = await fetchAllPermissions()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载权限列表失败'))
  } finally {
    permLoading.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const data = await fetchRoleList({
      current: page.value.current,
      size: page.value.size,
      name: queryName.value || undefined,
    })
    page.value = data
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载角色列表失败'))
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value.current = 1
  void load()
}

function onSizeChange(size: number) {
  page.value.size = size
  page.value.current = 1
  void load()
}

function onCurrentChange(current: number) {
  page.value.current = current
  void load()
}

const roleDialogVisible = ref(false)
const roleDialogMode = ref<'create' | 'edit'>('create')
const roleFormRef = ref<FormInstance>()
const roleDialogLoading = ref(false)

const roleForm = reactive({
  id: 0,
  name: '',
  position: 0,
  assignable: true,
  permissions: [] as string[],
  issuesVisibility: 'default',
  usersVisibility: 'members_of_visible_projects',
  timeEntriesVisibility: 'all',
  allRolesManaged: true,
  settings: '',
})

const roleRules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  permissions: [{ type: 'array', required: true, message: '至少选择一个权限', trigger: 'change' }],
}

function openCreate() {
  roleDialogMode.value = 'create'
  roleForm.id = 0
  roleForm.name = ''
  roleForm.position = 0
  roleForm.assignable = true
  roleForm.permissions = []
  roleForm.issuesVisibility = 'default'
  roleForm.usersVisibility = 'members_of_visible_projects'
  roleForm.timeEntriesVisibility = 'all'
  roleForm.allRolesManaged = true
  roleForm.settings = ''
  permQuery.value = ''
  roleDialogVisible.value = true
  void loadPermissionsOnce()
}

async function openEdit(row: RoleListItem) {
  roleDialogMode.value = 'edit'
  roleDialogVisible.value = true
  roleDialogLoading.value = true
  permQuery.value = ''
  void loadPermissionsOnce()
  try {
    const detail: RoleDetail = await fetchRoleDetail(row.id)
    roleForm.id = detail.id
    roleForm.name = detail.name
    roleForm.position = detail.position ?? 0
    roleForm.assignable = Boolean(detail.assignable)
    roleForm.permissions = detail.permissions || []
    roleForm.issuesVisibility = detail.issuesVisibility ?? 'default'
    roleForm.usersVisibility = detail.usersVisibility ?? 'members_of_visible_projects'
    roleForm.timeEntriesVisibility = detail.timeEntriesVisibility ?? 'all'
    roleForm.allRolesManaged = Boolean(detail.allRolesManaged)
    roleForm.settings = detail.settings ?? ''
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载角色详情失败'))
  } finally {
    roleDialogLoading.value = false
  }
}

async function submitRole() {
  if (!roleFormRef.value) return
  const valid = await roleFormRef.value.validate().catch(() => false)
  if (!valid) return

  roleDialogLoading.value = true
  try {
    if (roleDialogMode.value === 'create') {
      await createRole({
        name: roleForm.name,
        position: roleForm.position,
        assignable: roleForm.assignable,
        permissions: roleForm.permissions,
        issuesVisibility: roleForm.issuesVisibility,
        usersVisibility: roleForm.usersVisibility,
        timeEntriesVisibility: roleForm.timeEntriesVisibility,
        allRolesManaged: roleForm.allRolesManaged,
        settings: roleForm.settings || undefined,
      })
      ElMessage.success('创建成功')
    } else {
      await updateRole(roleForm.id, {
        name: roleForm.name,
        position: roleForm.position,
        assignable: roleForm.assignable,
        permissions: roleForm.permissions,
        issuesVisibility: roleForm.issuesVisibility,
        usersVisibility: roleForm.usersVisibility,
        timeEntriesVisibility: roleForm.timeEntriesVisibility,
        allRolesManaged: roleForm.allRolesManaged,
        settings: roleForm.settings || undefined,
      })
      ElMessage.success('更新成功')
    }
    roleDialogVisible.value = false
    void load()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, roleDialogMode.value === 'create' ? '创建失败' : '更新失败'))
  } finally {
    roleDialogLoading.value = false
  }
}

const copyDialogVisible = ref(false)
const copyFormRef = ref<FormInstance>()
const copyLoading = ref(false)
const copySource = ref<RoleListItem | null>(null)
const copyForm = reactive({ name: '' })
const copyRules: FormRules = { name: [{ required: true, message: '请输入新角色名称', trigger: 'blur' }] }

function openCopy(row: RoleListItem) {
  copySource.value = row
  copyForm.name = `${row.name}-复制`
  copyDialogVisible.value = true
}

async function submitCopy() {
  if (!copyFormRef.value || !copySource.value) return
  const valid = await copyFormRef.value.validate().catch(() => false)
  if (!valid) return
  copyLoading.value = true
  try {
    await copyRole(copySource.value.id, { name: copyForm.name })
    ElMessage.success('复制成功')
    copyDialogVisible.value = false
    void load()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '复制失败'))
  } finally {
    copyLoading.value = false
  }
}

async function onDelete(row: RoleListItem) {
  try {
    await ElMessageBox.confirm(`确认删除角色「${row.name}」？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    void load()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '删除失败'))
  }
}

const managedDialogVisible = ref(false)
const managedLoading = ref(false)
const managedRole = ref<RoleListItem | null>(null)
const allRoles = ref<RoleListItem[]>([])
const managedList = ref<RoleListItem[]>([])
const managedPick = ref<number | null>(null)

const managedCandidates = computed(() => {
  const currentId = managedRole.value?.id
  const exist = new Set(managedList.value.map((r) => r.id))
  return allRoles.value.filter((r) => r.id !== currentId && !exist.has(r.id))
})

async function openManagedRoles(row: RoleListItem) {
  managedRole.value = row
  managedDialogVisible.value = true
  managedLoading.value = true
  managedPick.value = null
  try {
    const [managed, rolesPage] = await Promise.all([
      fetchManagedRoles(row.id),
      fetchRoleList({ current: 1, size: 1000 }),
    ])
    managedList.value = managed
    allRoles.value = rolesPage.records
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载可管理角色失败'))
  } finally {
    managedLoading.value = false
  }
}

async function onManagedAdd() {
  if (!managedRole.value || managedPick.value == null) return
  managedLoading.value = true
  try {
    await addManagedRole(managedRole.value.id, managedPick.value)
    ElMessage.success('已添加')
    managedList.value = await fetchManagedRoles(managedRole.value.id)
    managedPick.value = null
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '添加失败'))
  } finally {
    managedLoading.value = false
  }
}

async function onManagedRemove(id: number) {
  if (!managedRole.value) return
  managedLoading.value = true
  try {
    await removeManagedRole(managedRole.value.id, id)
    ElMessage.success('已移除')
    managedList.value = await fetchManagedRoles(managedRole.value.id)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '移除失败'))
  } finally {
    managedLoading.value = false
  }
}

async function onManagedSaveBatch() {
  if (!managedRole.value) return
  managedLoading.value = true
  try {
    await updateManagedRoles(
      managedRole.value.id,
      managedList.value.map((r) => r.id),
    )
    ElMessage.success('已保存')
    managedDialogVisible.value = false
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '保存失败'))
  } finally {
    managedLoading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="admin-toolbar">
        <span>角色管理</span>
        <div class="admin-toolbar__right">
          <el-input v-model="queryName" placeholder="按角色名搜索" clearable style="width: 240px" @keyup.enter="onSearch" />
          <el-button type="primary" :loading="loading" @click="onSearch">查询</el-button>
          <el-button type="success" @click="openCreate">新增角色</el-button>
        </div>
      </div>
    </template>

    <el-table :data="tableData" v-loading="loading" row-key="id">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="name" label="名称" min-width="200" />
      <el-table-column prop="position" label="排序" width="100" />
      <el-table-column prop="assignable" label="可分配" width="100">
        <template #default="{ row }">{{ row.assignable ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="builtin" label="内置" width="100">
        <template #default="{ row }">{{ row.builtin ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="openCopy(row)">复制</el-button>
          <el-button link type="primary" @click="openManagedRoles(row)">可管理角色</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="admin-pager">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :total="page.total"
        :current-page="page.current"
        :page-size="page.size"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>

    <el-dialog
      v-model="roleDialogVisible"
      :title="roleDialogMode === 'create' ? '新增角色' : '编辑角色'"
      width="780px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-position="top" v-loading="roleDialogLoading">
        <div class="role-grid">
          <el-form-item label="名称" prop="name">
            <el-input v-model="roleForm.name" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="roleForm.position" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="可分配">
            <el-switch v-model="roleForm.assignable" />
          </el-form-item>
          <el-form-item label="管理所有角色">
            <el-switch v-model="roleForm.allRolesManaged" />
          </el-form-item>
          <el-form-item label="任务可见性">
            <el-select v-model="roleForm.issuesVisibility" style="width: 100%">
              <el-option label="默认" value="default" />
              <el-option label="全部" value="all" />
              <el-option label="仅本人" value="own" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户可见性">
            <el-select v-model="roleForm.usersVisibility" style="width: 100%">
              <el-option label="可见项目成员" value="members_of_visible_projects" />
              <el-option label="全部" value="all" />
            </el-select>
          </el-form-item>
          <el-form-item label="工时可见性">
            <el-select v-model="roleForm.timeEntriesVisibility" style="width: 100%">
              <el-option label="全部" value="all" />
              <el-option label="仅本人" value="own" />
              <el-option label="不可见" value="none" />
            </el-select>
          </el-form-item>
          <el-form-item label="设置（JSON，可选）">
            <el-input v-model="roleForm.settings" placeholder="可选" />
          </el-form-item>
        </div>

        <el-form-item label="权限" prop="permissions">
          <div class="perm-panel">
            <div class="perm-panel__toolbar">
              <el-input v-model="permQuery" placeholder="搜索权限 key / 名称 / 分类" clearable />
            </div>
            <div class="perm-panel__body" v-loading="permLoading">
              <el-checkbox-group v-model="roleForm.permissions">
                <div v-for="g in permGroups" :key="g.category" class="perm-group">
                  <div class="perm-group__title">{{ g.category }}</div>
                  <div class="perm-group__items">
                    <el-checkbox
                      v-for="p in g.items"
                      :key="p.key"
                      :label="p.key"
                      :value="p.key"
                    >
                      {{ p.name }}（{{ p.key }}）
                    </el-checkbox>
                  </div>
                </div>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleDialogLoading" @click="submitRole">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="copyDialogVisible" title="复制角色" width="420px" append-to-body :close-on-click-modal="false">
      <el-form ref="copyFormRef" :model="copyForm" :rules="copyRules" label-position="top" v-loading="copyLoading">
        <el-form-item label="新角色名称" prop="name">
          <el-input v-model="copyForm.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="copyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="copyLoading" @click="submitCopy">确认复制</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="managedDialogVisible"
      title="可管理角色"
      width="680px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="managed-hint">
        当前角色：<b>{{ managedRole?.name }}</b>
      </div>
      <div class="managed-add" v-loading="managedLoading">
        <el-select v-model="managedPick" filterable clearable placeholder="选择要添加的角色" style="width: 360px">
          <el-option v-for="r in managedCandidates" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
        <el-button type="primary" :disabled="managedPick == null" @click="onManagedAdd">添加</el-button>
      </div>

      <el-table :data="managedList" row-key="id" height="320" v-loading="managedLoading">
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="name" label="名称" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="onManagedRemove(row.id)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="managedDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="managedLoading" @click="onManagedSaveBatch">保存（批量）</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.admin-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.perm-panel {
  width: 100%;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.perm-panel__toolbar {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-lighter);
}

.perm-panel__body {
  padding: 12px;
  max-height: 360px;
  overflow: auto;
}

.perm-group + .perm-group {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.perm-group__title {
  font-weight: 600;
  margin-bottom: 8px;
}

.perm-group__items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

.managed-hint {
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
}

.managed-add {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
</style>

