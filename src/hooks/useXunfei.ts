import { useState, useRef, useCallback, useMemo } from 'react';
import CryptoJS from 'crypto-js';

interface XunfeiTranscript {
  text: string;
  isFinal?: boolean;
}

interface UseXunfeiReturn {
  transcript: XunfeiTranscript;
  recording: boolean;
  connecting: boolean;
  connected: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

interface XunfeiConfig {
  appId: string;
  apiSecret: string;
  apiKey: string;
}

export const useXunfei = (): UseXunfeiReturn => {
  const [transcript, setTranscript] = useState<XunfeiTranscript>({ text: '' });
  const [recording, setRecording] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const cachedTextRef = useRef<string>('');
  const connectionIdRef = useRef<number>(0);

  // 讯飞配置 - 这些应该从环境变量获取
  const config: XunfeiConfig = useMemo(() => ({
    appId: import.meta.env.VITE_XUNFEI_APP_ID || '',
    apiSecret: import.meta.env.VITE_XUNFEI_API_SECRET || '',
    apiKey: import.meta.env.VITE_XUNFEI_API_KEY || ''
  }), []);

  // 生成讯飞认证URL
  const generateAuthUrl = useCallback(() => {
    const host = 'iat-api.xfyun.cn';
    const date = new Date().toUTCString();
    const algorithm = 'hmac-sha256';

    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);

    const authorizationOrigin = `api_key="${config.apiKey}", algorithm="${algorithm}", headers="host date request-line", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);

    const url = `wss://${host}/v2/iat?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    return url;
  }, [config]);

  // 发送音频数据
  const sendAudioData = useCallback((audioData: ArrayBuffer, status: number = 1) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      // 将音频数据转换为base64
      const uint8Array = new Uint8Array(audioData);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));

      const audioFrame = {
        data: {
          status: status,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: base64Audio
        }
      };

      websocketRef.current.send(JSON.stringify(audioFrame));
    }
  }, []);

  // 建立WebSocket连接
  const connectWebSocket = useCallback(() => {
    try {
      // 确保之前的连接完全清理
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      
      // 生成新的连接ID
      const connectionId = ++connectionIdRef.current;
      console.log('建立新的WebSocket连接，连接ID:', connectionId);
      
      setConnecting(true);
      setConnected(false);
      const url = generateAuthUrl();
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('讯飞WebSocket连接已建立');
        setConnecting(false);
        setConnected(true);

        // 发送首帧参数
        const params = {
          common: {
            app_id: config.appId
          },
          business: {
            language: 'zh_cn',
            domain: 'iat',
            accent: 'mandarin',
            vad_eos: 3000,
            dwa: 'wpgs'
          },
          data: {
            status: 0,
            format: 'audio/L16;rate=16000',
            encoding: 'raw'
          }
        };

        ws.send(JSON.stringify(params));
      };

      ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          // console.log('讯飞返回数据:', result);
          if (result.data && result.data.result) {
            const { ws } = result.data.result;
            if (ws) {
              let text = '';
              ws.forEach((item: any) => {
                item.cw.forEach((word: any) => {
                  text += word.w;
                });
              });

              if (result.data.status === 2) {
                setTranscript(prev => ({ text: prev.text + text, isFinal: true }));
                cachedTextRef.current = '';
                
                setTimeout(() => {
                  console.log('识别结束，准备重连...');
                  if (websocketRef.current) {
                    websocketRef.current.close();
                    websocketRef.current = null;
                  }
                  setTranscript({ text: '', isFinal: false });
                  connectWebSocket();
                }, 500); // 适当延迟确保连接完全关闭
              } else if (result.data.status === 1) {
                setTranscript({ text, isFinal: false });
              }
            }
          }
        } catch (error) {
          console.error('解析讯飞响应失败:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('讯飞WebSocket错误:', error);
        setConnecting(false);
        setConnected(false);
      };

      ws.onclose = (event) => {
        console.log(`讯飞WebSocket连接已关闭，连接ID: ${connectionId}，当前ID: ${connectionIdRef.current}`, event.code, event.reason);
        
        // 只有当前连接ID匹配时才处理重连
        if (connectionId === connectionIdRef.current) {
          setConnecting(false);
          setConnected(false);
          console.log('检测到讯飞异常关闭连接，准备重连...');
          setTimeout(() => {
            if (recording && connectionId === connectionIdRef.current) {
              console.log('自动重连讯飞WebSocket');
              connectWebSocket();
            }
          }, 1000); // 延迟1秒重连
        } else {
          console.log('连接ID不匹配，跳过重连');
        }
      };

      websocketRef.current = ws;
    } catch (error) {
      console.error('建立讯飞WebSocket连接失败:', error);
      setConnecting(false);
      setConnected(false);
    }
  }, [generateAuthUrl, config.appId]);

  // 开始录音和WebSocket连接（当用户开启麦克风时调用）
  const startRecording = useCallback(async () => {
    try {
      // 避免重复建立连接
      if (recording || websocketRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket连接已存在，跳过重复建立');
        return;
      }

      // 检查配置
      if (!config.appId || !config.apiSecret || !config.apiKey) {
        console.error('讯飞配置不完整，请检查环境变量');
        return;
      }

      // 清空之前的识别结果和缓存
      setTranscript({ text: '', isFinal: false });
      cachedTextRef.current = '';

      // 建立WebSocket连接
      connectWebSocket();

      // 获取音频流
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false
        }
      });

      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let isFirstFrame = true;

      processor.onaudioprocess = (event) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          // 转换为16位PCM
          const pcmData = new Int16Array(inputBuffer.length);
          for (let i = 0; i < inputBuffer.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
          }

          // 发送音频数据
          if (isFirstFrame) {
            sendAudioData(pcmData.buffer, 0); // 第一帧
            isFirstFrame = false;
          } else {
            sendAudioData(pcmData.buffer, 1); // 中间帧
          }
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setRecording(true);
    } catch (error) {
      console.error('开始讯飞录音失败:', error);
    }
  }, [recording, config, connectWebSocket, sendAudioData]);

  // 停止录音和WebSocket连接（当用户关闭麦克风时调用）
  const stopRecording = useCallback(() => {
    console.log("停止讯飞录音");
    setRecording(false);
    setConnecting(false);
    setConnected(false);

    // 发送结束帧
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      const endFrame = {
        data: {
          status: 2,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: ''
        }
      };
      websocketRef.current.send(JSON.stringify(endFrame));

      // 延迟关闭连接以确保结果返回
      setTimeout(() => {
        websocketRef.current?.close();
        websocketRef.current = null;
      }, 1000);
    }

    // 清理音频资源
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 清空缓存的文本
    cachedTextRef.current = '';
  }, []);

  return {
    transcript,
    recording,
    connecting,
    connected,
    startRecording,
    stopRecording,
  };
};