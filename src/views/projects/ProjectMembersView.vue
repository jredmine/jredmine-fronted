<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

import { fetchProjectMembers } from '@/services/projects'
import { fetchRoleList } from '@/services/roles'
import { parseBackendErrorMessage } from '@/utils/http-error'
import { groupMembersByRole, memberDisplayName } from '@/utils/project-members'
import type { ProjectMember } from '@/types/project'
import type { RoleListItem } from '@/types/rbac'

const route = useRoute()

const loading = ref(false)
const members = ref<ProjectMember[]>([])
const roleCatalog = ref<RoleListItem[]>([])

const projectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

const memberGroups = computed(() => groupMembersByRole(members.value, roleCatalog.value))

async function loadMembers() {
  const id = projectId.value
  if (id == null) return
  loading.value = true
  try {
    const [memberPage, rolePage] = await Promise.all([
      fetchProjectMembers(id, { current: 1, size: 500 }),
      fetchRoleList({ current: 1, size: 500 }),
    ])
    members.value = memberPage.records ?? []
    roleCatalog.value = rolePage.records ?? []
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载成员失败'))
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.projectId,
  () => {
    void loadMembers()
  },
  { immediate: true },
)
</script>

<template>
  <el-card class="jr-panel" shadow="never">
    <template #header>
      <div class="list-header">
        <span>成员</span>
      </div>
    </template>

    <div v-loading="loading" class="members-panel">
      <template v-if="memberGroups.roleGroups.length > 0">
        <div v-for="group in memberGroups.roleGroups" :key="group.roleName" class="members-role-row">
          <span class="members-role-row__label">{{ group.roleName }}:</span>
          <span class="members-role-row__names">
            <template v-for="(m, index) in group.members" :key="`${group.roleName}-${m.userId}`">
              <span v-if="index > 0" class="members-role-row__sep">, </span>
              <span class="members-role-row__name">{{ memberDisplayName(m) }}</span>
            </template>
          </span>
        </div>
      </template>

      <div v-if="memberGroups.unassigned.length > 0" class="members-role-row">
        <span class="members-role-row__label">未分配角色:</span>
        <span class="members-role-row__names">
          <template v-for="(m, index) in memberGroups.unassigned" :key="m.userId">
            <span v-if="index > 0" class="members-role-row__sep">, </span>
            <span class="members-role-row__name members-role-row__name--muted">{{ memberDisplayName(m) }}</span>
          </template>
        </span>
      </div>

      <el-empty
        v-if="!loading && memberGroups.roleGroups.length === 0 && memberGroups.unassigned.length === 0"
        description="暂无项目成员"
      />
    </div>
  </el-card>
</template>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.members-panel {
  min-height: 80px;
  font-size: 14px;
  line-height: 1.8;
}

.members-role-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  margin-bottom: 10px;
}

.members-role-row:last-child {
  margin-bottom: 0;
}

.members-role-row__label {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.members-role-row__names {
  flex: 1;
  min-width: 0;
}

.members-role-row__name {
  color: var(--el-color-primary);
  cursor: default;
}

.members-role-row__name--muted {
  color: var(--el-text-color-regular);
}

.members-role-row__sep {
  color: var(--el-text-color-regular);
}
</style>
