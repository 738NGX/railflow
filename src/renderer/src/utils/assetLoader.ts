import { Assets } from 'pixi.js';

interface TextureCache {
  [key: string]: any;
}

interface FontCache {
  [key: string]: FontFace;
}

interface AssetConfig {
  path: string;
  key: string;
  url?: string; // 用于已导入的资源 URL
}

interface FontConfig {
  path: string;
  key: string;
  family: string; // 字体族名称
  url?: string; // 用于已导入的字体 URL
}

class AssetLoader {
  private static instance: AssetLoader;
  private cache: TextureCache = {};
  private fontCache: FontCache = {};
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private fontLoadingPromises: Map<string, Promise<FontFace>> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  async loadTexture(pathOrUrl: string, key?: string): Promise<any> {
    const cacheKey = key || pathOrUrl;

    // 如果已经缓存，直接返回
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    // 如果正在加载，返回正在进行的Promise
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // 开始加载
    const loadingPromise = Assets.load(pathOrUrl).then(texture => {
      this.cache[cacheKey] = texture;
      this.loadingPromises.delete(cacheKey);
      return texture;
    }).catch(error => {
      this.loadingPromises.delete(cacheKey);
      throw error;
    });

    this.loadingPromises.set(cacheKey, loadingPromise);
    return loadingPromise;
  }

  async loadFont(pathOrUrl: string, family: string, key?: string): Promise<FontFace> {
    const cacheKey = key || family;

    // 如果已经缓存，直接返回
    if (this.fontCache[cacheKey]) {
      return this.fontCache[cacheKey];
    }

    // 如果正在加载，返回正在进行的Promise
    if (this.fontLoadingPromises.has(cacheKey)) {
      return this.fontLoadingPromises.get(cacheKey)!;
    }

    // 开始加载字体
    const loadingPromise = this.loadFontFromUrl(pathOrUrl, family).then(fontFace => {
      this.fontCache[cacheKey] = fontFace;
      this.fontLoadingPromises.delete(cacheKey);
      return fontFace;
    }).catch(error => {
      this.fontLoadingPromises.delete(cacheKey);
      throw error;
    });

    this.fontLoadingPromises.set(cacheKey, loadingPromise);
    return loadingPromise;
  }

  private async loadFontFromUrl(url: string, family: string): Promise<FontFace> {
    try {
      // 创建 FontFace 对象
      const fontFace = new FontFace(family, `url(${url})`);
      
      // 加载字体
      const loadedFont = await fontFace.load();
      
      // 将字体添加到文档的字体集合中
      document.fonts.add(loadedFont);
      
      return loadedFont;
    } catch (error) {
      console.error(`Failed to load font from ${url}:`, error);
      throw error;
    }
  }

  async loadMultipleTextures(assets: AssetConfig[]): Promise<TextureCache> {
    const promises = assets.map(async asset => {
      const url = asset.url || asset.path;
      const texture = await this.loadTexture(url, asset.key);
      return { key: asset.key, texture };
    });

    const results = await Promise.all(promises);
    const textureMap: TextureCache = {};

    results.forEach(({ key, texture }) => {
      textureMap[key] = texture;
    });

    return textureMap;
  }

  async loadMultipleFonts(fonts: FontConfig[]): Promise<FontCache> {
    const promises = fonts.map(async font => {
      const url = font.url || font.path;
      const fontFace = await this.loadFont(url, font.family, font.key);
      return { key: font.key, fontFace };
    });

    const results = await Promise.all(promises);
    const fontMap: FontCache = {};

    results.forEach(({ key, fontFace }) => {
      fontMap[key] = fontFace;
    });

    return fontMap;
  }

  getTexture(key: string): any {
    return this.cache[key];
  }

  hasTexture(key: string): boolean {
    return key in this.cache;
  }

  getFont(key: string): FontFace | undefined {
    return this.fontCache[key];
  }

  hasFont(key: string): boolean {
    return key in this.fontCache;
  }

  clearCache(): void {
    this.cache = {};
    this.fontCache = {};
    this.loadingPromises.clear();
    this.fontLoadingPromises.clear();
  }
}

// 导出单例实例和类型
export const assetLoader = AssetLoader.getInstance();
export type { TextureCache, FontCache, AssetConfig, FontConfig };
