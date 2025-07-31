<script lang="ts" setup>
import { Application, Graphics, Text } from 'pixi.js';
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import type { Platform, Exit } from '../../../../../types/station';

interface Props {
  platform?: Platform;
  exits?: Exit[];
  screenSide?: 'Left' | 'Right';
  carNumberDirection?: 'Front' | 'Opposite';
  currentCarNumber?: number;
  enableAnimations?: boolean;
  showDebugInfo?: boolean;
}

interface Emits {
  (e: 'object-click', object: any): void;
  (e: 'object-hover', object: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  screenSide: 'Left',
  carNumberDirection: 'Front',
  currentCarNumber: undefined,
  enableAnimations: false,
  showDebugInfo: false
});

defineEmits<Emits>();

const canvasContainer = ref<HTMLDivElement>();

// 从平台数据获取车门开启方向，或使用默认值
const doorOpenSide = computed(() => props.platform?.doorside || 'Left');
const showDoorDirection = ref(true);

const isDoorOpen = computed(() => doorOpenSide.value === props.screenSide);
const arrowDirection = computed(() =>
  (isDoorOpen.value && doorOpenSide.value === 'Left') || (!isDoorOpen.value && props.screenSide === 'Left') ? 'Right' : 'Left'
);

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = computed(() => showDoorDirection.value ? 380 : 240);

const exit_border_y = computed(() => isDoorOpen.value ? 5 : 200);
const exit_front_y = computed(() => isDoorOpen.value ? 135 : 50);
const exit_center_y = computed(() => 92.5);
const exit_back_y = computed(() => isDoorOpen.value ? 50 : 135);

let app: Application;
let resizeObserver: ResizeObserver;

const scaleCanvas = () => {
  if (!canvasContainer.value || !app) return;

  const containerWidth = canvasContainer.value.clientWidth;
  const scale = containerWidth / CANVAS_WIDTH;

  app.canvas.style.width = `${containerWidth}px`;
  app.canvas.style.height = `${CANVAS_HEIGHT.value * scale}px`;

  canvasContainer.value.style.height = `${CANVAS_HEIGHT.value * scale}px`;
};

const textConfig = {
  door_front_open: { kanji: 'こちら側のドアが開きます', english: 'Doors on this side will open.' },
  door_opposite_open: { kanji: '反対側のドアが開きます', english: 'Doors on the opposite side will open.' }
}

