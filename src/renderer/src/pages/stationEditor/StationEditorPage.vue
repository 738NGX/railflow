<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import type { Station } from '@/utils/station'
import {
  ElContainer,
  ElAside,
  ElMain,
  ElInput,
  ElButton,
  ElTable,
  ElTableColumn,
  ElMessage,
  ElTag,
  ElSelect,
  ElOption,
  ElMessageBox,
  ElCard,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElCollapse,
  ElCollapseItem
} from 'element-plus'
import { Search, Plus, Delete } from '@element-plus/icons-vue'

const projectStore = useProjectStore()
const stations = ref<Station[]>([])
const searchQuery = ref('')
const selectedTagFilter = ref('')
const selectedStation = ref<Station | null>(null)
const isLoading = ref(false)
const isDirty = ref(false)

// 计算属性：过滤后的车站列表
const filteredStations = computed(() => {
  let filtered = stations.value

  // 按名称搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(station =>
      station.name.kanji.toLowerCase().includes(query) ||
      station.name.english.toLowerCase().includes(query) ||
      (station.name.chinese && station.name.chinese.toLowerCase().includes(query))
    )
  }

  // 按标签过滤
  if (selectedTagFilter.value) {
    filtered = filtered.filter(station =>
      station.tags.includes(selectedTagFilter.value)
    )
  }

  return filtered
})

// 计算属性：所有可用的标签
const availableTags = computed(() => {
  const tags = new Set<string>()
  stations.value.forEach(station => {
    station.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags)
})

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
  isDirty.value = true
  projectStore.setUnsavedChanges(true)
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
      isDirty.value = true
      projectStore.setUnsavedChanges(true)
      ElMessage.success('车站删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete station:', error)
      ElMessage.error('删除车站失败')
    }
  }
}

// 添加新出口
function addExit() {
  if (!selectedStation.value) return

  const newExit = {
    id: Math.max(0, ...selectedStation.value.exits.map(e => e.id)) + 1,
    name: {
      kanji: '新出口',
      english: 'New Exit',
      chinese: '新出口'
    }
  }

  selectedStation.value.exits.push(newExit)
  isDirty.value = true
  projectStore.setUnsavedChanges(true)
}

// 删除出口
function removeExit(exitId: number) {
  if (!selectedStation.value) return

  const index = selectedStation.value.exits.findIndex(e => e.id === exitId)
  if (index > -1) {
    selectedStation.value.exits.splice(index, 1)
    isDirty.value = true
    projectStore.setUnsavedChanges(true)
  }
}

// 添加新站台
function addPlatform() {
  if (!selectedStation.value) return

  const newPlatform = {
    id: Math.max(0, ...selectedStation.value.platforms.map(p => p.id)) + 1,
    name: {
      kanji: '新站台',
      english: 'New Platform'
    },
    doorside: 'Left' as const,
    blocks: []
  }

  selectedStation.value.platforms.push(newPlatform)
  isDirty.value = true
  projectStore.setUnsavedChanges(true)
}

