<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import type { Station } from '../../../../../types/station'
import StationList from './StationList.vue'
import StationBasicInfo from './StationBasicInfo.vue'
import StationExits from './StationExits.vue'
import StationPlatforms from './StationPlatforms.vue'
import {
  ElContainer,
  ElAside,
  ElMain,
  ElMessage,
  ElMessageBox
} from 'element-plus'

const projectStore = useProjectStore()
const stations = ref<Station[]>([])
const searchQuery = ref('')
const selectedTagFilter = ref('')
const selectedStation = ref<Station | null>(null)
const isLoading = ref(false)
const isDirty = ref(false)

// 检查是否有选中的项目
const hasSelectedProject = computed(() => {
  return !!projectStore.selectedProjectId
})

// 加载车站数据
async function loadStations() {
  if (!projectStore.selectedProjectId) {
    ElMessage.warning('请先选择一个项目')
    return
  }

  isLoading.value = true
  try {
    const stationData = await window.api.getStations(projectStore.selectedProjectId)
    stations.value = stationData
  } catch (error) {
    console.error('Failed to load stations:', error)
    ElMessage.error('加载车站数据失败')
  } finally {
    isLoading.value = false
  }
}

// 保存车站数据
async function saveStations() {
  if (!projectStore.selectedProjectId) {
    ElMessage.warning('请先选择一个项目')
    return
  }

  try {
    // 深度克隆并清理数据，确保可序列化
    const cleanStations = JSON.parse(JSON.stringify(stations.value))
    const result = await window.api.saveStations(projectStore.selectedProjectId, cleanStations)
    if (result.success) {
      ElMessage.success('车站数据保存成功')
      isDirty.value = false
      projectStore.setUnsavedChanges(false)
    } else {
      ElMessage.error('保存车站数据失败')
    }
  } catch (error) {
    console.error('Failed to save stations:', error)
    ElMessage.error('保存车站数据失败')
  }
}

// 自动保存功能
async function autoSave() {
  if (isDirty.value && projectStore.selectedProjectId) {
    await saveStations()
  }
}

// 选择车站
function selectStation(station: Station) {
  selectedStation.value = station
}

// 添加新车站
function addNewStation() {
  const newStation: Station = {
    id: Date.now(),
    update: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
    name: {
      kanji: '新车站',
      english: 'New Station',
      chinese: '新车站'
    },
    tags: [],
    exits: [],
    platforms: []
  }

  stations.value.push(newStation)
  selectedStation.value = newStation
  markDirty()
}

// 删除车站
async function deleteStation(station: Station) {
  try {
    await ElMessageBox.confirm(`确定要删除车站 "${station.name.kanji}" 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const index = stations.value.findIndex(s => s.id === station.id)
    if (index > -1) {
      stations.value.splice(index, 1)
      if (selectedStation.value?.id === station.id) {
        selectedStation.value = null
      }
      markDirty()
      ElMessage.success('车站删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete station:', error)
      ElMessage.error('删除车站失败')
    }
  }
}

// 更新选中的车站
function updateSelectedStation(updatedStation: Station) {
  if (!selectedStation.value) return

  // 更新 stations 数组中的车站
  const index = stations.value.findIndex(s => s.id === updatedStation.id)
  if (index > -1) {
    stations.value[index] = updatedStation
  }

  // 更新选中的车站
  selectedStation.value = updatedStation
  markDirty()
}

// 标记为已修改
function markDirty() {
  isDirty.value = true
  projectStore.setUnsavedChanges(true)
}

// 监听isDirty变化，同步到全局状态
watch(isDirty, (newValue) => {
  projectStore.setUnsavedChanges(newValue)
})

// 路由守卫：离开页面前检查未保存的更改
onBeforeRouteLeave(async (_to, _from, next) => {
  if (isDirty.value) {
    try {
      const result = await ElMessageBox.confirm(
        '您有未保存的更改，是否要保存后离开？',
        '确认离开',
        {
          confirmButtonText: '保存并离开',
          cancelButtonText: '不保存离开',
          distinguishCancelAndClose: true,
          type: 'warning'
        }
      )

      if (result === 'confirm') {
        await autoSave()
      }
      next()
    } catch (action) {
      if (action === 'cancel') {
        isDirty.value = false
        projectStore.setUnsavedChanges(false)
        next()
      } else {
        next(false)
      }
    }
  } else {
    next()
  }
})

// 监听项目变化
watch(() => projectStore.selectedProjectId, (newProjectId) => {
  if (newProjectId) {
    loadStations()
  } else {
    stations.value = []
    selectedStation.value = null
  }
})

// 页面加载时初始化
onMounted(() => {
  if (projectStore.selectedProjectId) {
    loadStations()
  }
})
</script>

<template>
  <div v-if="!hasSelectedProject" class="p-8 text-center">
    <h2>请先选择一个项目</h2>
    <p class="text-gray-500 mt-4">您需要在项目管理页面选择一个项目后才能编辑车站信息。</p>
    <el-button type="primary" @click="$router.push('/')">前往项目管理</el-button>
  </div>

  <el-container v-else style="height: calc(100vh - 60px);">
    <!-- 左侧边栏：车站列表 -->
    <el-aside width="400px" class="border-r">
      <StationList
        v-model:search-query="searchQuery"
        v-model:selected-tag-filter="selectedTagFilter"
        :stations="stations"
        :is-dirty="isDirty"
        @select-station="selectStation"
        @add-station="addNewStation"
        @delete-station="deleteStation"
        @save-stations="saveStations"
      />
    </el-aside>

    <!-- 右侧主区域：车站编辑器 -->
    <el-main>
      <div v-if="selectedStation" class="p-4">
        <h2>编辑车站: {{ selectedStation.name.kanji }}</h2>

        <!-- 基本信息 -->
        <StationBasicInfo
          :station="selectedStation"
          @update="updateSelectedStation"
        />

        <!-- 出口管理 -->
        <StationExits
          :station="selectedStation"
          @update="updateSelectedStation"
        />

        <!-- 站台管理 -->
        <StationPlatforms
          :station="selectedStation"
          @update="updateSelectedStation"
        />
      </div>
      <div v-else class="p-4 text-center text-gray-500">
        <p>请从左侧选择一个车站进行编辑</p>
      </div>
    </el-main>
  </el-container>
</template>
