import { assetLoader } from './assetLoader';

// 字体配置
interface FontAsset {
  key: string;
  family: string;
  path: string;
}

// 项目中使用的字体配置
const FONT_ASSETS: FontAsset[] = [
  {
    key: 'meiryo',
    family: 'Meiryo',
    path: '/src/themes/Fonts/meiryo.ttc'
  },
  {
    key: 'meiryob',
    family: 'Meiryo Bold',
    path: '/src/themes/Fonts/meiryob.ttc'
  }
];

class FontManager {
  private static instance: FontManager;
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): FontManager {
    if (!FontManager.instance) {
      FontManager.instance = new FontManager();
    }
    return FontManager.instance;
  }

  /**
   * 加载所有项目字体
   */
  async loadProjectFonts(): Promise<void> {
    if (this.loaded) {
      return;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.doLoadFonts();
    return this.loadingPromise;
  }

  private async doLoadFonts(): Promise<void> {
    try {
      console.log('开始加载项目字体...');

      const fontConfigs = FONT_ASSETS.map(font => ({
        key: font.key,
        family: font.family,
        path: font.path
      }));

      await assetLoader.loadMultipleFonts(fontConfigs);

      this.loaded = true;
      console.log('项目字体加载完成');
    } catch (error) {
      console.error('字体加载失败:', error);
      this.loadingPromise = null;
      throw error;
    }
  }

  /**
   * 检查字体是否已加载
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * 获取字体
   */
  getFont(key: string): FontFace | undefined {
    return assetLoader.getFont(key);
  }

  /**
   * 检查字体是否存在
   */
  hasFont(key: string): boolean {
    return assetLoader.hasFont(key);
  }

  /**
   * 获取字体族名称
   */
  getFontFamily(key: string): string | undefined {
    const fontAsset = FONT_ASSETS.find(font => font.key === key);
    return fontAsset?.family;
  }

  /**
   * 获取所有可用的字体键
   */
  getAvailableFontKeys(): string[] {
    return FONT_ASSETS.map(font => font.key);
  }

  /**
   * 等待字体加载完成，然后在 PixiJS 中使用
   */
  async ensureFontsLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.loadProjectFonts();
    }

    // 等待一小段时间确保字体完全可用
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 导出单例实例
export const fontManager = FontManager.getInstance();

// 导出字体配置供其他地方使用
export { FONT_ASSETS };
export type { FontAsset };
