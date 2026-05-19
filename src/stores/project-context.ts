import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { ProjectDetail } from '@/types/project'

/** 当前浏览的项目上下文（用于面包屑、顶栏等） */
export const useProjectContextStore = defineStore('projectContext', () => {
  const currentProject = ref<ProjectDetail | null>(null)
  /** Wiki 页面增删改后递增，供 Wiki 页等刷新列表 */
  const wikiPagesVersion = ref(0)

  function setProject(project: ProjectDetail | null) {
    currentProject.value = project
  }

  function clear() {
    currentProject.value = null
    wikiPagesVersion.value = 0
  }

  function notifyWikiPagesChanged() {
    wikiPagesVersion.value += 1
  }

  return { currentProject, setProject, clear, wikiPagesVersion, notifyWikiPagesChanged }
})
