import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Eye, Smile, Heart, Hand } from 'lucide-react';
import { detectFaces, detectGestures } from '../utils';

interface FaceData {
  expression?: {
    type: string;
    confidence: number;
  };
  emotion?: {
    type: string;
    confidence: number;
  };
  age?: number;
  gender?: string;
}

interface VisionRecognitionProps {
  videoStream: MediaStream | null;
  onFaceDetected: (faces: FaceData | null) => void;
  onGestureDetected: (gesture: string) => void;
  accessTokenface?: string;
  accessTokengesture?: string;
  useRealAPI?: boolean;
}

type DetectionMode = 'face' | 'gesture' | 'both';

const VisionRecognition = ({
  videoStream,
  onFaceDetected,
  onGestureDetected,
  accessTokenface = import.meta.env.VITE_FACE_ACCESS_TOKEN || '',
  accessTokengesture = import.meta.env.VITE_GESTURE_ACCESS_TOKEN || '',
  useRealAPI = false
}: VisionRecognitionProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 统一状态管理 - 默认同时检测人脸和手势
  const [detectionMode] = useState<DetectionMode>('both');
  const [faces, setFaces] = useState<FaceData | null>(null);
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);


  // 统一检测函数
  const performDetection = async () => {
    if (!videoRef.current || !videoStream) return;

    try {
      setIsDetecting(true);
      setError(null);

      let faceResults: FaceData | null = null;
      let gestureResults = '';

      if (useRealAPI && (accessTokenface || accessTokengesture)) {
        console.log('调用API，时间：', new Date().toISOString())
        const promises: Promise<any>[] = [];

        if ((detectionMode === 'face' || detectionMode === 'both') && accessTokenface) {
          promises.push(
            detectFaces(
              videoRef.current,
              accessTokenface,
              'age,gender,expression,emotion,glasses'
            )
          );
        }

        if ((detectionMode === 'gesture' || detectionMode === 'both') && accessTokengesture) {
          promises.push(detectGestures(videoRef.current, accessTokengesture));
        }

        const results = await Promise.all(promises);

        // 处理人脸检测结果
        if (detectionMode === 'face' || detectionMode === 'both') {
          const faceResponse = results[0].extracted_fields;

          if (faceResponse.face_num > 0 && faceResponse.faces) {
            faceResults = faceResponse.faces[0] as FaceData;
          }
        }

        // 处理手势检测结果
        if (detectionMode === 'gesture' || detectionMode === 'both') {
          const gestureResponse = results[detectionMode === 'both' ? 1 : 0].extracted_fields;
          gestureResults = gestureResponse.gestures.map((gesture:any)=> gesture.toString()).join(', ');
        }
      } else {
        // 显示未使用API错误
        setError('未使用API - 需要配置访问令牌并启用真实API');
        return;
      }

      // 更新状态
      setFaces(faceResults);
      setDetectedGesture(gestureResults);

      // 调用回调函数
      onFaceDetected(faceResults);
      onGestureDetected(gestureResults);

    } catch (err) {
      console.error('视觉识别错误:', err);
      setError(err instanceof Error ? err.message : '检测失败');
    } finally {
      setIsDetecting(false);
    }
  };


  // 检测循环
  useEffect(() => {
    if (!videoStream) return;

    const interval = setInterval(() => {
      performDetection();
    }, 2000); // 每2秒检测一次

    return () => clearInterval(interval);
  }, [videoStream, detectionMode, useRealAPI, accessTokenface, accessTokengesture]);

  return (
    <div className="card-glass p-6 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Eye className="w-5 h-5" />
          视觉识别
        </h3>

        {/* 实时信息面板 - 右上角横向排列 */}
        <div className="flex items-center gap-2">
          {/* 表情信息 */}
          <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm px-2 py-1 rounded-md border border-blue-400/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-1">
              <Smile className="w-3 h-3 text-blue-200" />
              <span className="text-white text-xs font-medium">{faces?.expression?.type || '未检测'}</span>
            </div>
          </div>

          {/* 情绪信息 */}
          <div className="bg-gradient-to-r from-pink-600/90 to-red-600/90 backdrop-blur-sm px-2 py-1 rounded-md border border-pink-400/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-pink-200" />
              <span className="text-white text-xs font-medium">{faces?.emotion?.type || '未检测'}</span>
            </div>
          </div>

          {/* 手势信息 */}
          <div className="bg-gradient-to-r from-green-600/90 to-emerald-600/90 backdrop-blur-sm px-2 py-1 rounded-md border border-green-400/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-1">
              <Hand className="w-3 h-3 text-green-200" />
              <span className="text-white text-xs font-medium truncate max-w-16">{detectedGesture || '未检测'}</span>
            </div>
          </div>
        </div>
      </div>


      {error && (
        <div className="text-red-400 text-sm mb-4 p-2 bg-red-900/30 rounded border border-red-500/30">
          错误: {error}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {videoStream ? (
          <div className="relative overflow-hidden rounded-lg border border-white/20 bg-black/20 flex-1 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* 摄像头状态指示器 */}
            <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/70 px-2 py-1 rounded text-xs">
              <Camera className="w-3 h-3 text-green-400" />
              <span className="text-green-400">录制中</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-black/20 rounded-lg border border-dashed border-white/20 flex items-center justify-center">
            <div className="text-center">
              <CameraOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">摄像头未启用</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default VisionRecognition;