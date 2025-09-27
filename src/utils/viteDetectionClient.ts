
/**
 * 使用Vite配置中的检测端点的API客户端
 */
export class ViteDetectionClient {
  /**
   * 将图片源转换为Base64
   */
  private async sourceToBase64(source: File | HTMLCanvasElement | HTMLVideoElement): Promise<string> {
    if (source instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(source);
      });
    }
    
    if (source instanceof HTMLCanvasElement) {
      return source.toDataURL('image/jpeg', 0.8).split(',')[1];
    }
    
    if (source instanceof HTMLVideoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = source.videoWidth;
      canvas.height = source.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(source, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    }
    
    throw new Error('不支持的图片源类型');
  }

  /**
   * 人脸检测
   */
  async detectFaces(
    source: File | HTMLCanvasElement | HTMLVideoElement,
    accessToken: string,
    faceFields: string = 'age,gender,expression,emotion'
  ){
    const image = await this.sourceToBase64(source);
    
    const response = await fetch('/api/detect/face', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        access_token: accessToken,
        face_field: faceFields
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '人脸检测失败');
    }

    return response.json();
  }

  /**
   * 手势检测
   */
  async detectGestures(
    source: File | HTMLCanvasElement | HTMLVideoElement,
    accessToken: string
  ){
    const image = await this.sourceToBase64(source);
    
    const response = await fetch('/api/detect/gesture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        access_token: accessToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '手势检测失败');
    }

    return response.json();
  }

  /**
   * 批量检测
   */
  async batchDetect(
    sources: Array<{ id?: string; data: string }>,
    accessToken: string,
    detectionType: 'face' | 'gesture' | 'both' = 'both'
  ) {
    const response = await fetch('/api/detect/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: sources,
        access_token: accessToken,
        detection_type: detectionType
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '批量检测失败');
    }

    return response.json();
  }

  /**
   * 获取缓存状态
   */
  async getCacheStatus() {
    const response = await fetch('/api/cache/status');
    return response.json();
  }

  /**
   * 清除缓存
   */
  async clearCache() {
    const response = await fetch('/api/cache/clear');
    return response.json();
  }

  /**
   * 批量转换图片源为Base64
   */
  async convertSourcesToBase64(
    sources: (File | HTMLCanvasElement | HTMLVideoElement)[],
    ids?: string[]
  ) {
    const results = [];
    
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const base64 = await this.sourceToBase64(source);
      results.push({
        id: ids?.[i] || `image_${i}`,
        data: base64
      });
    }
    
    return results;
  }
}

// 创建客户端实例
export const detectionClient = new ViteDetectionClient();

// 导出便捷函数
export const detectFaces = (
  source: File | HTMLCanvasElement | HTMLVideoElement,
  accessToken: string,
  faceFields?: string
) => detectionClient.detectFaces(source, accessToken, faceFields);

export const detectGestures = (
  source: File | HTMLCanvasElement | HTMLVideoElement,
  accessToken: string
) => detectionClient.detectGestures(source, accessToken);

export const batchDetect = (
  sources: Array<{ id?: string; data: string }>,
  accessToken: string,
  detectionType?: 'face' | 'gesture' | 'both'
) => detectionClient.batchDetect(sources, accessToken, detectionType);

export const getCacheStatus = () => detectionClient.getCacheStatus();
export const clearCache = () => detectionClient.clearCache();