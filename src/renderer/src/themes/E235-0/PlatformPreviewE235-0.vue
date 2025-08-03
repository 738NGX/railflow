<script lang="ts" setup>
import { Application, Graphics, Text, Sprite, Container, Ticker, FillGradient, SpriteOptions, Texture, TextureSource } from 'pixi.js';
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import type { Platform, Exit, PlatformObject } from '../../../../../types/station';
import { assetLoader } from '../../utils/assetLoader';
import { SVG_ASSETS_ARRAY } from '../../utils/svgAssets';
import { loadProjectFonts } from '../../utils/fontText';

// === 接口定义 ===
interface Props {
  platform?: Platform;
  exits?: Exit[];
  screenSide?: 'Left' | 'Right';
  carNumberDirection?: 'Front' | 'Opposite';
  currentCarNumber?: number;
  enableAnimations?: boolean;
  showDebugInfo?: boolean;
  canvasWidth?: number; // 新增：允许外部控制画布宽度
}

interface Emits {
  (e: 'object-click', object: any): void;
  (e: 'object-hover', object: any): void;
}

interface RenderConfig {
  canvas: {
    baseWidth: number;
    baseHeight: number;
    actualWidth: number;
    actualHeight: number;
    scale: number;
  };
  colors: {
    platform: number;
    platformBase: number;
    yellowLine: number;
    carNormal: number;
    carCurrent: number;
    carBorder: number;
    carInnerStroke: number;
    exitBackground: number;
    exitBorder: number;
    doorOpenBackground: number;
    doorCloseBackground: number;
    doorBody: number;
    doorYellow: number;
    doorArrow: number;
    trainArrow: number;
  };
  dimensions: {
    platform: { y: number; height: number; baseY: number; baseHeight: number };
    train: { totalCars: number; carWidth: number; carHeight: number; borderRadius: number };
    exit: { height: number };
    door: { width: number; height: number; windowWidth: number; windowHeight: number; windowRadius: number; cornerRadius: number };
    dash: { width: number; segmentLength: number; gapLength: number };
    arrow: { size: number; offset: number };
  };
  text: {
    carNumber: { fontSize: number; fontFamily: string; fontWeight: string; fontStyle: string };
    exit: { kanji: { fontSize: number; fontFamily: string }; english: { fontSize: number; fontFamily: string } };
    door: { kanji: { fontSize: number; fontFamily: string }; english: { fontSize: number; fontFamily: string } };
  };
  animation: {
    door: { maxOffset: number; speed: number; arrowSpeed: number; waitTime: number };
  };
}

// === Props 和 Emits ===
const props = withDefaults(defineProps<Props>(), {
  screenSide: 'Left',
  carNumberDirection: 'Front',
  currentCarNumber: undefined,
  enableAnimations: true,
  showDebugInfo: false,
  canvasWidth: 960
});

defineEmits<Emits>();

// === 响应式引用 ===
const canvasContainer = ref<HTMLDivElement>();
const showDoorDirection = ref(true);

// === 计算属性 ===
const doorOpenSide = computed(() => props.platform?.doorside || 'Left');
const isDoorOpen = computed(() => doorOpenSide.value === props.screenSide);
const arrowDirection = computed(() =>
  (isDoorOpen.value && doorOpenSide.value === 'Left') || (!isDoorOpen.value && props.screenSide === 'Left') ? 'Right' : 'Left'
);

// === 渲染配置 ===
const renderConfig = computed<RenderConfig>(() => {
  const baseWidth = 960;
  const baseHeight = showDoorDirection.value ? 380 : 240;
  const scale = props.canvasWidth! / baseWidth;

  return {
    canvas: {
      baseWidth,
      baseHeight,
      actualWidth: props.canvasWidth!,
      actualHeight: Math.round(baseHeight * scale),
      scale
    },
    colors: {
      platform: 0xC0C9D0,
      platformBase: 0x607080,
      yellowLine: 0xE0E080,
      carNormal: 0xD0D9E0,
      carCurrent: 0xD00000,
      carBorder: 0x9F9F9F,
      carInnerStroke: 0xFFFFFF,
      exitBackground: 0xF0F000,
      exitBorder: 0x000000,
      doorOpenBackground: 0x0D50A6,
      doorCloseBackground: 0x000000,
      doorBody: 0xE6EBF0,
      doorYellow: 0xD0D000,
      doorArrow: 0xFFFFFF,
      trainArrow: 0x404040
    },
    dimensions: {
      platform: {
        y: 45,
        height: 140,
        baseY: 185,
        baseHeight: 10
      },
      train: {
        totalCars: 11,
        carWidth: 75,
        carHeight: 35,
        borderRadius: 15
      },
      exit: {
        height: 36
      },
      door: {
        width: 120,
        height: 105,
        windowWidth: 40,
        windowHeight: 50,
        windowRadius: 4,
        cornerRadius: 4
      },
      dash: {
        width: 3,
        segmentLength: 10,
        gapLength: 8
      },
      arrow: {
        size: 30,
        offset: 30
      }
    },
    text: {
      carNumber: {
        fontSize: 28,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fontStyle: 'italic'
      },
      exit: {
        kanji: { fontSize: 16, fontFamily: 'Meiryo' },
        english: { fontSize: 10.5, fontFamily: 'Meiryo' }
      },
      door: {
        kanji: { fontSize: 48, fontFamily: 'Meiryo UI' },
        english: { fontSize: 24, fontFamily: 'Meiryo UI' }
      }
    },
    animation: {
      door: {
        maxOffset: 40,
        speed: 0.5 * scale,
        arrowSpeed: 2 * scale,
        waitTime: 100
      }
    }
  };
});

