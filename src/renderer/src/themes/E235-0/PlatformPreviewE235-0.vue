<script lang="ts" setup>
import { Application, Graphics, Text, Sprite, Container, Ticker, FillGradient } from 'pixi.js';
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import type { Platform, Exit, PlatformObject } from '../../../../../types/station';
import { assetLoader } from '../../utils/assetLoader';
import { SVG_ASSETS_ARRAY } from '../../utils/svgAssets';

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
  enableAnimations: true,
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
const obj_front_y = computed(() => isDoorOpen.value ? 150 : 135);
const obj_center_y = computed(() => isDoorOpen.value ? 120 : 165);

let app: Application;
let resizeObserver: ResizeObserver;
let textures: any = null; // 缓存加载的纹理
let leftDoorContainer: Container | null = null; // 左门容器引用
let rightDoorContainer: Container | null = null; // 右门容器引用
let doorArrow: Graphics | null = null; // 门箭头引用
let doorTicker: Ticker | null = null; // 门动画专用ticker

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

const drawScene = (loadedTextures?: any) => {
  if (!app) return;

  // 使用传入的纹理或缓存的纹理
  const currentTextures = loadedTextures || textures;
  if (!currentTextures) {
    console.warn('Textures not loaded yet');
    return;
  }

  // 清除之前的内容
  app.stage.removeChildren();

  // 站台
  const platform = new Graphics()
    .rect(0, 45, CANVAS_WIDTH, 140)
    .fill(0xC0C9D0);
  app.stage.addChild(platform);
  const platformBase = new Graphics()
    .rect(0, 185, CANVAS_WIDTH, 10)
    .fill(0x607080);
  app.stage.addChild(platformBase);

  // 站台黄线
  const platformTopDashedLine = new Graphics();
  platformTopDashedLine.setStrokeStyle({
    width: 3,
    color: 0xE0E080,
  });
  for (let x = 0; x < CANVAS_WIDTH; x += 18) {
    platformTopDashedLine
      .moveTo(x, isDoorOpen.value ? 55 : 175)
      .lineTo(Math.min(x + 10, CANVAS_WIDTH), isDoorOpen.value ? 55 : 175);
  }
  platformTopDashedLine.stroke();
  app.stage.addChild(platformTopDashedLine);

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

  // 站台组件
  const unitsNum = props.platform?.units?.length || 0;
  const getUnitX = (obj: PlatformObject, centerUnitX: number, offset: number): number => {
    const ah = obj.ah;
    const direction = arrowDirection.value;

    const match = ah.match(/^(Front|Back)(\d*)$/);

    if (!match) {
      return centerUnitX;
    }

    const baseType = match[1]; // "Front" 或 "Back"
    const n = parseInt(match[2] || '0', 10);

    let sign = (direction === 'Left') ? -1 : 1;
    if (baseType === 'Back') {
      sign *= -1; // Back 类型反转符号
    }

    const stepAdjustment = sign * (n - 1) * 17.5;
    const totalAdjustment = sign * offset + stepAdjustment;

    return centerUnitX + totalAdjustment;
  };
  props.platform?.units.forEach((unit, index) => {
    const unitsLength = 936
    const centerUnitX = 12 + (isDoorOpen.value ? index + 0.5 : unitsNum - index - 0.5) * (unitsLength / unitsNum);

    if (unit.objects.length === 1) {
      if (unit.objects[0].type.startsWith('Down')) {
        const unitX = getUnitX(unit.objects[0], centerUnitX, unitsLength / 2 / unitsNum);
        const unitY = unit.objects[0].av === 'Center' ? obj_center_y.value - 12.5 : obj_front_y.value - 12.5
        const needFlip = unit.objects[0].direction === 'Opposite' && arrowDirection.value === 'Right' || unit.objects[0].direction === 'Front' && arrowDirection.value === 'Left'

        // 出口联络线
        if (unit.objects[0].linkedExit) {
          const linedExit = props.platform?.exits?.find(e => e.id === unit.objects[0].linkedExit)
          if (linedExit) {
            const exit_y = linedExit.av === 'Front' ? exit_front_y.value :
              linedExit.av === 'Center' ? exit_center_y.value :
                linedExit.av === 'Back' ? exit_back_y.value : exit_border_y.value;
            app.stage.addChild(
              new Graphics()
                .rect(unitX - 2, Math.min(exit_y, unitY), 4, Math.abs(exit_y - unitY))
                .fill(0x000000)
                .stroke({ width: 2, color: 0xFFFFFF })
            );
          }
        }

        // 主体
        app.stage.addChild(
          new Graphics()
            .rect(unitX - (needFlip ? 17.5 : 12.5), unitY - 12.5, 30, 25)
            .fill(0x808080)
        );
        const obj = unit.objects[0].type === 'DownStairs' ? new Sprite(currentTextures.downStairs) : new Sprite(currentTextures.downEscalator);
        obj.anchor.set(0.5, 0);
        obj.x = unitX;
        obj.y = unitY - 12.5;
        const aspect_ratio = obj.texture.width / obj.texture.height;
        obj.width = 35;
        obj.height = obj.width / aspect_ratio;
        if (unit.objects[0].type === 'DownEscalator') {
          obj.width = 39;
          obj.height = obj.width / aspect_ratio;
          obj.x -= (needFlip ? -2 : 2);
          obj.y -= 4;
        }
        if (needFlip) {
          obj.scale.x *= -1
        }
        app.stage.addChild(obj);
        const mask = new Graphics()
          .rect(unitX - 17.5, unitY + 12.5, 35, 30)
          .fill(0xC0C9D0)
        obj.setMask({ mask: mask, inverse: true })
      } else {
        const unitX = getUnitX(unit.objects[0], centerUnitX, unitsLength / 2 / unitsNum);
        const unitY = unit.objects[0].av === 'Center' ? obj_center_y.value - 12.5 : obj_front_y.value - 12.5
        const needFlip = unit.objects[0].direction === 'Opposite' && arrowDirection.value === 'Right' || unit.objects[0].direction === 'Front' && arrowDirection.value === 'Left'

        // 出口联络线
        if (unit.objects[0].linkedExit) {
          const linedExit = props.platform?.exits?.find(e => e.id === unit.objects[0].linkedExit)
          if (linedExit) {
            const exit_y = linedExit.av === 'Front' ? exit_front_y.value :
              linedExit.av === 'Center' ? exit_center_y.value :
                linedExit.av === 'Back' ? exit_back_y.value : exit_border_y.value;
            app.stage.addChild(
              new Graphics()
                .rect(unitX - 2, Math.min(exit_y, unitY), 4, Math.abs(exit_y - unitY))
                .fill(0x000000)
                .stroke({ width: 2, color: 0xFFFFFF })
            );
          }
        }

        // 主体
        const obj = unit.objects[0].type === 'UpStairs' ? new Sprite(currentTextures.upStairs) :
          unit.objects[0].type === 'UpEscalator' ? new Sprite(currentTextures.upEscalator)
            : new Sprite(currentTextures.elevator);
        obj.anchor.set(0.5, 1);
        obj.x = unitX;
        obj.y = unitY + (unit.objects[0].type === 'Elevator' ? 12.5 : unit.objects[0].type === 'UpEscalator' ? 32.5 : 25);
        const aspect_ratio = obj.texture.width / obj.texture.height;
        obj.width = unit.objects[0].type === 'UpEscalator' ? 40 : 35;
        obj.height = obj.width / aspect_ratio;
        if (needFlip) {
          obj.scale.x *= -1
        }
        app.stage.addChild(obj)
      }
    } else if (unit.objects.length === 2) {
      const unitX = getUnitX(unit.objects[0], centerUnitX, unitsLength / 2 / unitsNum);
      if (unit.objects[0].type.startsWith('Down') && unit.objects[1].type.startsWith('Down')) {
        const unitY = unit.objects[0].av === 'Center' ? obj_center_y.value - 12.5 : obj_front_y.value - 12.5
        const needFlip = unit.objects[0].direction === 'Opposite' && arrowDirection.value === 'Right' || unit.objects[0].direction === 'Front' && arrowDirection.value === 'Left'
        // 出口联络线
        if (unit.objects[0].linkedExit) {
          const linedExit = props.platform?.exits?.find(e => e.id === unit.objects[0].linkedExit)
          if (linedExit) {
            const exit_y = linedExit.av === 'Front' ? exit_front_y.value :
              linedExit.av === 'Center' ? exit_center_y.value :
                linedExit.av === 'Back' ? exit_back_y.value : exit_border_y.value;
            app.stage.addChild(
              new Graphics()
                .rect(unitX - 2, Math.min(exit_y, unitY), 4, Math.abs(exit_y - unitY))
                .fill(0x000000)
                .stroke({ width: 2, color: 0xFFFFFF })
            );
          }
        }

        // 主体
        app.stage.addChild(
          new Graphics()
            .rect(unitX - (needFlip ? 17.5 : 12.5), unitY - 30, 30, 42.5)
            .fill(0x808080)
        );
        const obj_0 = unit.objects[isDoorOpen.value ? 0 : 1].type === 'DownStairs' ? new Sprite(currentTextures.downStairs) : new Sprite(currentTextures.downEscalator);
        obj_0.anchor.set(0.5, 0);
        obj_0.x = unitX;
        obj_0.y = unitY - 12.5;
        const aspect_ratio_0 = obj_0.texture.width / obj_0.texture.height;
        obj_0.width = 35;
        obj_0.height = obj_0.width / aspect_ratio_0;
        if (unit.objects[isDoorOpen.value ? 0 : 1].type === 'DownEscalator') {
          obj_0.width = 39;
          obj_0.height = obj_0.width / aspect_ratio_0;
          obj_0.x -= (needFlip ? -2 : 2);
          obj_0.y -= 6;
        }
        if (needFlip) {
          obj_0.scale.x *= -1
        }
        const obj_1 = unit.objects[isDoorOpen.value ? 1 : 0].type === 'DownStairs' ? new Sprite(currentTextures.downStairs) : new Sprite(currentTextures.downEscalator);
        obj_1.anchor.set(0.5, 0);
        obj_1.x = unitX;
        obj_1.y = unitY - 30;
        const aspect_ratio_1 = obj_1.texture.width / obj_1.texture.height;
        obj_1.width = 35;
        obj_1.height = obj_1.width / aspect_ratio_1;
        if (unit.objects[isDoorOpen.value ? 1 : 0].type === 'DownEscalator') {
          obj_1.width = 39;
          obj_1.height = obj_1.width / aspect_ratio_1;
          obj_1.x -= (needFlip ? -2 : 2);
          obj_1.y -= 2;
        }
        if (needFlip) {
          obj_1.scale.x *= -1
        }
        app.stage.addChild(obj_1);
        app.stage.addChild(obj_0);
        const mask = new Graphics()
          .rect(unitX - 17.5, unitY + 12.5, 35, 30)
          .fill(0xC0C9D0)
        obj_0.setMask({ mask: mask, inverse: true })
        obj_1.setMask({ mask: mask, inverse: true })
      } else if (unit.objects[0].type.startsWith('Up') && unit.objects[1].type.startsWith('Up')) {
        const unitY = unit.objects[0].av === 'Center' ? obj_center_y.value - 12.5 : obj_front_y.value - 12.5
        const needFlip = unit.objects[0].direction === 'Opposite' && arrowDirection.value === 'Right' || unit.objects[0].direction === 'Front' && arrowDirection.value === 'Left'

        // 出口联络线
        if (unit.objects[0].linkedExit) {
          const linedExit = props.platform?.exits?.find(e => e.id === unit.objects[0].linkedExit)
          if (linedExit) {
            const exit_y = linedExit.av === 'Front' ? exit_front_y.value :
              linedExit.av === 'Center' ? exit_center_y.value :
                linedExit.av === 'Back' ? exit_back_y.value : exit_border_y.value;
            app.stage.addChild(
              new Graphics()
                .rect(unitX - 2, Math.min(exit_y, unitY), 4, Math.abs(exit_y - unitY))
                .fill(0x000000)
                .stroke({ width: 2, color: 0xFFFFFF })
            );
          }
        }

        // 主体
        const obj_0 = unit.objects[isDoorOpen.value ? 0 : 1].type === 'UpStairs' ? new Sprite(currentTextures.upStairs) : new Sprite(currentTextures.upEscalator);
        obj_0.anchor.set(0.5, 1);
        obj_0.x = unitX;
        obj_0.y = unitY + 25;
        const aspect_ratio_0 = obj_0.texture.width / obj_0.texture.height;
        obj_0.width = 35;
        obj_0.height = obj_0.width / aspect_ratio_0;
        if (needFlip) {
          obj_0.scale.x *= -1
        }
        const obj_1 = unit.objects[isDoorOpen.value ? 1 : 0].type === 'UpStairs' ? new Sprite(currentTextures.upStairs) : new Sprite(currentTextures.upEscalator);
        obj_1.anchor.set(0.5, 1);
        obj_1.x = unitX;
        obj_1.y = unitY + 10;
        const aspect_ratio_1 = obj_1.texture.width / obj_1.texture.height;
        obj_1.width = 35;
        obj_1.height = obj_1.width / aspect_ratio_1;
        if (unit.objects[isDoorOpen.value ? 1 : 0].type === 'UpEscalator') {
          obj_1.anchor.set(0, 1);
          obj_1.scale.x = 1
        }
        if (needFlip) {
          obj_1.scale.x *= -1
        }
        app.stage.addChild(obj_1);
        app.stage.addChild(obj_0);
      }
    }
  });

  // 出口位置提示
  props.platform?.exits.forEach(
    (exit) => {
      // 通过ID查找对应的出口信息
      const exitInfo = props.exits?.find(e => e.id === exit.id);
      const exit_x = isDoorOpen.value ? 12 + exit.start : 948 - exit.end;
      const exit_y = exit.av === 'Front' ? exit_front_y.value :
        exit.av === 'Center' ? exit_center_y.value :
          exit.av === 'Back' ? exit_back_y.value : exit_border_y.value;

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

  // 站台黄线
  const platformBottomDashedLine = new Graphics();
  platformBottomDashedLine.setStrokeStyle({
    width: 3,
    color: 0xE0E080,
  });
  for (let x = 0; x < CANVAS_WIDTH; x += 18) {
    platformBottomDashedLine
      .moveTo(x, isDoorOpen.value ? 175 : 55)
      .lineTo(Math.min(x + 10, CANVAS_WIDTH), isDoorOpen.value ? 175 : 55);
  }
  platformBottomDashedLine.stroke();
  app.stage.addChild(platformBottomDashedLine);

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

  // 门动画
  const doorGradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: 'rgba(255,255,255,0.5)' },
      { offset: 1, color: 'rgba(255,255,255,0)' },
    ],
  });
  const doorBase = new Graphics()
    .moveTo(135, 355)
    .lineTo(255, 355)
    .lineTo(275, 370)
    .lineTo(115, 370)
    .closePath()
    .fill(0xC0C000)
    .rect(135, 325, 120, 30)
    .fill({ fill: doorGradient, })
  app.stage.addChild(doorBase);

  // 创建门容器 - 使用 Container 而不是 Graphics
  leftDoorContainer = new Container();
  rightDoorContainer = new Container();

  // 左侧门主体 (银灰色) - 左上角圆角，中间镂空
  const cornerRadius = 4;

  // 窗口参数
  const windowWidth = 40;
  const windowHeight = 50;
  const windowRadius = 4;

  const leftWindowX = 135 + (60 - windowWidth) / 2;
  const leftWindowY = 235 + (105 - windowHeight) / 2;
  const rightWindowX = 195 + (60 - windowWidth) / 2;
  const rightWindowY = 235 + (105 - windowHeight) / 2;

  const leftDoorMask = new Graphics()
    .roundRect(leftWindowX, leftWindowY, windowWidth, windowHeight, windowRadius)
    .fill(0x000000);
  const leftDoorBody = new Graphics()
    .moveTo(135 + cornerRadius, 250) // 从左上角圆角后开始
    .lineTo(195, 250) // 顶边到右上角
    .lineTo(195, 355) // 右边到右下角
    .lineTo(135, 355) // 底边到左下角
    .lineTo(135, 250 + cornerRadius) // 左边到左上角圆角前
    .arc(135 + cornerRadius, 250 + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2) // 左上角圆角
    .closePath()
    .fill(0xE6EBF0)
    .stroke({ width: 1, color: 0x000000 })
    .roundRect(leftWindowX - 1, leftWindowY - 1, windowWidth + 2, windowHeight + 2, windowRadius)
    .fill(0x000000)
    .rect(190, 251, 4, 95)
    .fill(0xD0D000)
    .rect(135, 335, 60, 20)
    .fill('rgba(128,128,128,0.3)')
    .rect(135, 345, 60, 10)
    .fill('rgba(0,0,0,0.3)');

  leftDoorBody.setMask({ mask: leftDoorMask, inverse: true })

  // 添加白色渐变效果（从左上到右下）
  const windowGradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    colorStops: [
      { offset: 0.4, color: 'rgba(255,255,255,0)' },
      { offset: 1, color: 'rgba(255,255,255,1)' },
    ],
  });
  const leftWindowGradient = new Graphics()
    .roundRect(leftWindowX, leftWindowY, windowWidth, windowHeight, windowRadius)
    .fill({ fill: windowGradient, });

  leftDoorContainer.addChild(leftDoorMask);
  leftDoorContainer.addChild(leftDoorBody);
  leftDoorContainer.addChild(leftWindowGradient);

  // 左侧箭头 (指向左)
  const leftArrow = new Graphics()
    .moveTo(100, 307) // 箭头尖端
    .lineTo(115, 297) // 上边
    .lineTo(115, 302) // 中上
    .lineTo(125, 302) // 右上
    .lineTo(125, 312) // 右下
    .lineTo(115, 312) // 中下
    .lineTo(115, 317) // 下边
    .closePath()
    .fill(0xFFFFFF);
  if (isDoorOpen.value) leftDoorContainer.addChild(leftArrow);

  const rightDoorMask = new Graphics()
    .roundRect(rightWindowX, rightWindowY, windowWidth, windowHeight, windowRadius)
    .fill(0x000000);
  // 右侧门主体 (银灰色) - 右上角圆角，中间镂空
  const rightDoorBody = new Graphics()
    .moveTo(195, 250) // 从左上角开始
    .lineTo(255 - cornerRadius, 250) // 顶边到右上角圆角前
    .arc(255 - cornerRadius, 250 + cornerRadius, cornerRadius, -Math.PI / 2, 0) // 右上角圆角
    .lineTo(255, 355) // 右边到右下角
    .lineTo(195, 355) // 底边到左下角
    .lineTo(195, 250) // 左边回到起点
    .closePath()
    .fill(0xE6EBF0)
    .stroke({ width: 1, color: 0x000000 })
    .roundRect(rightWindowX - 1, rightWindowY - 1, windowWidth + 2, windowHeight + 2, windowRadius)
    .fill(0x000000)
    .rect(195, 251, 4, 95)
    .fill(0xD0D000)
    .rect(195, 335, 60, 20)
    .fill('rgba(128,128,128,0.3)')
    .rect(195, 345, 60, 10)
    .fill('rgba(0,0,0,0.3)');

  rightDoorBody.setMask({ mask: rightDoorMask, inverse: true })
  const rightWindowGradient = new Graphics()
    .roundRect(rightWindowX, rightWindowY, windowWidth, windowHeight, windowRadius)
    .fill({ fill: windowGradient, });

  rightDoorContainer.addChild(rightDoorMask);
  rightDoorContainer.addChild(rightDoorBody);
  rightDoorContainer.addChild(rightWindowGradient);

  // 右侧箭头 (指向右)
  const rightArrow = new Graphics()
    .moveTo(290, 307) // 箭头尖端
    .lineTo(275, 297) // 上边
    .lineTo(275, 302) // 中上
    .lineTo(265, 302) // 左上
    .lineTo(265, 312) // 左下
    .lineTo(275, 312) // 中下
    .lineTo(275, 317) // 下边
    .closePath()
    .fill(0xFFFFFF);
  if (isDoorOpen.value) rightDoorContainer.addChild(rightArrow);

  doorArrow = new Graphics()
    .moveTo(195, 337)
    .lineTo(166, 361)
    .lineTo(224, 361)
    .closePath()
    .fill(0xFFFFFF)
    .stroke({ width: 1, color: 0x000000 })
    .moveTo(195, 340)
    .lineTo(170, 360)
    .lineTo(220, 360)
    .closePath()
    .fill(0xD00000)

  doorArrow.y += 45

  const doorClose = new Graphics()
    .circle(195, 308, 30)
    .fill(0xFFFFFF)
    .stroke({ width: 1, color: 0x000000 })
    .circle(195, 308, 25)
    .fill(0xD00000)
    .rect(177, 304, 36, 8)
    .fill(0xFFFFFF)

  app.stage.addChild(leftDoorContainer);
  app.stage.addChild(rightDoorContainer);
  if (isDoorOpen.value) app.stage.addChild(doorArrow);
  else app.stage.addChild(doorClose);



  // 设置初始位置
  leftDoorContainer.x = 0;
  rightDoorContainer.x = 0;
};

