<template>
  <div class="space-y-4">
    <!-- 站台预览 -->
    <div class="mb-6">
      <h4 class="text-sm font-medium mb-3">站台布局预览</h4>
      <PlatformPreview
        :platform="platform"
        :exits="exits"
      />
    </div>

    <el-form label-position="top">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <el-form-item label="日文名称">
          <el-input
            :model-value="platform.name.kanji"
            @input="updateName('kanji', $event)"
          />
        </el-form-item>
        <el-form-item label="英文名称">
          <el-input
            :model-value="platform.name.english"
            @input="updateName('english', $event)"
          />
        </el-form-item>
      </div>

      <el-form-item label="车门开启方向">
        <el-select
          :model-value="platform.doorside"
          @change="updateDoorside($event)"
        >
          <el-option label="左侧" value="Left" />
          <el-option label="右侧" value="Right" />
        </el-select>
      </el-form-item>

      <!-- 站台块管理 -->
      <el-form-item label="站台块">
        <div class="space-y-4 w-full">
          <div
            v-for="(block, blockIndex) in platform.blocks"
            :key="blockIndex"
            class="border border-gray-200 rounded p-4"
          >
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-medium">块 {{ blockIndex + 1 }}</h4>
              <el-button
                type="danger"
                size="small"
                @click="removeBlock(blockIndex)"
              >
                删除块
              </el-button>
            </div>

            <el-form-item label="关联出口" class="mb-3">
              <el-select
                :model-value="block.exit"
                @change="updateBlockExit(blockIndex, $event)"
              >
                <el-option
                  v-for="exit in exits"
                  :key="exit.id"
                  :label="`出口 ${exit.id}: ${exit.name.kanji}`"
                  :value="exit.id"
                />
              </el-select>
            </el-form-item>

            <!-- 站台单元管理 -->
            <div class="mt-4">
              <div class="flex justify-between items-center mb-2">
                <h5 class="text-sm font-medium">站台单元</h5>
                <el-button
                  type="primary"
                  size="small"
                  @click="addUnit(blockIndex)"
                >
                  添加单元
                </el-button>
              </div>

              <div
                v-for="(unit, unitIndex) in block.units"
                :key="unitIndex"
                class="border border-gray-100 rounded p-3 mb-2"
              >
                <div class="flex justify-between items-center mb-2">
                  <h6 class="text-xs font-medium">单元 {{ unitIndex + 1 }}</h6>
                  <el-button
                    type="danger"
                    size="small"
                    @click="removeUnit(blockIndex, unitIndex)"
                  >
                    删除单元
                  </el-button>
                </div>

                <!-- 站台对象管理 -->
                <div class="ml-3">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs">对象</span>
                    <el-button
                      type="primary"
                      size="small"
                      @click="addObject(blockIndex, unitIndex)"
                    >
                      添加对象
                    </el-button>
                  </div>

                  <div
                    v-for="(object, objectIndex) in unit.objects"
                    :key="objectIndex"
                    class="flex gap-2 items-center mb-2"
                  >
                    <el-select
                      :model-value="object.type"
                      placeholder="类型"
                      class="w-32"
                      @change="updateObjectType(blockIndex, unitIndex, objectIndex, $event)"
                    >
                      <el-option label="下楼梯" value="DownStairs" />
                      <el-option label="上楼梯" value="UpStairs" />
                      <el-option label="下扶梯" value="DownEscalator" />
                      <el-option label="上扶梯" value="UpEscalator" />
                      <el-option label="电梯" value="Elevator" />
                    </el-select>

                    <el-select
                      :model-value="object.direction"
                      placeholder="方向"
                      class="w-24"
                      @change="updateObjectDirection(blockIndex, unitIndex, objectIndex, $event)"
                    >
                      <el-option label="前方" value="Front" />
                      <el-option label="对面" value="Opposite" />
                    </el-select>

                    <el-select
                      :model-value="object.pos"
                      placeholder="位置"
                      class="w-24"
                      @change="updateObjectPos(blockIndex, unitIndex, objectIndex, $event)"
                    >
                      <el-option label="前部" value="Front" />
                      <el-option label="中部" value="Center" />
                      <el-option label="后部" value="Back" />
                    </el-select>

                    <el-button
                      type="danger"
                      size="small"
                      @click="removeObject(blockIndex, unitIndex, objectIndex)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <el-button
            type="primary"
            size="small"
            @click="addBlock"
          >
            添加站台块
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
import type { Exit, Platform, PlatformObject } from '../../../../../types/station'
import PlatformPreview from '../../components/PlatformPreview.vue'
import {
  ElForm,
  ElFormItem,
  ElInput,
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

function addBlock() {
  const newBlock = {
    exit: 1, // 默认关联第一个出口
    units: []
  }

  const updatedPlatform = {
    ...props.platform,
    blocks: [...props.platform.blocks, newBlock]
  }
  emit('update', updatedPlatform)
}

function removeBlock(blockIndex: number) {
  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.filter((_, index) => index !== blockIndex)
  }
  emit('update', updatedPlatform)
}