// === 位置计算 ===
const positions = computed(() => {
  const config = renderConfig.value;
  const scale = config.canvas.scale;

  return {
    exitBorderY: (isDoorOpen.value ? 5 : 200) * scale,
    exitFrontY: (isDoorOpen.value ? 135 : 50) * scale,
    exitCenterY: 92.5 * scale,
    exitBackY: (isDoorOpen.value ? 50 : 135) * scale,
    objectFrontY: (isDoorOpen.value ? 150 : 135) * scale,
    objectCenterY: (isDoorOpen.value ? 120 : 165) * scale,
    trainY: (isDoorOpen.value ? 200 : 5) * scale,
    platformTopLineY: (isDoorOpen.value ? 55 : 175) * scale,
    platformBottomLineY: (isDoorOpen.value ? 175 : 55) * scale,
    doorSectionY: 240 * scale
  };
});

// === 文本配置 ===
const textConfig = {
  door_front_open: { kanji: 'こちら側のドアが開きます', english: 'Doors on this side will open.' },
  door_opposite_open: { kanji: '反対側のドアが開きます', english: 'Doors on the opposite side will open.' }
};

// === PIXI.js 应用和容器 ===
let app: Application;
let resizeObserver: ResizeObserver;
let textures: any = null;
let leftDoorContainer: Container | null = null;
let rightDoorContainer: Container | null = null;
let doorArrow: Graphics | null = null;
let doorTicker: Ticker | null = null;

// === 动画状态 ===
let doorOffset = 0;
let arrowOffset = 0;
let waitTime = 0;

// === 工具函数 ===
const scaleValue = (value: number): number => value * renderConfig.value.canvas.scale;

const scaleCanvas = () => {
  if (!canvasContainer.value || !app) return;

  const containerWidth = canvasContainer.value.clientWidth;
  const config = renderConfig.value;
  const scale = containerWidth / config.canvas.actualWidth;

  app.canvas.style.width = `${containerWidth}px`;
  app.canvas.style.height = `${config.canvas.actualHeight * scale}px`;
  canvasContainer.value.style.height = `${config.canvas.actualHeight * scale}px`;
};

// === 绘制工具函数 ===
const createDashedLine = (startX: number, endX: number, y: number, config: { width: number; color: number; segmentLength: number; gapLength: number }): Graphics => {
  const line = new Graphics();
  line.setStrokeStyle({ width: scaleValue(config.width), color: config.color });

  const totalSegment = config.segmentLength + config.gapLength;
  for (let x = startX; x < endX; x += scaleValue(totalSegment)) {
    const segmentEnd = Math.min(x + scaleValue(config.segmentLength), endX);
    line.moveTo(x, y).lineTo(segmentEnd, y);
  }
  line.stroke();
  return line;
};

const createTrainArrow = (direction: 'Left' | 'Right', centerY: number, offsetX: number): Graphics => {
  const config = renderConfig.value;
  const size = scaleValue(config.dimensions.arrow.size);
  const arrowColor = config.colors.trainArrow;

  const arrow = new Graphics();

  if (direction === 'Left') {
    arrow
      .moveTo(offsetX - scaleValue(30), centerY)
      .lineTo(offsetX - scaleValue(40) + size, centerY - size / 2)
      .lineTo(offsetX - scaleValue(40) + size, centerY + size / 2)
      .closePath()
      .fill(arrowColor);
  } else {
    arrow
      .moveTo(offsetX + scaleValue(30), centerY)
      .lineTo(offsetX + scaleValue(40) - size, centerY - size / 2)
      .lineTo(offsetX + scaleValue(40) - size, centerY + size / 2)
      .closePath()
      .fill(arrowColor);
  }

  return arrow;
};

const getCarNumberOrder = (): boolean => {
  if (props.carNumberDirection === 'Front') {
    return arrowDirection.value === 'Left';
  } else {
    return arrowDirection.value === 'Right';
  }
};

const getExitY = (exit: any): number => {
  const pos = positions.value;
  switch (exit.av) {
    case 'Front': return pos.exitFrontY;
    case 'Center': return pos.exitCenterY;
    case 'Back': return pos.exitBackY;
    default: return pos.exitBorderY;
  }
};

const getObjectY = (object: any): number => {
  const pos = positions.value;
  return object.av === 'Center' ? pos.objectCenterY : pos.objectFrontY;
};

const getUnitX = (obj: PlatformObject, centerUnitX: number, offset: number): number => {
  const ah = obj.ah;
  const direction = arrowDirection.value;
  const match = ah.match(/^(Front|Back)(\d*)$/);

  if (!match) {
    return centerUnitX;
  }

  const baseType = match[1];
  const n = parseInt(match[2] || '0', 10);
  let sign = (direction === 'Left') ? -1 : 1;

  if (baseType === 'Back') {
    sign *= -1;
  }

  const stepAdjustment = sign * (n - 1) * scaleValue(17.5);
  const totalAdjustment = sign * offset + stepAdjustment;
  return centerUnitX + totalAdjustment;
};

