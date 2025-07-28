<template>
  <div class="p-4">
    <!-- 搜索框 -->
    <el-input
      v-model="searchQuery"
      placeholder="搜索车站..."
      :prefix-icon="Search"
      class="mb-4"
    />

    <!-- 标签筛选器 -->
    <el-select
      v-model="selectedTagFilter"
      placeholder="按标签筛选"
      clearable
      class="mb-4 w-full"
    >
      <el-option
        v-for="tag in availableTags"
        :key="tag"
        :label="tag"
        :value="tag"
      />
    </el-select>

    <!-- 操作按钮 -->
    <div class="mb-4 flex gap-2">
      <el-button type="primary" :icon="Plus" @click="$emit('add-station')">
        新建车站
      </el-button>
      <el-button type="success" :disabled="!isDirty" @click="$emit('save-stations')">
        保存全部
      </el-button>
    </div>

    <!-- 车站表格 -->
    <el-table
      :data="filteredStations"
      height="calc(100vh - 300px)"
      highlight-current-row
      @row-click="(row) => $emit('select-station', row)"
    >
      <el-table-column prop="name.kanji" label="车站名称" />
      <el-table-column label="标签" width="100">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.tags.slice(0, 2)"
            :key="tag"
            size="small"
            class="mr-1"
          >
            {{ tag }}
          </el-tag>
          <span v-if="row.tags.length > 2" class="text-xs text-gray-500">
            +{{ row.tags.length - 2 }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button
            size="small"
            type="danger"
            :icon="Delete"
            @click.stop="$emit('delete-station', row)"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Station } from '../../../../../types/station'
import {
  ElInput,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElSelect,
  ElOption
} from 'element-plus'
import { Search, Plus, Delete } from '@element-plus/icons-vue'

interface Props {
  stations: Station[]
  searchQuery: string
  selectedTagFilter: string
  isDirty: boolean
}

interface Emits {
  (e: 'update:searchQuery', value: string): void
  (e: 'update:selectedTagFilter', value: string): void
  (e: 'select-station', station: Station): void
  (e: 'add-station'): void
  (e: 'delete-station', station: Station): void
  (e: 'save-stations'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性：过滤后的车站列表
const filteredStations = computed(() => {
  let filtered = props.stations

  // 按名称搜索
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    filtered = filtered.filter(station =>
      station.name.kanji.toLowerCase().includes(query) ||
      station.name.english.toLowerCase().includes(query) ||
      (station.name.chinese && station.name.chinese.toLowerCase().includes(query))
    )
  }

  // 按标签过滤
  if (props.selectedTagFilter) {
    filtered = filtered.filter(station =>
      station.tags.includes(props.selectedTagFilter)
    )
  }

  return filtered
})

// 计算属性：所有可用的标签
const availableTags = computed(() => {
  const tags = new Set<string>()
  props.stations.forEach(station => {
    station.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags)
})

// 使用 v-model 绑定
const searchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value)
})

const selectedTagFilter = computed({
  get: () => props.selectedTagFilter,
  set: (value) => emit('update:selectedTagFilter', value)
})
</script>
