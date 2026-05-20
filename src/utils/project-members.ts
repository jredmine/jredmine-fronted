import type { ProjectMember } from '@/types/project'
import type { RoleListItem } from '@/types/rbac'

export interface ProjectMemberRoleGroup {
  roleId: number | null
  roleName: string
  members: ProjectMember[]
}

export function memberDisplayName(m: ProjectMember): string {
  const name = [m.firstname, m.lastname].filter(Boolean).join(' ').trim()
  return name || m.login || '—'
}

/** 可参与项目成员展示的角色（排除 Non member、Anonymous 等内置角色） */
export function filterProjectDisplayRoles(roles: RoleListItem[]): RoleListItem[] {
  return roles
    .filter((r) => (r.builtin ?? 0) === 0)
    .sort((a, b) => {
      const pos = (a.position ?? 0) - (b.position ?? 0)
      if (pos !== 0) return pos
      return a.id - b.id
    })
}

function buildRoleOrderIndex(roles: RoleListItem[]): {
  byId: Map<number, number>
  byName: Map<string, number>
} {
  const catalog = filterProjectDisplayRoles(roles)
  const byId = new Map<number, number>()
  const byName = new Map<string, number>()
  catalog.forEach((r, index) => {
    byId.set(r.id, index)
    byName.set(r.name, index)
  })
  return { byId, byName }
}

function sortRoleGroups(
  groups: ProjectMemberRoleGroup[],
  order: { byId: Map<number, number>; byName: Map<string, number> },
): ProjectMemberRoleGroup[] {
  return [...groups].sort((a, b) => {
    const aIndex =
      (a.roleId != null ? order.byId.get(a.roleId) : undefined) ??
      order.byName.get(a.roleName) ??
      Number.MAX_SAFE_INTEGER
    const bIndex =
      (b.roleId != null ? order.byId.get(b.roleId) : undefined) ??
      order.byName.get(b.roleName) ??
      Number.MAX_SAFE_INTEGER
    if (aIndex !== bIndex) return aIndex - bIndex
    return a.roleName.localeCompare(b.roleName, 'zh-CN')
  })
}

/** 将成员列表按角色分组；排序依据 roles 表的 position */
export function groupMembersByRole(
  members: ProjectMember[],
  roleCatalog: RoleListItem[],
): {
  roleGroups: ProjectMemberRoleGroup[]
  unassigned: ProjectMember[]
} {
  const roleMap = new Map<string, { roleId: number | null; members: Map<number, ProjectMember> }>()
  const unassigned = new Map<number, ProjectMember>()

  for (const member of members) {
    const roles = member.roles?.filter((r) => r.roleName) ?? []
    if (roles.length === 0) {
      unassigned.set(member.userId, member)
      continue
    }
    for (const role of roles) {
      const roleName = role.roleName
      if (!roleMap.has(roleName)) {
        roleMap.set(roleName, { roleId: role.roleId ?? null, members: new Map() })
      }
      roleMap.get(roleName)!.members.set(member.userId, member)
    }
  }

  const order = buildRoleOrderIndex(roleCatalog)
  const roleGroups = sortRoleGroups(
    [...roleMap.entries()].map(([roleName, { roleId, members: memberMap }]) => ({
      roleId,
      roleName,
      members: [...memberMap.values()].sort((a, b) =>
        memberDisplayName(a).localeCompare(memberDisplayName(b), 'zh-CN'),
      ),
    })),
    order,
  )

  const unassignedList = [...unassigned.values()].sort((a, b) =>
    memberDisplayName(a).localeCompare(memberDisplayName(b), 'zh-CN'),
  )

  return { roleGroups, unassigned: unassignedList }
}