const drawScene = (loadedTextures?: any) => {
  if (!app) return;

  const currentTextures = loadedTextures || textures;
  if (!currentTextures) {
    console.warn('Textures not loaded yet');
    return;
  }

  const config = renderConfig.value;
  const pos = positions.value;

  // 清除之前的内容
  app.stage.removeChildren();

  // === 绘制站台 ===
  drawPlatform(config, pos);

  // === 绘制车辆 ===
  drawTrain(config, pos);

  // === 绘制站台组件 ===
  drawPlatformObjects(config, pos, currentTextures);

  // === 绘制出口 ===
  drawExits(config);

  // === 绘制开门提示 ===
  if (showDoorDirection.value) {
    drawDoorDirection(config, pos);
    drawDoorAnimation(config, pos);
  }
};

const drawPlatform = (config: RenderConfig, pos: any) => {
  const { canvas, colors, dimensions } = config;

  // 站台主体
  const platform = new Graphics()
    .rect(0, scaleValue(dimensions.platform.y), canvas.actualWidth, scaleValue(dimensions.platform.height))
    .fill(colors.platform);
  app.stage.addChild(platform);

  // 站台底座
  const platformBase = new Graphics()
    .rect(0, scaleValue(dimensions.platform.baseY), canvas.actualWidth, scaleValue(dimensions.platform.baseHeight))
    .fill(colors.platformBase);
  app.stage.addChild(platformBase);

  // 站台黄线
  const topDashedLine = createDashedLine(
    0,
    canvas.actualWidth,
    pos.platformTopLineY,
    {
      width: dimensions.dash.width,
      color: colors.yellowLine,
      segmentLength: dimensions.dash.segmentLength,
      gapLength: dimensions.dash.gapLength
    }
  );
  app.stage.addChild(topDashedLine);

  const bottomDashedLine = createDashedLine(
    0,
    canvas.actualWidth,
    pos.platformBottomLineY,
    {
      width: dimensions.dash.width,
      color: colors.yellowLine,
      segmentLength: dimensions.dash.segmentLength,
      gapLength: dimensions.dash.gapLength
    }
  );
  app.stage.addChild(bottomDashedLine);
};

const drawTrain = (config: RenderConfig, pos: any) => {
  const { canvas, colors, dimensions, text } = config;
  const { totalCars, carWidth, carHeight, borderRadius } = dimensions.train;

  const scaledCarWidth = scaleValue(carWidth);
  const scaledCarHeight = scaleValue(carHeight);
  const scaledBorderRadius = scaleValue(borderRadius);
  const totalTrainWidth = totalCars * scaledCarWidth;
  const trainStartX = (canvas.actualWidth - totalTrainWidth) / 2;
  const numberOrder = getCarNumberOrder();

  // 绘制车厢
  for (let i = 0; i < totalCars; i++) {
    const carNumber = numberOrder ? i + 1 : totalCars - i;
    const isCurrentCar = props.currentCarNumber === carNumber;
    const carX = trainStartX + i * scaledCarWidth;
    const isFirstCar = i === 0;
    const isLastCar = i === totalCars - 1;

    // 绘制车厢主体
    const carRect = createCarShape(carX, pos.trainY, scaledCarWidth, scaledCarHeight, scaledBorderRadius, isFirstCar, isLastCar);
    carRect
      .fill(isCurrentCar ? colors.carCurrent : colors.carNormal)
      .stroke({ width: scaleValue(2), color: colors.carBorder });
    app.stage.addChild(carRect);

    // 为当前车厢添加内描边
    if (isCurrentCar) {
      const innerStroke = createCarShape(
        carX + scaleValue(2),
        pos.trainY + scaleValue(2),
        scaledCarWidth - scaleValue(4),
        scaledCarHeight - scaleValue(4),
        scaledBorderRadius - scaleValue(2),
        isFirstCar,
        isLastCar
      );
      innerStroke.stroke({ width: scaleValue(2), color: colors.carInnerStroke });
      app.stage.addChild(innerStroke);
    }

    // 绘制车厢编号
    const carNumberText = new Text({
      text: String(carNumber),
      style: {
        fill: isCurrentCar ? '#ffffff' : '#333333',
        fontSize: scaleValue(text.carNumber.fontSize),
        fontFamily: text.carNumber.fontFamily,
        fontWeight: text.carNumber.fontWeight as any,
        fontStyle: text.carNumber.fontStyle as any
      }
    });
    carNumberText.x = carX + scaledCarWidth / 2;
    carNumberText.y = pos.trainY + scaledCarHeight / 2;
    carNumberText.anchor.set(0.5);
    app.stage.addChild(carNumberText);
  }

  // 绘制方向箭头
  const arrowY = pos.trainY + scaledCarHeight / 2;
  const arrow = createTrainArrow(arrowDirection.value, arrowY, arrowDirection.value === 'Left' ? trainStartX : trainStartX + totalTrainWidth);
  app.stage.addChild(arrow);
};

