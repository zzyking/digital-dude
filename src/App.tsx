import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Video, VideoOff, Mic, MicOff } from 'lucide-react';

// 导入组件
import DigitalHumanWebRTC from './components/DigitalHumanWebRTC';
import VoiceRecognition from './components/VoiceRecognition';
import VisionRecognition from './components/VisionRecognition';
import ChatInterface from './components/ChatInterface';

// 导入类型和工具
import type { Message } from './types';
import { initializeMediaStream, stopMediaStream } from './utils';

// 主应用组件
const DigitalHumanApp = () => {
  // 状态管理
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [currentExpression, setCurrentExpression] = useState<string>('');
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [sessionId, setSessionId] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      text: '你好！我是你的AI数字助手，可以通过语音、手势和文字与你交流。',
      timestamp: Date.now()
    }
  ]);
  // 媒体流管理
  const handleMediaStream = useCallback(async () => {
    try {
      if (cameraEnabled && !videoStream) {
        const stream = await initializeMediaStream(cameraEnabled, micEnabled);
        setVideoStream(stream);
      } else if (!cameraEnabled && videoStream) {
        stopMediaStream(videoStream);
        setVideoStream(null);
      }
    } catch (error) {
      console.error('媒体访问失败:', error);
      alert('无法访问摄像头或麦克风，请检查权限设置');
    }
  }, [cameraEnabled, micEnabled, videoStream]);

  useEffect(() => {
    handleMediaStream();
  }, [handleMediaStream]);


  // 处理用户输入
  const handleUserMessage = useCallback((text: string) => {
    // 构建前缀信息用于发送到后端
    const contextParts = [];
    if (currentExpression) contextParts.push(`表情:${currentExpression}`);
    if (currentEmotion) contextParts.push(`情绪:${currentEmotion}`);
    if (currentGesture) contextParts.push(`手势:${currentGesture}`);

    // 将表情、情绪、手势信息拼接到输入开头，仅用于后端发送
    const contextPrefix = contextParts.length > 0 ? `[${contextParts.join(',')}] ` : '';
    const messageTextForBackend = contextPrefix + text;

    console.log('发送到后端的消息:', messageTextForBackend);

    // 前端显示的消息不包含表情、情绪、手势信息
    const userMessage: Message = {
      type: 'user',
      text: text, // 只显示原始输入文本
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);

    // 发送到后端的消息包含表情、情绪、手势信息
    fetch('/human', {
      body: JSON.stringify({
        text: messageTextForBackend, // 发送包含前缀的完整消息
        type: 'chat',
        interrupt: true,
        sessionid: sessionId,
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    }).then(response => {
      if (response.ok) {
        console.log('Message sent successfully');
      } else {
        console.error('Failed to send message');
      }
    }).catch(error => {
      console.error('Error sending message:', error);
    });
  }, [sessionId, currentExpression, currentEmotion, currentGesture]);

  // 处理手势识别
  const handleGestureDetected = useCallback((gesture: any) => {
    // console.log('检测到手势:', gesture);
    setCurrentGesture(gesture);

    // 可以根据需要发送手势信息到后端
    if (gesture.includes('wave') || gesture.includes('挥手')) {
      const greetingMessage: Message = {
        type: 'ai',
        text: '我看到你在挥手！你好呀！',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, greetingMessage]);
    }
  }, []);

  // 处理人脸识别
  const handleFaceDetected = useCallback((faces: any) => {
    // console.log('检测到人脸:', faces);

    // 提取表情和情绪信息
    if (faces && typeof faces === 'object') {
      if (faces.expression) {
        setCurrentExpression(faces.expression.type);
      }
      if (faces.emotion) {
        setCurrentEmotion(faces.emotion.type);
      }
    }
  }, []);

  // 处理语音输入
  const handleVoiceInput = useCallback((text: string) => {
    // console.log('语音识别结果:', text);
    handleUserMessage(text);
  }, [handleUserMessage]);

  return (
    <div className="min-h-screen bg-slate-900 relative pb-6">
      <div className="p-6 pb-0">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            多模态数字人交互系统
          </h1>
          <p className="text-gray-400">
            支持语音、手势、文字多种交互方式的智能数字助手
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-screen lg:max-h-[calc(100vh-200px)]">
            {/* 左侧：数字人显示区 */}
            <div className="lg:col-span-1">
              <div className="card-glass p-6 min-h-96 lg:h-full flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">数字人助手</h2>
                
                {/* 数字人视频容器 - 填充剩余空间 */}
                <div className="flex-1 mb-4">
                  <DigitalHumanWebRTC 
                    isConnected={isConnected}
                    onConnectionStateChange={setConnectionState}
                    onSessionIdChange={setSessionId}
                  />
                </div>
                
                {/* 控制按钮 - 3列网格布局 */}
                <div className="grid grid-cols-3 gap-3">
                  {/* 摄像头开关 */}
                  <button
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg text-white transition-colors ${
                      cameraEnabled 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {cameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                    <span className="text-xs">摄像头</span>
                  </button>
                  
                  {/* 麦克风开关 */}
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg text-white transition-colors ${
                      micEnabled 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                    <span className="text-xs">麦克风</span>
                  </button>
                  
                  {/* 连接控制 */}
                  <button
                    onClick={() => setIsConnected(!isConnected)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg font-medium transition-colors ${
                      connectionState === 'connected'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : connectionState === 'connecting'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {connectionState === 'connected' ? 
                      <Pause size={16} /> : 
                      <Play size={16} />
                    }
                    <span className="text-xs">
                      {connectionState === 'connected' ? '断开' :
                       connectionState === 'connecting' ? '连接中' : '连接'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 中间：智能对话 */}
            <div className="lg:col-span-1">
              <div className="min-h-96 lg:h-full lg:max-h-full overflow-hidden">
                <ChatInterface 
                  messages={messages}
                  onSendMessage={handleUserMessage}
                />
              </div>
            </div>

            {/* 右侧：视觉识别和语音识别 */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* 视觉识别 (人脸+手势) */}
              <div className="h-48 lg:flex-1">
                <VisionRecognition
                  videoStream={videoStream}
                  onFaceDetected={handleFaceDetected}
                  onGestureDetected={handleGestureDetected}
                  useRealAPI={true}
                />
              </div>

              {/* 语音识别 */}
              <div className="min-h-32 lg:flex-1">
                <VoiceRecognition
                  isListening={micEnabled}
                  onTextReceived={handleVoiceInput}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalHumanApp;