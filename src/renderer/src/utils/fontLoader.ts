/**
 * 字体加载工具
 * 加载字体文件到浏览器，让 PixiJS 可以正常使用 fontFamily
 */

interface FontAsset {
  name: string;     // 字体族名称，用于 fontFamily
  path: string;     // 字体文件路径
}

// 项目字体配置
const PROJECT_FONTS: FontAsset[] = [
  {
    name: 'Meiryo',
    path: '/src/themes/Fonts/meiryo.ttc'
  },
  {
    name: 'Meiryo Bold', 
    path: '/src/themes/Fonts/meiryob.ttc'
  }
];

class FontLoader {
  private loaded = new Set<string>();
  private loading = new Set<string>();

  /**
   * 加载单个字体
   */
  async loadFont(name: string, path: string): Promise<void> {
    if (this.loaded.has(name)) {
      return; // 已经加载过了
    }

    if (this.loading.has(name)) {
      // 正在加载中，等待完成
      while (this.loading.has(name)) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }

    this.loading.add(name);

    try {
      const fontFace = new FontFace(name, `url(${path})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      this.loaded.add(name);
      console.log(`字体加载成功: ${name}`);
    } catch (error) {
      console.error(`字体加载失败: ${name}`, error);
      throw error;
    } finally {
      this.loading.delete(name);
    }
  }

  /**
   * 加载所有项目字体
   */
  async loadAllProjectFonts(): Promise<void> {
    const loadPromises = PROJECT_FONTS.map(font => 
      this.loadFont(font.name, font.path)
    );

    try {
      await Promise.all(loadPromises);
      console.log('所有项目字体加载完成');
    } catch (error) {
      console.error('部分字体加载失败:', error);
    }
  }

  /**
   * 检查字体是否已加载
   */
  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }

  /**
   * 获取所有可用字体名称
   */
  getAvailableFonts(): string[] {
    return PROJECT_FONTS.map(font => font.name);
  }
}

// 导出单例
export const fontLoader = new FontLoader();

// 便捷函数：预加载所有字体
export async function preloadFonts(): Promise<void> {
  await fontLoader.loadAllProjectFonts();
}

// 导出字体名称常量，方便使用
export const FONT_NAMES = {
  MEIRYO: 'Meiryo',
  MEIRYO_BOLD: 'Meiryo Bold'
} as const;