const createCarShape = (x: number, y: number, width: number, height: number, radius: number, isFirst: boolean, isLast: boolean): Graphics => {
  const shape = new Graphics();

  if (isFirst && isLast) {
    shape.roundRect(x + scaleValue(2), y, width - scaleValue(4), height, radius);
  } else if (isFirst) {
    shape
      .moveTo(x + scaleValue(2) + radius, y)
      .lineTo(x + width - scaleValue(2), y)
      .lineTo(x + width - scaleValue(2), y + height)
      .lineTo(x + scaleValue(2) + radius, y + height)
      .arc(x + scaleValue(2) + radius, y + height - radius, radius, Math.PI / 2, Math.PI)
      .lineTo(x + scaleValue(2), y + radius)
      .arc(x + scaleValue(2) + radius, y + radius, radius, Math.PI, -Math.PI / 2)
      .closePath();
  } else if (isLast) {
    shape
      .moveTo(x + scaleValue(2), y)
      .lineTo(x + width - scaleValue(2) - radius, y)
      .arc(x + width - scaleValue(2) - radius, y + radius, radius, -Math.PI / 2, 0)
      .lineTo(x + width - scaleValue(2), y + height - radius)
      .arc(x + width - scaleValue(2) - radius, y + height - radius, radius, 0, Math.PI / 2)
      .lineTo(x + scaleValue(2), y + height)
      .closePath();
  } else {
    shape.rect(x + scaleValue(2), y, width - scaleValue(4), height);
  }

  return shape;
};

const drawPlatformObjects = (_config: RenderConfig, _pos: any, currentTextures: any) => {
  if (!props.platform?.units) return;

  const unitsNum = props.platform.units.length;
  const unitsLength = scaleValue(936);

  props.platform.units.forEach((unit, index) => {
    const centerUnitX = scaleValue(12) + (isDoorOpen.value ? index + 0.5 : unitsNum - index - 0.5) * (unitsLength / unitsNum);

    if (unit.objects.length === 1) {
      drawSingleObject(unit.objects[0], centerUnitX, unitsLength / unitsNum / 2, currentTextures);
    } else if (unit.objects.length === 2) {
      drawDoubleObject(unit.objects, centerUnitX, unitsLength / unitsNum / 2, currentTextures);
    } else if (unit.objects.length === 3) {
      drawThreeObject(unit.objects, centerUnitX, unitsLength / unitsNum / 2, currentTextures);
    } else {
      //
    }
  });
};

const drawSingleObject = (obj: PlatformObject, centerUnitX: number, offset: number, currentTextures: any, customUnitX?: number, customUnitY?: number) => {
  const unitX = customUnitX ?? getUnitX(obj, centerUnitX, offset);
  const unitY = customUnitY ?? getObjectY(obj) - scaleValue(12.5);
  const needFlip = shouldFlipObject(obj);

  // 绘制出口联络线
  if (obj.linkedExit) {
    drawExitLink(obj, unitX, unitY);
  }

  if (obj.type.startsWith('Down')) {
    drawDownObject(obj, unitX, unitY, needFlip, currentTextures);
  } else {
    drawUpObject(obj, unitX, unitY, needFlip, currentTextures);
  }
};

const drawDoubleObject = (objects: PlatformObject[], centerUnitX: number, offset: number, currentTextures: any, customUnitX?: number, customUnitY?: number) => {
  const unitX = customUnitX ?? getUnitX(objects[0], centerUnitX, offset);
  const unitY = customUnitY ?? getObjectY(objects[0]) - scaleValue(12.5);
  const needFlip = shouldFlipObject(objects[0]);


  if (objects[0].type.startsWith('Down') && objects[1].type.startsWith('Down')) {
    if (objects[0].linkedExit) {
      drawExitLink(objects[0], unitX, unitY);
    }
    if (objects[1].linkedExit) {
      drawExitLink(objects[1], unitX, unitY);
    }
    drawDoubleDownObject(objects, unitX, unitY, needFlip, currentTextures);
  } else if (objects[0].type.startsWith('Up') && objects[1].type.startsWith('Up')) {
    if (objects[0].linkedExit) {
      drawExitLink(objects[0], unitX, unitY);
    }
    if (objects[1].linkedExit) {
      drawExitLink(objects[1], unitX, unitY);
    }
    drawDoubleUpObject(objects, unitX, unitY, needFlip, currentTextures);
  } else if (objects[0].type === 'Elevator') {
    drawSingleObject(objects[0], centerUnitX, offset, currentTextures, unitX, scaleValue(isDoorOpen.value ? 155 : 105))
    drawSingleObject(objects[1], centerUnitX, offset, currentTextures, unitX, scaleValue(isDoorOpen.value ? 100 : 145))
  } else if (objects[1].type === 'Elevator') {
    drawSingleObject(objects[1], centerUnitX, offset, currentTextures, unitX, scaleValue(isDoorOpen.value ? 155 : 105))
    drawSingleObject(objects[0], centerUnitX, offset, currentTextures, unitX, scaleValue(isDoorOpen.value ? 100 : 145))
  } else {
    //
  }
};

