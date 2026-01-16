
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode } from '../utils/audioUtils';
import { AppState } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

interface UseAudioTranscriptionProps {
  onTranscriptionComplete: (transcript: string) => void;
  onStateChange: (state: AppState) => void;
}

export const useAudioTranscription = ({ onTranscriptionComplete, onStateChange }: UseAudioTranscriptionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<string>('');
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    onStateChange(AppState.Transcribing);

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session) => session.close());
      sessionPromiseRef.current = null;
    }

    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
    }
    
    setIsRecording(false);
    onTranscriptionComplete(transcriptRef.current);
    transcriptRef.current = '';
    setTimeout(() => onStateChange(AppState.Loading), 50); // Give a brief moment for UI update
  }, [isRecording, onTranscriptionComplete, onStateChange]);
  
  const startRecording = useCallback(async () => {
    if (isRecording) return;

    transcriptRef.current = '';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // FIX: Cast window to `any` to allow `webkitAudioContext` for broader browser compatibility without TypeScript errors.
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        onStateChange(AppState.Recording);
        setIsRecording(true);

        sessionPromiseRef.current = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
              onopen: () => {
                  const source = audioContextRef.current!.createMediaStreamSource(stream);
                  mediaStreamSourceRef.current = source;

                  const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                  scriptProcessorRef.current = scriptProcessor;

                  scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                      const pcmBlob: Blob = {
                          data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                          mimeType: 'audio/pcm;rate=16000',
                      };
                      if (sessionPromiseRef.current) {
                        sessionPromiseRef.current.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                      }
                  };
                  source.connect(scriptProcessor);
                  scriptProcessor.connect(audioContextRef.current!.destination);
              },
              onmessage: (message: LiveServerMessage) => {
                  if (message.serverContent?.inputTranscription) {
                      const text = message.serverContent.inputTranscription.text;
                      transcriptRef.current += text;
                  }
                  if (message.serverContent?.turnComplete) {
                      stopRecording();
                  }
              },
              onerror: (e: Error) => {
                  console.error('Live session error:', e);
                  stopRecording();
              },
              onclose: () => {
                  // This can be called when session is closed intentionally.
              },
          },
          config: {
              inputAudioTranscription: {},
          },
      });
    } catch (err) {
      console.error('Failed to start recording', err);
      alert('Could not start recording. Please ensure you have given microphone permissions.');
      setIsRecording(false);
      onStateChange(AppState.Idle);
    }
  }, [isRecording, onStateChange, stopRecording]);


  return { isRecording, startRecording, stopRecording };
};
