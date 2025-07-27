import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProjectStore = defineStore('project', () => {
  const selectedProjectId = ref<string | null>(null)
  const hasUnsavedChanges = ref(false)

  function selectProject(projectId: string) {
    selectedProjectId.value = projectId
  }

  function clearProject() {
    selectedProjectId.value = null
    hasUnsavedChanges.value = false
  }

  function setUnsavedChanges(value: boolean) {
    hasUnsavedChanges.value = value
  }

  return {
    selectedProjectId,
    hasUnsavedChanges,
    selectProject,
    clearProject,
    setUnsavedChanges
  }
})