const drawThreeObject = (objects: PlatformObject[], centerUnitX: number, offset: number, currentTextures: any) => {
  const unitX = getUnitX(objects[0], centerUnitX, offset);

  if (objects[0].type === 'Elevator') {
    drawSingleObject(objects[0], centerUnitX, offset, currentTextures, unitX, scaleValue(isDoorOpen.value ? 155 : 95))
    if (
      objects[1].type.startsWith('Down') && objects[2].type.startsWith('Down') ||
      objects[1].type.startsWith('Up') && objects[2].type.startsWith('Up')
    ) {
      drawDoubleObject(objects.slice(1), centerUnitX, offset, currentTextures, unitX, scaleValue(isDoorOpen.value ? 100 : 155));
    }
  } else if (objects[2].type === 'Elevator') {
    drawSingleObject(objects[2], centerUnitX, offset, currentTextures, unitX, scaleValue(isDoorOpen.value ? 155 : 100))
    if (
      objects[0].type.startsWith('Down') && objects[1].type.startsWith('Down') ||
      objects[0].type.startsWith('Up') && objects[1].type.startsWith('Up')
    ) {
      drawDoubleObject(objects.slice(0, 2), centerUnitX, offset, currentTextures, unitX, scaleValue(isDoorOpen.value ? 100 : 155));
    }
  }
};

const shouldFlipObject = (obj: PlatformObject): boolean => {
  return (obj.direction === 'Opposite' && arrowDirection.value === 'Right') ||
    (obj.direction === 'Front' && arrowDirection.value === 'Left');
};

const drawExitLink = (obj: PlatformObject, unitX: number, unitY: number) => {
  if (!obj.linkedExit || !props.platform?.exits) return;

  const linkedExit = props.platform.exits.find(e => e.id === obj.linkedExit);
  if (!linkedExit) return;

  const exitY = getExitY(linkedExit);
  const linkGraphics = new Graphics()
    .rect(unitX - scaleValue(3), Math.min(exitY, unitY), scaleValue(6), Math.abs(exitY - unitY))
    .fill(0xFFFFFF)
    .rect(unitX - scaleValue(1), Math.min(exitY, unitY), scaleValue(2), Math.abs(exitY - unitY))
    .fill(0x000000);

  app.stage.addChild(linkGraphics);
};

const drawDownObject = (obj: PlatformObject, unitX: number, unitY: number, needFlip: boolean, currentTextures: any) => {
  // 主体背景
  const background = new Graphics()
    .rect(unitX - (needFlip ? scaleValue(17.5) : scaleValue(12.5)), unitY - scaleValue(12.5), scaleValue(30), scaleValue(25))
    .fill(0x808080);
  app.stage.addChild(background);

  // 创建对象精灵
  const sprite = createObjectSprite(obj, currentTextures, needFlip);
  sprite.x = unitX;
  sprite.y = unitY - scaleValue(12.5);

  if (obj.type === 'DownEscalator') {
    sprite.x -= needFlip ? scaleValue(-2) : scaleValue(2);
    sprite.y -= scaleValue(4);
  }

  app.stage.addChild(sprite);

  // 创建遮罩
  const mask = new Graphics()
    .rect(unitX - scaleValue(17.5), unitY + scaleValue(12.5), scaleValue(35), scaleValue(30))
    .fill(0xC0C9D0);
  sprite.setMask({ mask: mask, inverse: true });
};

const drawUpObject = (obj: PlatformObject, unitX: number, unitY: number, needFlip: boolean, currentTextures: any) => {
  const sprite = createObjectSprite(obj, currentTextures, needFlip);
  sprite.x = unitX;
  sprite.y = unitY + (obj.type === 'Elevator' ? scaleValue(12.5) : obj.type === 'UpEscalator' ? scaleValue(32.5) : scaleValue(25));
  app.stage.addChild(sprite);
};

const drawDoubleDownObject = (objects: PlatformObject[], unitX: number, unitY: number, needFlip: boolean, currentTextures: any) => {
  // 主体背景
  const background = new Graphics()
    .rect(unitX - (needFlip ? scaleValue(17.5) : scaleValue(12.5)), unitY - scaleValue(30), scaleValue(30), scaleValue(42.5))
    .fill(0x808080);
  app.stage.addChild(background);

  // 绘制两个对象
  const obj0 = createObjectSprite(objects[isDoorOpen.value ? 0 : 1], currentTextures, needFlip);
  const obj1 = createObjectSprite(objects[isDoorOpen.value ? 1 : 0], currentTextures, needFlip);

  obj0.x = unitX;
  obj0.y = unitY - scaleValue(12.5);
  obj1.x = unitX;
  obj1.y = unitY - scaleValue(30);

  // 调整扶梯位置
  if (objects[isDoorOpen.value ? 0 : 1].type === 'DownEscalator') {
    obj0.x -= needFlip ? scaleValue(-2) : scaleValue(2);
    obj0.y -= scaleValue(6);
  }
  if (objects[isDoorOpen.value ? 1 : 0].type === 'DownEscalator') {
    obj1.x -= needFlip ? scaleValue(-2) : scaleValue(2);
    obj1.y -= scaleValue(2);
  }

  app.stage.addChild(obj1);
  app.stage.addChild(obj0);

  // 创建遮罩
  const mask = new Graphics()
    .rect(unitX - scaleValue(17.5), unitY + scaleValue(12.5), scaleValue(35), scaleValue(30))
    .fill(0xC0C9D0);
  obj0.setMask({ mask: mask, inverse: true });
  obj1.setMask({ mask: mask, inverse: true });
};

