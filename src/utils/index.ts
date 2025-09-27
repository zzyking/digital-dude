
// 语音合成函数
export const speakText = (text: string): void => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }
};

// 初始化媒体流的异步函数
export const initializeMediaStream = async (
  cameraEnabled: boolean, 
  micEnabled: boolean
): Promise<MediaStream | null> => {
  try {
    if (cameraEnabled) {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: micEnabled 
      });
      return stream;
    }
    return null;
  } catch (error) {
    console.error('媒体访问失败:', error);
    throw new Error('无法访问摄像头或麦克风，请检查权限设置');
  }
};

// 停止媒体流
export const stopMediaStream = (stream: MediaStream | null): void => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};


// 导出Vite检测客户端
export {
  ViteDetectionClient,
  detectionClient,
  detectFaces,
  detectGestures,
  batchDetect,
  getCacheStatus,
  clearCache
} from './viteDetectionClient';