// 删除站台
function removePlatform(platformId: number) {
  if (!selectedStation.value) return

  const index = selectedStation.value.platforms.findIndex(p => p.id === platformId)
  if (index > -1) {
    selectedStation.value.platforms.splice(index, 1)
    isDirty.value = true
    projectStore.setUnsavedChanges(true)
  }
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
      <div class="p-4">
        <!-- 搜索框 -->
        <el-input v-model="searchQuery" placeholder="搜索车站..." :prefix-icon="Search" class="mb-4" />

        <!-- 标签筛选器 -->
        <el-select v-model="selectedTagFilter" placeholder="按标签筛选" clearable class="mb-4 w-full">
          <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
        </el-select>

        <!-- 操作按钮 -->
        <div class="mb-4 flex gap-2">
          <el-button type="primary" :icon="Plus" @click="addNewStation">
            新建车站
          </el-button>
          <el-button type="success" :disabled="!isDirty" @click="saveStations">
            保存全部
          </el-button>
        </div>

        <!-- 车站表格 -->
        <el-table
          :data="filteredStations" height="calc(100vh - 300px)" highlight-current-row
          @row-click="selectStation"
        >
          <el-table-column prop="name.kanji" label="车站名称" />
          <el-table-column label="标签" width="100">
            <template #default="{ row }">
              <el-tag v-for="tag in row.tags.slice(0, 2)" :key="tag" size="small" class="mr-1">
                {{ tag }}
              </el-tag>
              <span v-if="row.tags.length > 2" class="text-xs text-gray-500">
                +{{ row.tags.length - 2 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button size="small" type="danger" :icon="Delete" @click.stop="deleteStation(row)" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-aside>

    <!-- 右侧主区域：车站编辑器 -->
    <el-main>
      <div v-if="selectedStation" class="p-4">
        <h2>编辑车站: {{ selectedStation.name.kanji }}</h2>

        <!-- 基本信息 -->
        <el-card class="mb-4">
          <template #header>
            <h3>基本信息</h3>
          </template>
          <el-form label-position="top">
            <div class="grid grid-cols-2 gap-4">
              <el-form-item label="日文名称">
                <el-input
                  v-model="selectedStation.name.kanji"
                  @input="isDirty = true; projectStore.setUnsavedChanges(true)"
                />
              </el-form-item>
              <el-form-item label="英文名称">
                <el-input
                  v-model="selectedStation.name.english"
                  @input="isDirty = true; projectStore.setUnsavedChanges(true)"
                />
              </el-form-item>
              <el-form-item label="中文名称">
                <el-input
                  v-model="selectedStation.name.chinese"
                  @input="isDirty = true; projectStore.setUnsavedChanges(true)"
                />
              </el-form-item>
              <el-form-item label="站点代码">
                <el-input
                  v-model="selectedStation.name.code"
                  @input="isDirty = true; projectStore.setUnsavedChanges(true)"
                />
              </el-form-item>
            </div>
            <el-form-item label="更新时间">
              <div class="flex gap-2">
                <el-input-number
                  v-model="selectedStation.update.year" :min="2000" :max="2100"
                  @change="isDirty = true; projectStore.setUnsavedChanges(true)"
                />
                <span>年</span>
                <el-input-number
                  v-model="selectedStation.update.month" :min="1" :max="12"
                  @change="isDirty = true; projectStore.setUnsavedChanges(true)"
                />
                <span>月</span>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 出口管理 -->
        <el-card class="mb-4">
          <template #header>
            <div class="flex justify-between items-center">
              <h3>出口管理</h3>
              <el-button type="primary" size="small" @click="addExit">添加出口</el-button>
            </div>
          </template>
          <el-collapse v-if="selectedStation.exits.length > 0">
            <el-collapse-item v-for="exit in selectedStation.exits" :key="exit.id" :name="exit.id.toString()">
              <template #title>
                <span>出口 {{ exit.id }}: {{ exit.name.kanji }}</span>
              </template>
              <el-form label-position="top">
                <div class="grid grid-cols-3 gap-4">
                  <el-form-item label="日文名称">
                    <el-input v-model="exit.name.kanji" @input="isDirty = true; projectStore.setUnsavedChanges(true)" />
                  </el-form-item>
                  <el-form-item label="英文名称">
                    <el-input
                      v-model="exit.name.english"
                      @input="isDirty = true; projectStore.setUnsavedChanges(true)"
                    />
                  </el-form-item>
                  <el-form-item label="中文名称">
                    <el-input
                      v-model="exit.name.chinese"
                      @input="isDirty = true; projectStore.setUnsavedChanges(true)"
                    />
                  </el-form-item>
                </div>
                <el-button type="danger" size="small" @click="removeExit(exit.id)">
                  删除出口
                </el-button>
              </el-form>
            </el-collapse-item>
          </el-collapse>
          <div v-else class="text-center text-gray-500 py-4">
            暂无出口信息
          </div>
        </el-card>

        <!-- 站台管理 -->
        <el-card class="mb-4">
          <template #header>
            <div class="flex justify-between items-center">
              <h3>站台管理</h3>
              <el-button type="primary" size="small" @click="addPlatform">添加站台</el-button>
            </div>
          </template>
          <el-collapse v-if="selectedStation.platforms.length > 0">
            <el-collapse-item
              v-for="platform in selectedStation.platforms" :key="platform.id"
              :name="platform.id.toString()"
            >
              <template #title>
                <span>站台 {{ platform.id }}: {{ platform.name.kanji }}</span>
              </template>
              <el-form label-position="top">
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <el-form-item label="日文名称">
                    <el-input
                      v-model="platform.name.kanji"
                      @input="isDirty = true; projectStore.setUnsavedChanges(true)"
                    />
                  </el-form-item>
                  <el-form-item label="英文名称">
                    <el-input
                      v-model="platform.name.english"
                      @input="isDirty = true; projectStore.setUnsavedChanges(true)"
                    />
                  </el-form-item>
                </div>

                <el-form-item label="车门开启方向">
                  <el-select v-model="platform.doorside" @change="isDirty = true; projectStore.setUnsavedChanges(true)">
                    <el-option label="左侧" value="Left" />
                    <el-option label="右侧" value="Right" />
                  </el-select>
                </el-form-item>

                <el-button type="danger" size="small" @click="removePlatform(platform.id)">
                  删除站台
                </el-button>
              </el-form>
            </el-collapse-item>
          </el-collapse>
          <div v-else class="text-center text-gray-500 py-4">
            暂无站台信息
          </div>
        </el-card>
      </div>
      <div v-else class="p-4 text-center text-gray-500">
        <p>请从左侧选择一个车站进行编辑</p>
      </div>
    </el-main>
  </el-container>
</template>