let doorOffset = 0;
let arrowOffset = 0;
let waitTime = 0;

// 门动画ticker函数
const doorAnimationTicker = (ticker: Ticker) => {
  const max_offset = 40;
  if (!leftDoorContainer || !rightDoorContainer || !doorArrow) return;
  if (props.enableAnimations && isDoorOpen.value && doorOffset <= max_offset) {
    if (doorOffset !== max_offset) doorOffset += 0.5 * ticker.deltaTime;

    // 左门向左移动，右门向右移动
    leftDoorContainer.x = -Math.abs(doorOffset);
    rightDoorContainer.x = Math.abs(doorOffset);
    doorArrow.y = 45 - arrowOffset;
    if (doorOffset >= max_offset) {
      doorOffset = max_offset;
      if (arrowOffset < 45) {
        arrowOffset += 2 * ticker.deltaTime;
      } else {
        arrowOffset = 45;
      }
      waitTime += ticker.deltaTime;
      if (waitTime >= 100) {
        waitTime = 0;
        doorOffset = 0;
        arrowOffset = 0;
      }
    }
  }
};

// 启动门动画
const startDoorAnimation = () => {
  // 停止之前的ticker
  stopDoorAnimation();

  if (props.enableAnimations && isDoorOpen.value && leftDoorContainer && rightDoorContainer) {
    // 创建新的ticker
    doorTicker = new Ticker();

    // 添加动画函数
    doorTicker.add(doorAnimationTicker);

    // 启动ticker
    doorTicker.start();
  }
};