const drawDoubleUpObject = (objects: PlatformObject[], unitX: number, unitY: number, needFlip: boolean, currentTextures: any) => {
  console.log('drawDoubleUpObject', objects, unitX, unitY, needFlip);
  const obj0 = createObjectSprite(objects[isDoorOpen.value ? 0 : 1], currentTextures, needFlip, true);
  const obj1 = createObjectSprite(objects[isDoorOpen.value ? 1 : 0], currentTextures, needFlip);

  obj0.x = unitX;
  obj0.y = unitY + scaleValue(32.5);
  obj1.x = unitX;
  obj1.y = unitY + (objects[isDoorOpen.value ? 1 : 0].type === 'UpStairs' ? scaleValue(10) : scaleValue(17.5));

  app.stage.addChild(obj1);
  app.stage.addChild(obj0);
};

const createObjectSprite = (obj: PlatformObject, currentTextures: any, needFlip: boolean, needSmall: boolean = false): Sprite => {
  let texture: SpriteOptions | Texture<TextureSource<any>> | undefined;
  switch (obj.type) {
    case 'DownStairs': texture = currentTextures.downStairs; break;
    case 'DownEscalator': texture = currentTextures.downEscalator; break;
    case 'UpStairs': texture = currentTextures.upStairs; break;
    case 'UpEscalator': texture = currentTextures.upEscalator; break;
    case 'Elevator': texture = currentTextures.elevator; break;
    default: texture = currentTextures.upStairs; break;
  }
  if (needSmall && obj.type === 'UpStairs') texture = currentTextures.upStairsSmall;

  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, obj.type.startsWith('Down') ? 0 : 1);

  const aspectRatio = sprite.texture.width / sprite.texture.height;
  const baseWidth = obj.type === 'UpEscalator' || obj.type === 'DownEscalator' ? 39 : 35;
  sprite.width = scaleValue(baseWidth);
  sprite.height = sprite.width / aspectRatio;

  if (needFlip) {
    sprite.scale.x *= -1;
  }

  return sprite;
};

const drawExits = (config: RenderConfig) => {
  if (!props.platform?.exits || !props.exits) return;

  const { colors, text } = config;

  props.platform.exits.forEach(exit => {
    const exitInfo = props.exits?.find(e => e.id === exit.id);
    const exitX = isDoorOpen.value ? scaleValue(12 + exit.start) : scaleValue(948 - exit.end);
    const exitY = getExitY(exit);
    const exitWidth = scaleValue(exit.end - exit.start);
    const exitHeight = scaleValue(36);

    // 出口背景
    const exitContainer = new Graphics()
      .rect(exitX, exitY, exitWidth, exitHeight)
      .fill(colors.exitBackground)
      .stroke({ width: scaleValue(1), color: colors.exitBorder });
    app.stage.addChild(exitContainer);

    // 出口文字
    if (exitInfo) {
      const kanjiText = new Text({
        text: exitInfo.name.kanji,
        style: {
          fill: '#000000',
          fontSize: scaleValue(text.exit.kanji.fontSize * exit.fontScale),
          fontFamily: text.exit.kanji.fontFamily,
        }
      });
      kanjiText.x = exitX + exitWidth / 2;
      kanjiText.y = exitY + scaleValue(8 + exit.fontScale * 4);
      kanjiText.anchor.set(0.5);
      app.stage.addChild(kanjiText);

      const englishText = new Text({
        text: exitInfo.name.english,
        style: {
          fill: '#000000',
          fontSize: scaleValue(text.exit.english.fontSize * exit.fontScale),
          fontFamily: text.exit.english.fontFamily,
        }
      });
      englishText.x = exitX + exitWidth / 2;
      englishText.y = exitY + scaleValue(12 + exit.fontScale * 16);
      englishText.anchor.set(0.5);
      app.stage.addChild(englishText);
    }
  });
};

const drawDoorDirection = (config: RenderConfig, pos: any) => {
  const { colors, text } = config;

  // 开门提示背景
  const doorDirectionBg = new Graphics()
    .rect(0, pos.doorSectionY, config.canvas.actualWidth, scaleValue(140))
    .fill(isDoorOpen.value ? colors.doorOpenBackground : colors.doorCloseBackground);
  app.stage.addChild(doorDirectionBg);

  // 开门提示文字
  const doorText = isDoorOpen.value ? textConfig.door_front_open : textConfig.door_opposite_open;

  const kanjiText = new Text({
    text: doorText.kanji,
    style: {
      fill: '#ffffff',
      fontSize: scaleValue(text.door.kanji.fontSize),
      fontFamily: text.door.kanji.fontFamily,
    }
  });
  kanjiText.x = scaleValue(650);
  kanjiText.y = pos.doorSectionY + scaleValue(50);
  kanjiText.anchor.set(0.5);
  app.stage.addChild(kanjiText);

  const englishText = new Text({
    text: doorText.english,
    style: {
      fill: '#ffffff',
      fontSize: scaleValue(text.door.english.fontSize),
      fontFamily: text.door.english.fontFamily,
    }
  });
  englishText.x = scaleValue(650);
  englishText.y = pos.doorSectionY + scaleValue(90);
  englishText.anchor.set(0.5);
  app.stage.addChild(englishText);
};

