import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { ProjectDetail } from '@/types/project'

/** 当前浏览的项目上下文（用于面包屑、顶栏等） */
export const useProjectContextStore = defineStore('projectContext', () => {
  const currentProject = ref<ProjectDetail | null>(null)

  function setProject(project: ProjectDetail | null) {
    currentProject.value = project
  }

  function clear() {
    currentProject.value = null
  }

  return { currentProject, setProject, clear }
})
