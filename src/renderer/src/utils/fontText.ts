/**
 * 字体预加载工具
 * 预加载字体后，可以在 PixiJS 中直接使用 fontFamily
 */
import { preloadFonts, FONT_NAMES } from './fontLoader';

// 预加载所有项目字体
export async function loadProjectFonts(): Promise<void> {
  await preloadFonts();
}

// 导出字体名称供使用
export { FONT_NAMES };
