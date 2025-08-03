<template>
  <div class="grid grid-cols-1 2xl:grid-cols-2 gap-4">
    <!-- 站台预览 -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-3">
        <h4 class="text-sm font-medium">站台布局预览</h4>

        <!-- 预览控制选项 -->
        <div class="flex items-center gap-4">
          <!-- 车型选择 -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-600">预览车型:</span>
            <el-select
              v-model="selectedTrainType"
              size="small"
              placeholder="选择车型"
              style="width: 120px"
            >
              <el-option label="E235-0系" value="E235-0" />
              <!-- 未来车型预留 -->
              <!-- <el-option label="E235-1000系" value="E235-1000" disabled /> -->
            </el-select>
          </div>

          <!-- 屏幕侧边 -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-600">屏幕侧:</span>
            <el-select
              v-model="previewScreenSide"
              size="small"
              placeholder="选择侧边"
              style="width: 80px"
            >
              <el-option label="左侧" value="Left" />
              <el-option label="右侧" value="Right" />
            </el-select>
          </div>

          <!-- 车厢编号方向 -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-600">编号方向:</span>
            <el-select
              v-model="previewCarNumberDirection"
              size="small"
              placeholder="选择方向"
              style="width: 80px"
            >
              <el-option label="正向" value="Front" />
              <el-option label="反向" value="Opposite" />
            </el-select>
          </div>

          <!-- 当前车厢 -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-600">当前车厢:</span>
            <el-select
              v-model="previewCurrentCarNumber"
              size="small"
              placeholder="选择车厢"
              style="width: 80px"
              clearable
            >
              <el-option
                v-for="carNum in 11"
                :key="carNum"
                :label="`${carNum}号`"
                :value="carNum"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- E235-0 预览组件 -->
      <PlatformPreviewE235_0
        v-if="selectedTrainType === 'E235-0'"
        :platform="platform"
        :exits="exits"
        :screen-side="previewScreenSide"
        :car-number-direction="previewCarNumberDirection"
        :current-car-number="previewCurrentCarNumber"
        :canvas-width="1920"
        @object-click="handleObjectClick"
        @object-hover="handleObjectHover"
      />

      <!-- 未来其他车型组件预留位置 -->
      <!-- <PlatformPreviewE235_1000 v-else-if="selectedTrainType === 'E235-1000'" ... /> -->

      <!-- 未知车型提示 -->
      <div
        v-if="!['E235-0'].includes(selectedTrainType)"
        class="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-300 rounded"
      >
        <div class="text-center">
          <div class="text-2xl mb-2">🚅</div>
          <div class="text-sm">暂不支持此车型预览</div>
        </div>
      </div>
    </div>

    <el-form label-position="top" class="h-128 overflow-auto">
      <div class="grid grid-cols-[3fr_1fr] gap-4 mb-4">
        <el-form-item label="日文名称">
          <el-input
            :model-value="platform.name.kanji"
            @input="updateName('kanji', $event)"
          />
        </el-form-item>
        <el-form-item label="车门开启方向">
          <el-select
            :model-value="platform.doorside"
            @change="updateDoorside($event)"
          >
            <el-option label="左侧" value="Left" />
            <el-option label="右侧" value="Right" />
          </el-select>
        </el-form-item>
      </div>

      <!-- 出口显示管理 -->
      <el-form-item label="出口显示">
        <div class="space-y-4 w-full">
          <div
            v-for="(exitDisplay, exitIndex) in (platform.exits || [])"
            :key="exitIndex"
            class="border border-gray-200 rounded p-4"
          >
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-medium">出口显示 {{ exitIndex + 1 }}</h4>
              <el-button
                type="danger"
                size="small"
                @click="removeExitDisplay(exitIndex)"
              >
                删除出口显示
              </el-button>
            </div>

            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 mb-3">
              <el-form-item label="关联出口">
                <el-select
                  :model-value="exitDisplay.id"
                  @change="updateExitDisplayId(exitIndex, $event)"
                >
                  <el-option
                    v-for="exit in exits"
                    :key="exit.id"
                    :label="`出口 ${exit.id}: ${exit.name.kanji}`"
                    :value="exit.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="起始X坐标">
                <el-input-number
                  :model-value="exitDisplay.start"
                  :min="0"
                  :max="Math.min(exitDisplay.end - 1, 934)"
                  class="!w-full"
                  @update:model-value="updateExitDisplayStart(exitIndex, $event)"
                />
              </el-form-item>

              <el-form-item label="结束X坐标">
                <el-input-number
                  :model-value="exitDisplay.end"
                  :min="exitDisplay.start + 1"
                  :max="935"
                  class="!w-full"
                  @update:model-value="updateExitDisplayEnd(exitIndex, $event)"
                />
              </el-form-item>

              <el-form-item label="文字尺寸">
                <el-input-number
                  :model-value="exitDisplay.fontScale"
                  :min="0.1"
                  :max="3"
                  :step="0.1"
                  class="!w-full"
                  @update:model-value="updateExitDisplayFontScale(exitIndex, $event)"
                />
              </el-form-item>

              <el-form-item label="垂直对齐">
                <el-select
                  :model-value="exitDisplay.av"
                  @change="updateExitDisplayPos(exitIndex, $event)"
                >
                  <el-option label="站台近侧" value="Front" />
                  <el-option label="站台中部" value="Center" />
                  <el-option label="站台远侧" value="Back" />
                  <el-option label="站台界外" value="Border" />
                </el-select>
              </el-form-item>
            </div>
          </div>

          <el-button
            type="primary"
            size="small"
            @click="addExitDisplay"
          >
            添加出口显示
          </el-button>
        </div>
      </el-form-item>

      <!-- 站台单元管理 -->
      <el-form-item label="站台单元">
        <div class="space-y-4 w-full">
          <div
            v-for="(unit, unitIndex) in (platform.units || [])"
            :key="unitIndex"
            class="border border-gray-200 rounded p-4"
          >
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-medium">单元 {{ unitIndex + 1 }}</h4>
              <el-button
                type="danger"
                size="small"
                @click="removeUnit(unitIndex)"
              >
                删除单元
              </el-button>
            </div>

            <!-- 站台对象管理 -->
            <div class="mt-4">
              <div class="flex justify-between items-center mb-2">
                <h5 class="text-sm font-medium">站台对象</h5>
                <el-button
                  type="primary"
                  size="small"
                  @click="addObject(unitIndex)"
                >
                  添加对象
                </el-button>
              </div>

              <div
                v-for="(object, objectIndex) in unit.objects"
                :key="objectIndex"
                class="border border-gray-100 rounded p-3 mb-2"
              >
                <div class="flex gap-2 items-center mb-2">
                  <el-select
                    :model-value="object.type"
                    placeholder="类型"
                    class="w-32"
                    @change="updateObjectType(unitIndex, objectIndex, $event)"
                  >
                    <el-option label="下行楼梯" value="DownStairs" />
                    <el-option label="上行楼梯" value="UpStairs" />
                    <el-option label="下行扶梯" value="DownEscalator" />
                    <el-option label="上行扶梯" value="UpEscalator" />
                    <el-option label="电梯" value="Elevator" />
                  </el-select>

                  <el-select
                    :model-value="object.direction"
                    placeholder="方向"
                    class="w-24"
                    @change="updateObjectDirection(unitIndex, objectIndex, $event)"
                  >
                    <el-option label="朝向车头" value="Front" />
                    <el-option label="朝向车尾" value="Opposite" />
                  </el-select>

                  <el-select
                    :model-value="object.ah"
                    placeholder="位置"
                    class="w-24"
                    @change="updateObjectAh(unitIndex, objectIndex, $event)"
                  >
                    <el-option label="对齐车头6" value="Front6" />
                    <el-option label="对齐车头5" value="Front5" />
                    <el-option label="对齐车头4" value="Front4" />
                    <el-option label="对齐车头3" value="Front3" />
                    <el-option label="对齐车头2" value="Front2" />
                    <el-option label="对齐车头1" value="Front1" />
                    <el-option label="对齐车头" value="Front" />
                    <el-option label="对齐中间" value="Center" />
                    <el-option label="对齐车尾" value="Back" />
                    <el-option label="对齐车尾1" value="Back1" />
                    <el-option label="对齐车尾2" value="Back2" />
                    <el-option label="对齐车尾3" value="Back3" />
                    <el-option label="对齐车尾4" value="Back4" />
                    <el-option label="对齐车尾5" value="Back5" />
                    <el-option label="对齐车尾6" value="Back6" />
                  </el-select>

                  <el-select
                    :model-value="object.av"
                    placeholder="位置"
                    class="w-24"
                    @change="updateObjectAv(unitIndex, objectIndex, $event)"
                  >
                    <el-option label="站台近侧" value="Front" />
                    <el-option label="站台中部" value="Center" />
                    <el-option label="站台远侧" value="Back" />
                  </el-select>

                  <el-select
                    :model-value="object.linkedExit"
                    placeholder="关联出口"
                    class="w-32"
                    clearable
                    @change="updateObjectLinkedExit(unitIndex, objectIndex, $event)"
                  >
                    <el-option
                      v-for="exit in exits"
                      :key="exit.id"
                      :label="`出口 ${exit.id}: ${exit.name.kanji}`"
                      :value="exit.id"
                    />
                  </el-select>

                  <el-button
                    type="danger"
                    size="small"
                    @click="removeObject(unitIndex, objectIndex)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <el-button
            type="primary"
            size="small"
            @click="addUnit"
          >
            添加单元
          </el-button>
        </div>
      </el-form-item>

      <el-button type="danger" size="small" @click="$emit('delete')">
        删除站台
      </el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Exit, Platform, PlatformObject, ExitDisplay } from '../../../../../types/station'
