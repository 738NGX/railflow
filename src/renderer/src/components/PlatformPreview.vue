<template>
  <div class="platform-preview bg-gray-50 border border-gray-200 rounded-lg p-4">
    <div class="flex justify-between items-center mb-3">
      <h4 class="text-sm text-black font-medium">{{ platform.name.kanji }}</h4>

      <!-- 显示屏位置选择 -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-600">显示屏位置:</span>
        <el-radio-group v-model="displaySide" size="small">
          <el-radio-button value="left">左侧门</el-radio-button>
          <el-radio-button value="right">右侧门</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 站台主体 -->
    <div class="relative">
      <!-- 列车行进方向指示 -->
      <div class="flex mb-2" :class="displaySide === 'right' ? 'justify-start' : 'justify-end'">
        <div class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
          {{ trainDirection }}
        </div>
      </div>

      <!-- 站台网格区域 - 根据shouldFlipLayout决定顺序 -->
      <div class="space-y-1">
        <!-- 条件渲染：轨道在上方时 -->
        <div v-if="shouldFlipLayout" class="track-area">
          <div class="h-6 bg-gray-600 rounded relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500" />
            <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold">
              ═══════════ 轨道 ═══════════
            </div>
          </div>
        </div>

        <!-- 条件渲染：出口名在上方时（当轨道翻转到下方时，出口名在上方） -->
        <div v-if="!shouldFlipLayout" class="exits-row">
          <div class="grid-row flex gap-1">
            <div
              v-for="(block, blockIndex) in platform.blocks"
              :key="`exit-top-${blockIndex}`"
              class="exit-block flex"
              :style="{ width: `${(block.units.length / totalUnits) * 100}%` }"
            >
              <div class="bg-yellow-300 border-black border-1 text-black text-xs px-2 py-1 text-center font-medium w-full">
                {{ getExitName(block.exit) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 3层网格区域 -->
        <div class="grid-container bg-white border-2 border-gray-300 rounded">
          <!-- 根据翻转状态决定层级顺序 -->
          <template v-if="!shouldFlipLayout">
            <!-- 正常顺序：Back -> Center -> Front -->
            <!-- Back 层 (距离轨道最远) -->
            <div class="grid-row flex border-b border-gray-200">
              <div
                v-for="(_, unitIndex) in allUnits"
                :key="`back-${unitIndex}`"
                class="unit-cell border-r border-gray-100 last:border-r-0 h-8 relative flex-1"
                :class="getUnitBlockClass(unitIndex)"
              >
                <div class="absolute inset-0 flex items-center justify-center gap-1">
                  <div
                    v-for="object in getObjectsByCoordAndPos(unitIndex, 'Back')"
                    :key="`back-obj-${object.id}`"
                    class="facility-icon"
                    :class="getFacilityIconClass(object)"
                    :title="getFacilityName(object)"
                  >
                    {{ getFacilityIcon(object) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Center 层 -->
            <div class="grid-row flex border-b border-gray-200">
              <div
                v-for="(_, unitIndex) in allUnits"
                :key="`center-${unitIndex}`"
                class="unit-cell border-r border-gray-100 last:border-r-0 h-8 relative flex-1"
                :class="getUnitBlockClass(unitIndex)"
              >
                <div class="absolute inset-0 flex items-center justify-center gap-1">
                  <div
                    v-for="object in getObjectsByCoordAndPos(unitIndex, 'Center')"
                    :key="`center-obj-${object.id}`"
                    class="facility-icon"
                    :class="getFacilityIconClass(object)"
                    :title="getFacilityName(object)"
                  >
                    {{ getFacilityIcon(object) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Front 层 (距离轨道最近) -->
            <div class="grid-row flex">
              <div
                v-for="(_, unitIndex) in allUnits"
                :key="`front-${unitIndex}`"
                class="unit-cell border-r border-gray-100 last:border-r-0 h-8 relative flex-1"
                :class="getUnitBlockClass(unitIndex)"
              >
                <div class="absolute inset-0 flex items-center justify-center gap-1">
                  <div
                    v-for="object in getObjectsByCoordAndPos(unitIndex, 'Front')"
                    :key="`front-obj-${object.id}`"
                    class="facility-icon"
                    :class="getFacilityIconClass(object)"
                    :title="getFacilityName(object)"
                  >
                    {{ getFacilityIcon(object) }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <!-- 翻转顺序：Front -> Center -> Back -->
            <!-- Front 层 (翻转时距离轨道最远) -->
            <div class="grid-row flex border-b border-gray-200">
              <div
                v-for="(_, unitIndex) in allUnits"
                :key="`front-flip-${unitIndex}`"
                class="unit-cell border-r border-gray-100 last:border-r-0 h-8 relative flex-1"
                :class="getUnitBlockClass(unitIndex)"
              >
                <div class="absolute inset-0 flex items-center justify-center gap-1">
                  <div
                    v-for="object in getObjectsByCoordAndPos(unitIndex, 'Front')"
                    :key="`front-flip-obj-${object.id}`"
                    class="facility-icon"
                    :class="getFacilityIconClass(object)"
                    :title="getFacilityName(object)"
                  >
                    {{ getFacilityIcon(object) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Center 层 -->
            <div class="grid-row flex border-b border-gray-200">
              <div
                v-for="(_, unitIndex) in allUnits"
                :key="`center-flip-${unitIndex}`"
                class="unit-cell border-r border-gray-100 last:border-r-0 h-8 relative flex-1"
                :class="getUnitBlockClass(unitIndex)"
              >
                <div class="absolute inset-0 flex items-center justify-center gap-1">
                  <div
                    v-for="object in getObjectsByCoordAndPos(unitIndex, 'Center')"
                    :key="`center-flip-obj-${object.id}`"
                    class="facility-icon"
                    :class="getFacilityIconClass(object)"
                    :title="getFacilityName(object)"
                  >
                    {{ getFacilityIcon(object) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Back 层 (翻转时距离轨道最近) -->
            <div class="grid-row flex">
              <div
                v-for="(_, unitIndex) in allUnits"
                :key="`back-flip-${unitIndex}`"
                class="unit-cell border-r border-gray-100 last:border-r-0 h-8 relative flex-1"
                :class="getUnitBlockClass(unitIndex)"
              >
                <div class="absolute inset-0 flex items-center justify-center gap-1">
                  <div
                    v-for="object in getObjectsByCoordAndPos(unitIndex, 'Back')"
                    :key="`back-flip-obj-${object.id}`"
                    class="facility-icon"
                    :class="getFacilityIconClass(object)"
                    :title="getFacilityName(object)"
                  >
                    {{ getFacilityIcon(object) }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 条件渲染：出口名在下方时（当轨道翻转到上方时，出口名在下方） -->
        <div v-if="shouldFlipLayout" class="exits-row">
          <div class="grid-row flex">
            <div
              v-for="(block, blockIndex) in platform.blocks"
              :key="`exit-bottom-${blockIndex}`"
              class="exit-block flex"
              :style="{ width: `${(block.units.length / totalUnits) * 100}%` }"
            >
              <div class="bg-yellow-400 text-black text-xs px-2 py-1 text-center font-medium w-full rounded-b">
                {{ getExitName(block.exit) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 条件渲染：轨道在下方时 -->
        <div v-if="!shouldFlipLayout" class="track-area">
          <div class="h-6 bg-gray-600 rounded relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500" />
            <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold">
              ═══════════ 轨道 ═══════════
            </div>
          </div>
        </div>
      </div>

      <!-- 车门方向指示 -->
      <div class="mt-3 text-center">
        <div class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
          <span>🚪</span>
          <span>车门: {{ platform.doorside === 'Left' ? '左侧开启' : '右侧开启' }}</span>
          <span class="mx-2">|</span>
          <span>📺</span>
          <span>显示屏: {{ displaySide === 'left' ? '左侧门' : '右侧门' }}</span>
        </div>
      </div>

      <!-- 如果没有块，显示空状态 -->
      <div v-if="platform.blocks.length === 0" class="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-300 rounded">
        <div class="text-center">
          <div class="text-2xl mb-2">🏗️</div>
          <div class="text-sm">暂无站台布局</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Station, PlatformObject } from '../../../../types/station'
import { ElRadioGroup, ElRadioButton } from 'element-plus'

interface Props {
  platform: Station['platforms'][0]
  exits: Station['exits']
}

const props = defineProps<Props>()
const displaySide = ref<'left' | 'right'>('left')

// 计算是否应该翻转布局
// 左侧显示屏 + 左侧开门 = 正常显示（出口在上，轨道在下）
// 左侧显示屏 + 右侧开门 = 翻转显示（轨道在上，出口在下）
// 右侧显示屏 + 左侧开门 = 翻转显示（轨道在上，出口在下）
// 右侧显示屏 + 右侧开门 = 正常显示（出口在上，轨道在下）
const shouldFlipLayout = computed(() => {
  return (displaySide.value === 'left' && props.platform.doorside === 'Right') ||
         (displaySide.value === 'right' && props.platform.doorside === 'Left')
})

// 计算列车行进方向
const trainDirection = computed(() => {
  // 如果显示屏在右侧，列车行进方向显示为向左
  return displaySide.value === 'right' ? '← 列车前进方向' : '列车前进方向 →'
})

// 将所有units平铺成一维数组
const allUnits = computed(() => {
  const units: Array<{ objects: PlatformObject[], blockIndex: number, unitIndex: number }> = []
  props.platform.blocks.forEach((block, blockIndex) => {
    block.units.forEach((unit, unitIndex) => {
      units.push({
        objects: unit.objects,
        blockIndex,
        unitIndex
      })
    })
  })
  return units
})

// 总unit数量
const totalUnits = computed(() => allUnits.value.length)

// 根据坐标位置获取对象 - 修复横坐标问题
const getObjectsByCoordAndPos = (unitIndex: number, pos: 'Front' | 'Center' | 'Back') => {
  // 收集所有对象及其坐标信息
  const allObjects: (PlatformObject & { id: string, unitCoord: number })[] = []

  let currentCoord = 0
  props.platform.blocks.forEach((block, blockIndex) => {
    block.units.forEach((unit, uIndex) => {
      unit.objects.forEach((obj, objIndex) => {
        allObjects.push({
          ...obj,
          id: `${blockIndex}-${uIndex}-${objIndex}`,
          unitCoord: currentCoord
        })
      })
      currentCoord++
    })
  })

  // 筛选出在当前unit坐标且位置匹配的对象
  return allObjects.filter(obj =>
    obj.pos === pos && obj.unitCoord === unitIndex
  )
}

// 获取unit所属的block样式
function getUnitBlockClass(unitIndex: number): string {
  const unit = allUnits.value[unitIndex]
  if (!unit) return ''

  const colors = [
    'bg-red-50',
    'bg-blue-50',
    'bg-green-50',
    'bg-yellow-50',
    'bg-purple-50',
    'bg-pink-50'
  ]

  return colors[unit.blockIndex % colors.length]
}

// 获取出口名称
function getExitName(exitId: number): string {
  const exit = props.exits.find(e => e.id === exitId)
  return exit ? exit.name.kanji : `出口 ${exitId}`
}

// 获取设施图标
function getFacilityIcon(object: PlatformObject): string {
  const iconMap: Record<string, string> = {
    'DownStairs': '🪜',
    'UpStairs': '🪜',
    'DownEscalator': '📶',
    'UpEscalator': '📶',
    'Elevator': '🛗'
  }
  return iconMap[object.type] || '📍'
}

// 获取设施名称
function getFacilityName(object: PlatformObject): string {
  const nameMap: Record<string, string> = {
    'DownStairs': '下行楼梯',
    'UpStairs': '上行楼梯',
    'DownEscalator': '下行扶梯',
    'UpEscalator': '上行扶梯',
    'Elevator': '电梯'
  }
  return nameMap[object.type] || object.type
}

// 获取设施图标样式类
function getFacilityIconClass(object: PlatformObject): string {
  let baseClass = 'w-5 h-5 flex items-center justify-center text-xs rounded border'

  // 根据类型添加颜色
  if (object.type.includes('Stairs')) {
    baseClass += ' bg-orange-100 border-orange-300 text-orange-800'
  } else if (object.type.includes('Escalator')) {
    baseClass += ' bg-blue-100 border-blue-300 text-blue-800'
  } else if (object.type === 'Elevator') {
    baseClass += ' bg-green-100 border-green-300 text-green-800'
  } else {
    baseClass += ' bg-gray-100 border-gray-300'
  }

  return baseClass
}
</script>

<style scoped>
.platform-preview {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.facility-icon {
  transition: all 0.2s;
  cursor: help;
}

.facility-icon:hover {
  transform: scale(1.1);
  z-index: 10;
}
</style>
