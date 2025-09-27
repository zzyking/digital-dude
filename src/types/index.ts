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

// 消息类型接口
export interface Message {
  type: 'user' | 'ai';
  text: string;
  timestamp: number;
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

// 聊天界面组件props接口
export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export default {};