const drawScene = () => {
  if (!app) return;

  // 清除之前的内容
  app.stage.removeChildren();

  // 站台
  const platform = new Graphics()
    .rect(0, 45, CANVAS_WIDTH, 140)
    .fill(0xC0C9D0);
  app.stage.addChild(platform);

  const platformTopDashedLine = new Graphics();
  platformTopDashedLine.setStrokeStyle({
    width: 3,
    color: 0xE0E080,
  });
  for (let x = 0; x < CANVAS_WIDTH; x += 18) {
    platformTopDashedLine
      .moveTo(x, 55)
      .lineTo(Math.min(x + 10, CANVAS_WIDTH), 55);
  }
  platformTopDashedLine.stroke();
  app.stage.addChild(platformTopDashedLine);

  const platformBottomDashedLine = new Graphics();
  platformBottomDashedLine.setStrokeStyle({
    width: 3,
    color: 0xE0E080,
  });
  for (let x = 0; x < CANVAS_WIDTH; x += 18) {
    platformBottomDashedLine
      .moveTo(x, 175)
      .lineTo(Math.min(x + 10, CANVAS_WIDTH), 175);
  }
  platformBottomDashedLine.stroke();
  app.stage.addChild(platformBottomDashedLine);

  const platformBase = new Graphics()
    .rect(0, 185, CANVAS_WIDTH, 10)
    .fill(0x607080);
  app.stage.addChild(platformBase);

  // 绘制车辆图案
  const totalCars = 11; // E235-0系列通常是11节车厢
  const carWidth = 75;
  const carHeight = 35;
  const carY = isDoorOpen.value ? 200 : 5;

  // 计算整个车辆组的总宽度并居中
  const totalTrainWidth = totalCars * carWidth;
  const trainStartX = (CANVAS_WIDTH - totalTrainWidth) / 2;

  const numberAccent = () => {
    if (props.carNumberDirection === 'Front') {
      return arrowDirection.value === 'Left'
    } else {
      return arrowDirection.value === 'Right'
    }
  }

  for (let i = 0; i < totalCars; i++) {
    // 根据carNumberDirection决定车厢编号顺序
    const carNumber = numberAccent() ? i + 1 : totalCars - i;
    const isCurrentCar = props.currentCarNumber === carNumber;

    const carX = trainStartX + i * carWidth;
    const borderRadius = 15; // 圆角半径

    // 判断是否为头尾车厢及其圆角位置
    const isFirstCar = i === 0;
    const isLastCar = i === totalCars - 1;

    // 绘制车厢矩形（带圆角效果）
    const carRect = new Graphics();

    if (isFirstCar && isLastCar) {
      // 如果只有一节车厢（理论情况），两端都圆角
      carRect.roundRect(carX + 2, carY, carWidth - 4, carHeight, borderRadius);
    } else if (isFirstCar) {
      // 第一节车厢，左侧圆角
      carRect
        .moveTo(carX + 2 + borderRadius, carY)
        .lineTo(carX + carWidth - 2, carY)
        .lineTo(carX + carWidth - 2, carY + carHeight)
        .lineTo(carX + 2 + borderRadius, carY + carHeight)
        .arc(carX + 2 + borderRadius, carY + carHeight - borderRadius, borderRadius, Math.PI / 2, Math.PI)
        .lineTo(carX + 2, carY + borderRadius)
        .arc(carX + 2 + borderRadius, carY + borderRadius, borderRadius, Math.PI, -Math.PI / 2)
        .closePath();
    } else if (isLastCar) {
      // 最后一节车厢，右侧圆角
      carRect
        .moveTo(carX + 2, carY)
        .lineTo(carX + carWidth - 2 - borderRadius, carY)
        .arc(carX + carWidth - 2 - borderRadius, carY + borderRadius, borderRadius, -Math.PI / 2, 0)
        .lineTo(carX + carWidth - 2, carY + carHeight - borderRadius)
        .arc(carX + carWidth - 2 - borderRadius, carY + carHeight - borderRadius, borderRadius, 0, Math.PI / 2)
        .lineTo(carX + 2, carY + carHeight)
        .closePath();
    } else {
      // 中间车厢，普通矩形
      carRect.rect(carX + 2, carY, carWidth - 4, carHeight);
    }

    carRect
      .fill(isCurrentCar ? 0xD00000 : 0xD0D9E0) // 当前车厢用红色高亮
      .stroke({ width: 2, color: 0x9F9F9F });
    app.stage.addChild(carRect);

    // 为当前车厢添加白色内描边
    if (isCurrentCar) {
      const innerStroke = new Graphics();

      if (isFirstCar && isLastCar) {
        // 如果只有一节车厢，两端都圆角
        innerStroke.roundRect(carX + 4, carY + 2, carWidth - 8, carHeight - 4, borderRadius - 2);
      } else if (isFirstCar) {
        // 第一节车厢，左侧圆角
        const innerRadius = borderRadius - 2;
        innerStroke
          .moveTo(carX + 4 + innerRadius, carY + 2)
          .lineTo(carX + carWidth - 4, carY + 2)
          .lineTo(carX + carWidth - 4, carY + carHeight - 2)
          .lineTo(carX + 4 + innerRadius, carY + carHeight - 2)
          .arc(carX + 4 + innerRadius, carY + carHeight - 2 - innerRadius, innerRadius, Math.PI / 2, Math.PI)
          .lineTo(carX + 4, carY + 2 + innerRadius)
          .arc(carX + 4 + innerRadius, carY + 2 + innerRadius, innerRadius, Math.PI, -Math.PI / 2)
          .closePath();
      } else if (isLastCar) {
        // 最后一节车厢，右侧圆角
        const innerRadius = borderRadius - 2;
        innerStroke
          .moveTo(carX + 4, carY + 2)
          .lineTo(carX + carWidth - 4 - innerRadius, carY + 2)
          .arc(carX + carWidth - 4 - innerRadius, carY + 2 + innerRadius, innerRadius, -Math.PI / 2, 0)
          .lineTo(carX + carWidth - 4, carY + carHeight - 2 - innerRadius)
          .arc(carX + carWidth - 4 - innerRadius, carY + carHeight - 2 - innerRadius, innerRadius, 0, Math.PI / 2)
          .lineTo(carX + 4, carY + carHeight - 2)
          .closePath();
      } else {
        // 中间车厢，普通矩形
        innerStroke.rect(carX + 4, carY + 2, carWidth - 8, carHeight - 4);
      }

      innerStroke.stroke({ width: 2, color: 0xFFFFFF });
      app.stage.addChild(innerStroke);
    }

    // 绘制车厢编号
    const carNumberText = new Text({
      text: carNumber.toString(),
      x: carX + carWidth / 2,
      y: carY + carHeight / 2,
      style: {
        fill: isCurrentCar ? '#ffffff' : '#333333',
        fontSize: 28,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fontStyle: 'italic'
      },
      anchor: 0.5
    });
    app.stage.addChild(carNumberText);
  }

  // 绘制方向箭头 - 简单的黑色三角形，与车辆同一水平线
  const arrowY = carY + carHeight / 2; // 与车辆中心线对齐
  const arrowSize = 30;

  if (arrowDirection.value === 'Left') {
    // 左箭头 - 出现在列车左侧空白区域，指向左
    const leftArrow = new Graphics()
      .moveTo(trainStartX - 30, arrowY) // 箭头尖端（指向左）
      .lineTo(trainStartX - 40 + arrowSize, arrowY - arrowSize / 2) // 右上角
      .lineTo(trainStartX - 40 + arrowSize, arrowY + arrowSize / 2) // 右下角
      .closePath()
      .fill(0x404040);
    app.stage.addChild(leftArrow);
  } else {
    // 右箭头 - 出现在列车右侧空白区域，指向右
    const trainEndX = trainStartX + totalTrainWidth;
    const rightArrow = new Graphics()
      .moveTo(trainEndX + 30, arrowY) // 箭头尖端（指向右）
      .lineTo(trainEndX + 40 - arrowSize, arrowY - arrowSize / 2) // 左上角
      .lineTo(trainEndX + 40 - arrowSize, arrowY + arrowSize / 2) // 左下角
      .closePath()
      .fill(0x404040);
    app.stage.addChild(rightArrow);
  }

  // 出口位置提示
  props.platform?.exits.forEach(
    (exit) => {
      // 通过ID查找对应的出口信息
      const exitInfo = props.exits?.find(e => e.id === exit.id);
      const exit_x = isDoorOpen.value ? 12 + exit.start : 948 - exit.end;
      const exit_y = exit.pos === 'Front' ? exit_front_y.value :
        exit.pos === 'Center' ? exit_center_y.value :
          exit.pos === 'Back' ? exit_back_y.value : exit_border_y.value;

          const exitContainer = new Graphics()
        .rect(exit_x, exit_y, exit.end - exit.start, 36)
        .fill(0xF0F000)
        .stroke({ width: 1, color: 0x000000 });
      app.stage.addChild(exitContainer)

      const exitTextKanji = new Text({
        text: exitInfo?.name.kanji,
        x: exit_x + (exit.end - exit.start) / 2,
        y: exit_y + 14,
        style: {
          fill: '#000000',
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: '300'
        },
        anchor: 0.5
      });
      app.stage.addChild(exitTextKanji);
      const exitTextEnglish = new Text({
        text: exitInfo?.name.english,
        x: exit_x + (exit.end - exit.start) / 2,
        y: exit_y + 28,
        style: {
          fill: '#000000',
          fontSize: 10,
          fontFamily: 'Arial',
          fontWeight: '100'
        },
        anchor: 0.5
      });
      app.stage.addChild(exitTextEnglish);
    }
  )

  // 开门提示
  const doorDirectionBg = new Graphics()
    .rect(0, 240, CANVAS_WIDTH, 140)
    .fill(isDoorOpen.value ? 0x0D50A6 : 0x000000);
  app.stage.addChild(doorDirectionBg);

  const doorDirectionKanji = new Text({
    text: isDoorOpen.value ? textConfig.door_front_open.kanji : textConfig.door_opposite_open.kanji,
    x: 650,
    y: 290,
    style: {
      fill: '#ffffff',
      fontSize: 48,
      fontFamily: 'Microsoft Sans Serif',
    },
    anchor: 0.5
  });
  app.stage.addChild(doorDirectionKanji);

  const doorDirectionEng = new Text({
    text: isDoorOpen.value ? textConfig.door_front_open.english : textConfig.door_opposite_open.english,
    x: 650,
    y: 330,
    style: {
      fill: '#ffffff',
      fontSize: 24,
      fontFamily: 'Microsoft Sans Serif',
    },
    anchor: 0.5
  });
  app.stage.addChild(doorDirectionEng);
};

onMounted(async () => {
  if (!canvasContainer.value) return;

  app = new Application();

  await app.init({
    background: '#ffffff',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT.value,
  });

  drawScene();

  canvasContainer.value.appendChild(app.canvas);
  scaleCanvas();
  resizeObserver = new ResizeObserver(() => {
    scaleCanvas();
  });
  resizeObserver.observe(canvasContainer.value);
});

// 监听props变化并重新绘制
watch(
  () => [props.screenSide, props.carNumberDirection, props.currentCarNumber, props.platform?.doorside, props.platform?.exits, props.exits],
  () => {
    if (app) {
      drawScene();
    }
  },
  { deep: true }
);

onUnmounted(() => {
  // 清理资源
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (app) {
    app.destroy();
  }
});
</script>

<template>
  <div ref="canvasContainer" style="width: 100%; overflow: hidden;" />
</template>
