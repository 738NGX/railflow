import { Assets } from 'pixi.js';

interface TextureCache {
  [key: string]: any;
}

interface AssetConfig {
  path: string;
  key: string;
  url?: string; // 用于已导入的资源 URL
}

class AssetLoader {
  private static instance: AssetLoader;
  private cache: TextureCache = {};
  private loadingPromises: Map<string, Promise<any>> = new Map();

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

  getTexture(key: string): any {
    return this.cache[key];
  }

  hasTexture(key: string): boolean {
    return key in this.cache;
  }

  clearCache(): void {
    this.cache = {};
    this.loadingPromises.clear();
  }
}

// 导出单例实例
export const assetLoader = AssetLoader.getInstance();