const drawDoorAnimation = (config: RenderConfig, pos: any) => {
  const { colors } = config;

  // 门基座
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
    .moveTo(scaleValue(135), pos.doorSectionY + scaleValue(115))
    .lineTo(scaleValue(255), pos.doorSectionY + scaleValue(115))
    .lineTo(scaleValue(275), pos.doorSectionY + scaleValue(130))
    .lineTo(scaleValue(115), pos.doorSectionY + scaleValue(130))
    .closePath()
    .fill(colors.doorYellow)
    .rect(scaleValue(135), pos.doorSectionY + scaleValue(85), scaleValue(120), scaleValue(30))
    .fill({ fill: doorGradient });
  app.stage.addChild(doorBase);

  // 创建门容器
  leftDoorContainer = createDoorContainer('left', config, pos);
  rightDoorContainer = createDoorContainer('right', config, pos);

  app.stage.addChild(leftDoorContainer);
  app.stage.addChild(rightDoorContainer);

  // 门箭头或关闭标志
  if (isDoorOpen.value) {
    doorArrow = createDoorArrow(config, pos);
    doorArrow.y += scaleValue(45);
    app.stage.addChild(doorArrow);
  } else {
    const doorClose = createDoorCloseSymbol(config, pos);
    app.stage.addChild(doorClose);
  }
};

const createDoorContainer = (side: 'left' | 'right', config: RenderConfig, pos: any): Container => {
  const container = new Container();
  const { colors, dimensions } = config;
  const { windowWidth, windowHeight, windowRadius, cornerRadius } = dimensions.door;

  const isLeft = side === 'left';
  const doorX = isLeft ? scaleValue(135) : scaleValue(195);
  const doorY = pos.doorSectionY + scaleValue(10);
  const doorWidth = scaleValue(60);
  const doorHeight = scaleValue(105);

  const windowX = doorX + (doorWidth - scaleValue(windowWidth)) / 2;
  const windowY = doorY + (doorHeight - scaleValue(windowHeight)) / 5;

  // 窗口遮罩
  const windowMask = new Graphics()
    .roundRect(windowX, windowY, scaleValue(windowWidth), scaleValue(windowHeight), scaleValue(windowRadius))
    .fill(0x000000);

  // 门体
  const doorBody = new Graphics();
  if (isLeft) {
    // 左门 - 左上角圆角
    doorBody
      .moveTo(doorX + scaleValue(cornerRadius), doorY)
      .lineTo(doorX + doorWidth, doorY)
      .lineTo(doorX + doorWidth, doorY + doorHeight)
      .lineTo(doorX, doorY + doorHeight)
      .lineTo(doorX, doorY + scaleValue(cornerRadius))
      .arc(doorX + scaleValue(cornerRadius), doorY + scaleValue(cornerRadius), scaleValue(cornerRadius), Math.PI, -Math.PI / 2)
      .closePath();
  } else {
    // 右门 - 右上角圆角
    doorBody
      .moveTo(doorX, doorY)
      .lineTo(doorX + doorWidth - scaleValue(cornerRadius), doorY)
      .arc(doorX + doorWidth - scaleValue(cornerRadius), doorY + scaleValue(cornerRadius), scaleValue(cornerRadius), -Math.PI / 2, 0)
      .lineTo(doorX + doorWidth, doorY + doorHeight)
      .lineTo(doorX, doorY + doorHeight)
      .closePath();
  }

  doorBody
    .fill(colors.doorBody)
    .stroke({ width: scaleValue(1), color: colors.exitBorder })
    .roundRect(windowX - scaleValue(1), windowY - scaleValue(1), scaleValue(windowWidth + 2), scaleValue(windowHeight + 2), scaleValue(windowRadius))
    .fill(colors.exitBorder)
    .rect(doorX + (isLeft ? doorWidth - scaleValue(5) : 0), doorY + scaleValue(1), scaleValue(4), doorHeight - scaleValue(10))
    .fill(colors.doorYellow)
    .rect(doorX, doorY + doorHeight - scaleValue(20), doorWidth, scaleValue(20))
    .fill('rgba(128,128,128,0.3)')
    .rect(doorX, doorY + doorHeight - scaleValue(10), doorWidth, scaleValue(10))
    .fill('rgba(0,0,0,0.3)');

  doorBody.setMask({ mask: windowMask, inverse: true });

  // 窗口渐变
  const windowGradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    colorStops: [
      { offset: 0.4, color: 'rgba(255,255,255,0)' },
      { offset: 1, color: 'rgba(255,255,255,1)' },
    ],
  });
  const windowGradientGraphics = new Graphics()
    .roundRect(windowX, windowY, scaleValue(windowWidth), scaleValue(windowHeight), scaleValue(windowRadius))
    .fill({ fill: windowGradient });

  container.addChild(windowMask);
  container.addChild(doorBody);
  container.addChild(windowGradientGraphics);

  // 门箭头
  if (isDoorOpen.value) {
    const arrow = createDirectionArrow(isLeft ? 'left' : 'right', doorX + doorWidth / 2, doorY + doorHeight / 2, config);
    container.addChild(arrow);
  }

  return container;
};