import PlatformPreviewE235_0 from '../../themes/E235-0/PlatformPreviewE235-0.vue'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElButton
} from 'element-plus'

interface Props {
  platform: Platform
  exits: Exit[]
}

interface Emits {
  (e: 'update', platform: Platform): void
  (e: 'delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 车型选择相关
const selectedTrainType = ref<string>('E235-0')

// 预览控制变量
const previewScreenSide = ref<'Left' | 'Right'>('Left')
const previewCarNumberDirection = ref<'Front' | 'Opposite'>('Front')
const previewCurrentCarNumber = ref<number | undefined>(undefined)

// 预览对象类型定义（与 E235-0 组件保持一致）
interface DrawableObject {
  id: string
  type: PlatformObject['type']
  direction: PlatformObject['direction']
  pos: PlatformObject['ah']
  unitIndex: number
  x: number
  y: number
  width: number
  height: number
  stackIndex: number      // 新增：在堆叠中的索引
  totalInStack: number    // 新增：总堆叠数量
}

// 对象交互处理
function handleObjectClick(object: DrawableObject) {
  console.log('点击了设施对象:', object)
  // 未来可以在这里添加对象编辑逻辑
}

function handleObjectHover(object: DrawableObject | null) {
  // 未来可以在这里添加悬停状态逻辑
  if (object) {
    console.log('悬停在设施上:', object)
  }
}

function updateName(field: keyof Platform['name'], value: string) {
  const updatedPlatform = {
    ...props.platform,
    name: {
      ...props.platform.name,
      [field]: value
    }
  }
  emit('update', updatedPlatform)
}

function updateDoorside(value: 'Left' | 'Right') {
  const updatedPlatform = {
    ...props.platform,
    doorside: value
  }
  emit('update', updatedPlatform)
}

// 出口显示管理函数
function addExitDisplay() {
  const newExitDisplay: ExitDisplay = {
    id: props.exits && props.exits.length > 0 ? props.exits[0].id : 1,
    start: 0,
    end: 935,
    av: 'Border',
    fontScale: 1
  }

  const updatedPlatform = {
    ...props.platform,
    exits: [...(props.platform.exits || []), newExitDisplay]
  }
  emit('update', updatedPlatform)
}

function removeExitDisplay(exitIndex: number) {
  const updatedPlatform = {
    ...props.platform,
    exits: (props.platform.exits || []).filter((_, index) => index !== exitIndex)
  }
  emit('update', updatedPlatform)
}

function updateExitDisplayId(exitIndex: number, exitId: number) {
  const updatedPlatform = {
    ...props.platform,
    exits: (props.platform.exits || []).map((exitDisplay, index) =>
      index === exitIndex ? { ...exitDisplay, id: exitId } : exitDisplay
    )
  }
  emit('update', updatedPlatform)
}

function updateExitDisplayStart(exitIndex: number, start: number | undefined) {
  if (start === undefined) return

  const updatedPlatform = {
    ...props.platform,
    exits: (props.platform.exits || []).map((exitDisplay, index) =>
      index === exitIndex ? { ...exitDisplay, start } : exitDisplay
    )
  }
  emit('update', updatedPlatform)
}

function updateExitDisplayEnd(exitIndex: number, end: number | undefined) {
  if (end === undefined) return

  const updatedPlatform = {
    ...props.platform,
    exits: (props.platform.exits || []).map((exitDisplay, index) =>
      index === exitIndex ? { ...exitDisplay, end } : exitDisplay
    )
  }
  emit('update', updatedPlatform)
}

function updateExitDisplayFontScale(exitIndex: number, fontScale: number | undefined) {
  if (fontScale === undefined) return

  const updatedPlatform = {
    ...props.platform,
    exits: (props.platform.exits || []).map((exitDisplay, index) =>
      index === exitIndex ? { ...exitDisplay, fontScale } : exitDisplay
    )
  }
  emit('update', updatedPlatform)
}

function updateExitDisplayPos(exitIndex: number, pos: ExitDisplay['av']) {
  const updatedPlatform = {
    ...props.platform,
    exits: (props.platform.exits || []).map((exitDisplay, index) =>
      index === exitIndex ? { ...exitDisplay, av: pos } : exitDisplay
    )
  }
  emit('update', updatedPlatform)
}

// 站台单元管理函数
function addUnit() {
  const newUnit = {
    objects: []
  }

  const updatedPlatform = {
    ...props.platform,
    units: [...(props.platform.units || []), newUnit]
  }
  emit('update', updatedPlatform)
}

function removeUnit(unitIndex: number) {
  const updatedPlatform = {
    ...props.platform,
    units: (props.platform.units || []).filter((_, index) => index !== unitIndex)
  }
  emit('update', updatedPlatform)
}

// 站台对象管理函数
function addObject(unitIndex: number) {
  const newObject: PlatformObject = {
    type: 'DownStairs',
    direction: 'Front',
    ah: 'Center',
    av: 'Front',
    linkedExit: undefined
  }

  const updatedPlatform = {
    ...props.platform,
    units: (props.platform.units || []).map((unit, index) =>
      index === unitIndex
        ? { ...unit, objects: [...unit.objects, newObject] }
        : unit
    )
  }
  emit('update', updatedPlatform)
}

function removeObject(unitIndex: number, objectIndex: number) {
  const updatedPlatform = {
    ...props.platform,
    units: (props.platform.units || []).map((unit, uIndex) =>
      uIndex === unitIndex
        ? { ...unit, objects: unit.objects.filter((_, oIndex) => oIndex !== objectIndex) }
        : unit
    )
  }
  emit('update', updatedPlatform)
}

function updateObjectType(unitIndex: number, objectIndex: number, type: PlatformObject['type']) {
  const updatedPlatform = {
    ...props.platform,
    units: (props.platform.units || []).map((unit, uIndex) =>
      uIndex === unitIndex
        ? {
            ...unit,
            objects: unit.objects.map((obj, oIndex) =>
              oIndex === objectIndex ? { ...obj, type } : obj
            )
          }
        : unit
    )
  }
  emit('update', updatedPlatform)
}

function updateObjectDirection(unitIndex: number, objectIndex: number, direction: PlatformObject['direction']) {
  const updatedPlatform = {
    ...props.platform,
    units: (props.platform.units || []).map((unit, uIndex) =>
      uIndex === unitIndex
        ? {
            ...unit,
            objects: unit.objects.map((obj, oIndex) =>
              oIndex === objectIndex ? { ...obj, direction } : obj
            )
          }
        : unit
    )
  }
  emit('update', updatedPlatform)
}

function updateObjectAh(unitIndex: number, objectIndex: number, ah: PlatformObject['ah']) {
  const updatedPlatform = {
    ...props.platform,
    units: (props.platform.units || []).map((unit, uIndex) =>
      uIndex === unitIndex
        ? {
            ...unit,
            objects: unit.objects.map((obj, oIndex) =>
              oIndex === objectIndex ? { ...obj, ah: ah } : obj
            )
          }
        : unit
    )
  }
  emit('update', updatedPlatform)
}

function updateObjectAv(unitIndex: number, objectIndex: number, av: PlatformObject['av']) {
  const updatedPlatform = {
    ...props.platform,
    units: (props.platform.units || []).map((unit, uIndex) =>
      uIndex === unitIndex
        ? {
            ...unit,
            objects: unit.objects.map((obj, oIndex) =>
              oIndex === objectIndex ? { ...obj, av: av } : obj
            )
          }
        : unit
    )
  }
  emit('update', updatedPlatform)
}

function updateObjectLinkedExit(unitIndex: number, objectIndex: number, linkedExit: number | undefined) {
  const updatedPlatform = {
    ...props.platform,
    units: (props.platform.units || []).map((unit, uIndex) =>
      uIndex === unitIndex
        ? {
            ...unit,
            objects: unit.objects.map((obj, oIndex) =>
              oIndex === objectIndex ? { ...obj, linkedExit } : obj
            )
          }
        : unit
    )
  }
  emit('update', updatedPlatform)
}
</script>
