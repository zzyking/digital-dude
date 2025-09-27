import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useXunfei } from '../hooks/useXunfei';
import type { VoiceRecognitionProps } from '../types';

const VoiceRecognition = ({ isListening, onTextReceived }: VoiceRecognitionProps) => {
  const { transcript, recording, connecting, connected, startRecording, stopRecording } = useXunfei();

  const [audioLevels, setAudioLevels] = useState({ volume: 0 });
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const startRecordingRef = useRef(startRecording);
  const stopRecordingRef = useRef(stopRecording);
  
  const VOLUME_UPDATE_INTERVAL = 100; // 音量指示器更新间隔(毫秒)

  // 更新refs
  useEffect(() => {
    startRecordingRef.current = startRecording;
    stopRecordingRef.current = stopRecording;
  }, [startRecording, stopRecording]);

  // 当 isListening 状态改变时，控制录音开始/停止
  useEffect(() => {
    if (isListening && !recording) {
      startRecordingRef.current();
    } else if (!isListening && recording) {
      console.log("停止录音 from isListening false");
      stopRecordingRef.current();
    }
  }, [isListening, recording]);


  // 管理音频电平显示
  useEffect(() => {
    if (!isListening) {
      // 清理资源
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setAudioLevels({ volume: 0 });
      return;
    }

    // 分析音频音量的函数（仅用于显示电平）
    const analyzeAudio = () => {
      if (!analyserRef.current || !isListening) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      // 计算RMS音量
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const sample = (dataArray[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const volume = Math.min(1, rms * 10);

      // 限制音量指示器更新频率
      const currentTime = Date.now();
      if (currentTime - lastUpdateTimeRef.current >= VOLUME_UPDATE_INTERVAL) {
        setAudioLevels({ volume });
        lastUpdateTimeRef.current = currentTime;
      }

      if (isListening) {
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
    };

    // 初始化音频分析（仅用于电平显示）
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // 开始分析
        analyzeAudio();
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initAudio();

    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isListening]);

  // 当有新的转录文本时，调用回调函数（只有最终结果才发送）
  useEffect(() => {
    if (transcript.text && transcript.text.trim() && transcript.isFinal && (!["。", "？"].includes(transcript.text.trim()) )) {
      onTextReceived(transcript.text);
    }
  }, [transcript.text, transcript.isFinal, onTextReceived]);

  // 获取状态显示
  const getStatusDisplay = () => {
    if (!isListening) {
      return {
        text: '语音识别已关闭',
        color: 'text-gray-400',
        icon: <MicOff className="w-5 h-5" />
      };
    }
    
    if (connecting) {
      return {
        text: '连接中...',
        color: 'text-yellow-400',
        icon: <Mic className="w-5 h-5 animate-pulse" />
      };
    }
    
    if (!connected && recording) {
      return {
        text: '连接中断',
        color: 'text-yellow-400',
        icon: <Mic className="w-5 h-5" />
      };
    }
    
    if (recording && connected) {
      return {
        text: '录制中...',
        color: 'text-red-400',
        icon: <Mic className="w-5 h-5 animate-pulse" />
      };
    }

    return {
      text: '等待语音输入...',
      color: 'text-green-400',
      icon: <Mic className="w-5 h-5" />
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="card-glass p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4 text-center flex items-center justify-center gap-2">
        <Volume2 className="w-5 h-5" />
      智能语音识别
      </h3>
      
      <div className={`flex-1 p-4 rounded-lg border flex flex-col ${
        isListening 
          ? recording 
            ? 'border-red-500 bg-red-500/10'
            : 'border-green-500 bg-green-500/10'
          : 'border-gray-600 bg-gray-600/10'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={statusDisplay.color}>
            {statusDisplay.icon}
          </div>
          <span className={statusDisplay.color}>{statusDisplay.text}</span>
        </div>

        {/* 音量指示器 */}
        {isListening && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-white/60">音量:</span>
              <div className="flex-1 bg-white/10 rounded-full h-3 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-100 ${
                    connected ? 'bg-green-400' : 'bg-gray-400 opacity-50'
                  }`}
                  style={{ width: connected ? `${audioLevels.volume * 100}%` : '0%' }}
                />
              </div>
              <span className={`text-xs ${connected ? 'text-white/60' : 'text-white/40'}`}>
                {connected ? (audioLevels.volume * 100).toFixed(0) : '0'}%
              </span>
            </div>
          </div>
        )}
        
        {transcript.text && (
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-sm text-white/90 mb-1">
              {transcript.isFinal ? '识别结果:' : '识别中...'}
            </p>
            <p className={`font-medium ${transcript.isFinal ? 'text-white' : 'text-white/70'}`}>
              "{transcript.text}"
            </p>
          </div>
        )}
        
        {isListening && !transcript.text && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/60 text-sm">
              {recording ? '正在录制语音...' : '等待语音输入...'}
            </div>
          </div>
        )}

        {!isListening && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400 text-sm">
              开启麦克风智能语音识别
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecognition;