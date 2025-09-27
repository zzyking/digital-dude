// 扩展Window接口以支持Webkit语音识别
declare global {
  interface Window {
    webkitSpeechRecognition: {
      new (): {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: (event: SpeechRecognitionEvent) => void;
        onerror: (event: SpeechRecognitionErrorEvent) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      }
    };
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
  
  interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
      length: number;
      [key: number]: {
        isFinal: boolean;
        [key: number]: {
          transcript: string;
        }
      }
    }
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
    message?: string;
  }
}

// 手势类型枚举
export const GestureTypes = {
  WAVE: 'wave',
  THUMBS_UP: 'thumbs_up',
  PEACE: 'peace',
  POINT: 'point',
  THINKING: 'thinking',
  GOODBYE: 'goodbye',
  NONE: 'none'
} as const;

export type GestureType = typeof GestureTypes[keyof typeof GestureTypes];

// 消息类型接口
export interface Message {
  type: 'user' | 'ai';
  text: string;
  timestamp: number;
}

// 系统统计信息接口
export interface SystemStats {
  fps: number;
  latency: number;
  cpu: number;
  memory: number;
  network: string;
  webgl: boolean;
}

// AI响应数据接口
export interface AIResponse {
  text: string;
  emotion: EmotionType;
  gesture: GestureType;
}

// 3D数字人组件props接口
export interface DigitalHuman3DProps {
  emotion: EmotionType;
  gesture: GestureType;
  isAnimating: boolean;
}

// 媒体控制组件props接口
export interface MediaControlsProps {
  onToggleCamera: () => void;
  onToggleMic: () => void;
  cameraEnabled: boolean;
  micEnabled: boolean;
}

// 语音识别组件props接口
export interface VoiceRecognitionProps {
  isListening: boolean;
  onTextReceived: (text: string) => void;
}

// 手势识别组件props接口
export interface GestureRecognitionProps {
  videoStream: MediaStream | null;
  onGestureDetected: (gesture: GestureType) => void;
}

// 聊天界面组件props接口
export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

// 技术状态监控组件props接口
export interface TechStatusMonitorProps {
  stats: SystemStats;
}

// Canvas绘制尺寸接口
export interface CanvasDimensions {
  width: number;
  height: number;
}


// API配置接口
export interface APIConfig {
  accessToken: string;
  faceDetectionUrl: string;
  gestureRecognitionUrl: string;
}

export default {};