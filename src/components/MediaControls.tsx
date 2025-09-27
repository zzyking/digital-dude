import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { MediaControlsProps } from '../types';

// 媒体控制组件
const MediaControls = ({ onToggleCamera, onToggleMic, cameraEnabled, micEnabled }: MediaControlsProps) => {
  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={onToggleCamera}
        className={`p-3 rounded-lg text-white transition-colors ${
          cameraEnabled 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </button>
      
      <button
        onClick={onToggleMic}
        className={`p-3 rounded-lg text-white transition-colors ${
          micEnabled 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </button>
    </div>
  );
};

export default MediaControls;