function updateBlockExit(blockIndex: number, exitId: number) {
  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.map((block, index) =>
      index === blockIndex ? { ...block, exit: exitId } : block
    )
  }
  emit('update', updatedPlatform)
}

function addUnit(blockIndex: number) {
  const newUnit = {
    objects: []
  }

  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.map((block, index) =>
      index === blockIndex
        ? { ...block, units: [...block.units, newUnit] }
        : block
    )
  }
  emit('update', updatedPlatform)
}

function removeUnit(blockIndex: number, unitIndex: number) {
  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.map((block, index) =>
      index === blockIndex
        ? { ...block, units: block.units.filter((_, uIndex) => uIndex !== unitIndex) }
        : block
    )
  }
  emit('update', updatedPlatform)
}

function addObject(blockIndex: number, unitIndex: number) {
  const newObject: PlatformObject = {
    type: 'DownStairs',
    direction: 'Front',
    pos: 'Center'
  }

  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.map((block, bIndex) =>
      bIndex === blockIndex
        ? {
            ...block,
            units: block.units.map((unit, uIndex) =>
              uIndex === unitIndex
                ? { ...unit, objects: [...unit.objects, newObject] }
                : unit
            )
          }
        : block
    )
  }
  emit('update', updatedPlatform)
}

function removeObject(blockIndex: number, unitIndex: number, objectIndex: number) {
  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.map((block, bIndex) =>
      bIndex === blockIndex
        ? {
            ...block,
            units: block.units.map((unit, uIndex) =>
              uIndex === unitIndex
                ? { ...unit, objects: unit.objects.filter((_, oIndex) => oIndex !== objectIndex) }
                : unit
            )
          }
        : block
    )
  }
  emit('update', updatedPlatform)
}

function updateObjectType(blockIndex: number, unitIndex: number, objectIndex: number, type: PlatformObject['type']) {
  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.map((block, bIndex) =>
      bIndex === blockIndex
        ? {
            ...block,
            units: block.units.map((unit, uIndex) =>
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
        : block
    )
  }
  emit('update', updatedPlatform)
}

function updateObjectDirection(blockIndex: number, unitIndex: number, objectIndex: number, direction: PlatformObject['direction']) {
  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.map((block, bIndex) =>
      bIndex === blockIndex
        ? {
            ...block,
            units: block.units.map((unit, uIndex) =>
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
        : block
    )
  }
  emit('update', updatedPlatform)
}

function updateObjectPos(blockIndex: number, unitIndex: number, objectIndex: number, pos: PlatformObject['pos']) {
  const updatedPlatform = {
    ...props.platform,
    blocks: props.platform.blocks.map((block, bIndex) =>
      bIndex === blockIndex
        ? {
            ...block,
            units: block.units.map((unit, uIndex) =>
              uIndex === unitIndex
                ? {
                    ...unit,
                    objects: unit.objects.map((obj, oIndex) =>
                      oIndex === objectIndex ? { ...obj, pos } : obj
                    )
                  }
                : unit
            )
          }
        : block
    )
  }
  emit('update', updatedPlatform)
}
</script>
