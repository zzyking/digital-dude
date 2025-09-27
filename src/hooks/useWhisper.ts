import { useState, useRef, useCallback } from 'react';

interface WhisperTranscript {
  text: string;
}

interface UseWhisperReturn {
  transcript: WhisperTranscript;
  recording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

export const useWhisper = (): UseWhisperReturn => {
  const [transcript, setTranscript] = useState<WhisperTranscript>({ text: '' });
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToServer(audioBlob);
        
        // 清理资源
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, [recording]);

  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setTranscript({ text: result.text || '' });
      } else {
        console.error('Error transcribing audio:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending audio to server:', error);
    }
  };

  return {
    transcript,
    recording,
    startRecording,
    stopRecording,
  };
};