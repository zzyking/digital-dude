import { useRef, useEffect, useState } from 'react';

interface DigitalHumanWebRTCProps {
  isConnected: boolean;
  onConnectionStateChange: (state: 'connecting' | 'connected' | 'disconnected') => void;
  onSessionIdChange: (sessionId: number) => void;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

const DigitalHumanWebRTC = ({ isConnected, onConnectionStateChange, onSessionIdChange }: DigitalHumanWebRTCProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [sessionId, setSessionId] = useState<number>(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  const negotiate = async () => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', checkState);
        }
      });

      const response = await fetch('/offer', {
        body: JSON.stringify({
          sdp: pc.localDescription?.sdp,
          type: pc.localDescription?.type,
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });

      const answer = await response.json();
      setSessionId(answer.sessionid);
      onSessionIdChange(answer.sessionid);
      await pc.setRemoteDescription(answer);
      
      setConnectionState('connected');
      onConnectionStateChange('connected');
    } catch (error) {
      console.error('WebRTC negotiation failed:', error);
      setConnectionState('disconnected');
      onConnectionStateChange('disconnected');
    }
  };

  const startConnection = async () => {
    try {
      setConnectionState('connecting');
      onConnectionStateChange('connecting');

      const config: RTCConfiguration = {
        sdpSemantics: 'unified-plan'
      };

      const pc = new RTCPeerConnection(config);
      pcRef.current = pc;

      // Handle incoming tracks
      pc.addEventListener('track', (evt) => {
        if (evt.track.kind === 'video' && videoRef.current) {
          videoRef.current.srcObject = evt.streams[0];
        }
      });

      // Handle connection state changes
      pc.addEventListener('connectionstatechange', () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setConnectionState('disconnected');
          onConnectionStateChange('disconnected');
        }
      });

      await negotiate();
    } catch (error) {
      console.error('Failed to start WebRTC connection:', error);
      setConnectionState('disconnected');
      onConnectionStateChange('disconnected');
    }
  };

  const stopConnection = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setSessionId(0);
    onSessionIdChange(0);
    setConnectionState('disconnected');
    onConnectionStateChange('disconnected');
  };

  useEffect(() => {
    if (isConnected) {
      startConnection();
    } else {
      stopConnection();
    }

    // Cleanup on unmount
    return () => {
      stopConnection();
    };
  }, [isConnected]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        style={{ 
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
      
      {/* Connection status overlay */}
      {connectionState !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            {connectionState === 'connecting' ? (
              <>
                <div className="text-lg mb-2">连接中...</div>
                <div className="text-sm opacity-75">正在建立WebRTC连接</div>
              </>
            ) : (
              <>
                <div className="text-lg mb-2">数字人未连接</div>
                <div className="text-sm opacity-75">点击连接按钮开始</div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Session info overlay */}
      {sessionId > 0 && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          Session: {sessionId}
        </div>
      )}
    </div>
  );
};

export default DigitalHumanWebRTC;