// 停止门动画
const stopDoorAnimation = () => {
  if (doorTicker) {
    doorTicker.stop();
    doorTicker.destroy();
    doorTicker = null;
  }

  // 重置门的位置
  if (leftDoorContainer && rightDoorContainer) {
    leftDoorContainer.x = 0;
    rightDoorContainer.x = 0;
  }
};

onMounted(async () => {
  if (!canvasContainer.value) return;

  app = new Application();

  // 使用全局资源管理器批量加载资源
  const loadedTextures = await assetLoader.loadMultipleTextures(SVG_ASSETS_ARRAY);

  textures = loadedTextures

  await app.init({
    background: '#ffffff',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT.value,
  });

  drawScene(textures); // 首次绘制时传入纹理
  startDoorAnimation(); // 启动门动画

  canvasContainer.value.appendChild(app.canvas);
  scaleCanvas();
  resizeObserver = new ResizeObserver(() => {
    scaleCanvas();
  });
  resizeObserver.observe(canvasContainer.value);
});

// 监听props变化并重新绘制
watch(
  () => [props.screenSide, props.carNumberDirection, props.currentCarNumber, props.platform?.doorside, props.platform?.exits, props.exits, props.enableAnimations],
  () => {
    if (app) {
      drawScene();
      startDoorAnimation(); // 重新启动动画
    }
  },
  { deep: true }
);

onUnmounted(() => {
  // 清理资源
  stopDoorAnimation();
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