const createDirectionArrow = (direction: 'left' | 'right', centerX: number, centerY: number, config: RenderConfig): Graphics => {
  const arrow = new Graphics();
  const offset = scaleValue(direction === 'left' ? -50 : 50);
  const arrowX = centerX + offset;

  arrow
    .moveTo(arrowX + (direction === 'left' ? scaleValue(-15) : scaleValue(15)), centerY)
    .lineTo(arrowX + (direction === 'left' ? 0 : 0), centerY - scaleValue(12))
    .lineTo(arrowX + (direction === 'left' ? 0 : 0), centerY - scaleValue(6))
    .lineTo(arrowX + (direction === 'left' ? scaleValue(10) : scaleValue(-10)), centerY - scaleValue(6))
    .lineTo(arrowX + (direction === 'left' ? scaleValue(10) : scaleValue(-10)), centerY + scaleValue(6))
    .lineTo(arrowX + (direction === 'left' ? 0 : 0), centerY + scaleValue(6))
    .lineTo(arrowX + (direction === 'left' ? 0 : 0), centerY + scaleValue(12))
    .closePath()
    .fill(config.colors.doorArrow);

  return arrow;
};

const createDoorArrow = (config: RenderConfig, pos: any): Graphics => {
  const arrow = new Graphics()
    .moveTo(scaleValue(195), pos.doorSectionY + scaleValue(97))
    .lineTo(scaleValue(165), pos.doorSectionY + scaleValue(122))
    .lineTo(scaleValue(225), pos.doorSectionY + scaleValue(122))
    .closePath()
    .fill(config.colors.doorArrow)
    .stroke({ width: scaleValue(1), color: config.colors.exitBorder })
    .moveTo(scaleValue(195), pos.doorSectionY + scaleValue(100))
    .lineTo(scaleValue(170), pos.doorSectionY + scaleValue(120))
    .lineTo(scaleValue(220), pos.doorSectionY + scaleValue(120))
    .closePath()
    .fill(config.colors.carCurrent);

  return arrow;
};

const createDoorCloseSymbol = (config: RenderConfig, pos: any): Graphics => {
  const symbol = new Graphics()
    .circle(scaleValue(195), pos.doorSectionY + scaleValue(68), scaleValue(30))
    .fill(config.colors.doorArrow)
    .stroke({ width: scaleValue(1), color: config.colors.exitBorder })
    .circle(scaleValue(195), pos.doorSectionY + scaleValue(68), scaleValue(25))
    .fill(config.colors.carCurrent)
    .rect(scaleValue(177), pos.doorSectionY + scaleValue(64), scaleValue(36), scaleValue(8))
    .fill(config.colors.doorArrow);

  return symbol;
};

// === 门动画系统 ===
const doorAnimationTicker = (ticker: Ticker) => {
  const config = renderConfig.value;
  const maxOffset = scaleValue(config.animation.door.maxOffset);

  if (!leftDoorContainer || !rightDoorContainer || !doorArrow) return;

  if (props.enableAnimations && isDoorOpen.value && doorOffset <= maxOffset) {
    if (doorOffset !== maxOffset) {
      doorOffset += config.animation.door.speed * ticker.deltaTime;
    }

    leftDoorContainer.x = -Math.abs(doorOffset);
    rightDoorContainer.x = Math.abs(doorOffset);

    if (doorArrow) {
      doorArrow.y = scaleValue(45) - arrowOffset;
    }

    if (doorOffset >= maxOffset) {
      doorOffset = maxOffset;
      if (arrowOffset < scaleValue(45)) {
        arrowOffset += config.animation.door.arrowSpeed * ticker.deltaTime;
      } else {
        arrowOffset = scaleValue(45);
      }
      waitTime += ticker.deltaTime;
      if (waitTime >= config.animation.door.waitTime) {
        waitTime = 0;
        doorOffset = 0;
        arrowOffset = 0;
      }
    }
  }
};

const startDoorAnimation = () => {
  stopDoorAnimation();

  if (props.enableAnimations && isDoorOpen.value && leftDoorContainer && rightDoorContainer) {
    doorTicker = new Ticker();
    doorTicker.add(doorAnimationTicker);
    doorTicker.start();
  }
};

const stopDoorAnimation = () => {
  if (doorTicker) {
    doorTicker.stop();
    doorTicker.destroy();
    doorTicker = null;
  }

  if (leftDoorContainer && rightDoorContainer) {
    leftDoorContainer.x = 0;
    rightDoorContainer.x = 0;
  }
};

// === 生命周期钩子 ===
onMounted(async () => {
  if (!canvasContainer.value) return;

  app = new Application();

  const loadedTextures = await assetLoader.loadMultipleTextures(SVG_ASSETS_ARRAY);
  await loadProjectFonts();

  textures = loadedTextures;

  await app.init({
    background: '#ffffff',
    width: renderConfig.value.canvas.actualWidth,
    height: renderConfig.value.canvas.actualHeight,
  });

  drawScene(textures);
  startDoorAnimation();

  canvasContainer.value.appendChild(app.canvas);
  scaleCanvas();

  resizeObserver = new ResizeObserver(() => {
    scaleCanvas();
  });
  resizeObserver.observe(canvasContainer.value);
});

watch(
  () => [
    props.screenSide,
    props.carNumberDirection,
    props.currentCarNumber,
    props.platform?.doorside,
    props.platform?.exits,
    props.exits,
    props.enableAnimations,
    props.canvasWidth
  ],
  () => {
    if (app) {
      drawScene();
      startDoorAnimation();
    }
  },
  { deep: true }
);

onUnmounted(() => {
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
