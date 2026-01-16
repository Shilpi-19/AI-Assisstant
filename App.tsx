
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Sender, GroundingSource, AppState } from './types';
import { getChatResponse, getTextToSpeech, getGroundedResponse } from './services/geminiService';
import { useAudioTranscription } from './hooks/useAudioTranscription';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import Footer from './components/Footer';
// FIX: Import audio decoding utilities.
import { decode, decodeAudioData } from './utils/audioUtils';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      text: "Hello! I'm your AI Assistant. You can chat with me, ask me to search the web, or use the microphone to talk.",
      sender: Sender.AI,
    },
  ]);
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  // FIX: Use Web Audio API context and sources instead of HTMLAudioElement for raw PCM playback.
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Create a ref to hold `handleSendMessage` to break the dependency cycle.
  // The cycle is: handleSendMessage -> isRecording -> useAudioTranscription -> onTranscriptionComplete -> handleSendMessage
  const handleSendMessageRef = useRef<(inputText: string) => Promise<void>>();

  const onTranscriptionComplete = useCallback(async (transcript: string) => {
    if (transcript.trim()) {
      // Call the latest version of `handleSendMessage` via the ref.
      await handleSendMessageRef.current?.(transcript);
    }
    // This callback is stable because it has no dependencies.
  }, []);

  // `useAudioTranscription` is called now that its dependency `onTranscriptionComplete` is ready.
  const { isRecording, startRecording, stopRecording } = useAudioTranscription({
    onTranscriptionComplete,
    onStateChange: setAppState,
  });

  // Use a ref to get the latest `isRecording` value inside async callbacks (like playAudio's onended) to avoid stale state.
  const isRecordingRef = useRef(isRecording);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // FIX: Implement audio playback using Web Audio API for raw PCM data.
  const playAudio = useCallback(async (audioData: string) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioContext = audioContextRef.current;

    // Stop any currently playing audio.
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();

    try {
      const audioBuffer = await decodeAudioData(
        decode(audioData),
        audioContext,
        24000,
        1
      );

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        audioSourcesRef.current.delete(source);
        // Transition state after audio finishes playing, using the ref for the most current state.
        setAppState(isRecordingRef.current ? AppState.Recording : AppState.Idle);
      };
      source.start(0);
      audioSourcesRef.current.add(source);
    } catch (e) {
      console.error("Audio playback failed:", e);
      setAppState(isRecordingRef.current ? AppState.Recording : AppState.Idle);
    }
  }, [setAppState]);

  // `handleSendMessage` is defined now that `isRecording` and `playAudio` are available.
  const handleSendMessage = useCallback(async (inputText: string) => {
    if (!inputText.trim()) return;

    const userMessage: Message = { id: Date.now(), text: inputText, sender: Sender.User };
    setMessages(prev => [...prev, userMessage]);
    setAppState(AppState.Loading);
    setSources([]); // Clear sources for new query

    try {
      let response;
      if (useGoogleSearch) {
        response = await getGroundedResponse(inputText);
        if (response.sources) {
          setSources(response.sources);
        }
      } else {
        const history = messages.map(msg => ({
          role: msg.sender === Sender.User ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
        response = await getChatResponse(inputText, history);
      }
      
      const aiMessage: Message = { id: Date.now() + 1, text: response.text, sender: Sender.AI };
      setMessages(prev => [...prev, aiMessage]);

      // `isRecording` is now in scope and up-to-date due to being in the dependency array.
      if (isRecording) { // If user was using voice, respond with voice
        setAppState(AppState.Speaking);
        const audioData = await getTextToSpeech(response.text);
        if (audioData) {
          // The playAudio function handles the state transition after speaking.
          playAudio(audioData);
        } else {
          // If no audio, transition state back.
          setAppState(isRecording ? AppState.Recording : AppState.Idle);
        }
      } else {
        setAppState(AppState.Idle);
      }
    } catch (error) {
      console.error('Error getting response from Gemini:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: Sender.AI,
      };
      setMessages(prev => [...prev, errorMessage]);
      setAppState(AppState.Idle);
    }
  }, [messages, useGoogleSearch, isRecording, playAudio]);

  // Update the ref on every render to point to the latest `handleSendMessage` function.
  handleSendMessageRef.current = handleSendMessage;


  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-gray text-brand-text font-sans">
      <Header />
      <ChatWindow messages={messages} appState={appState} />
      <Footer sources={sources} />
      <MessageInput
        onSendMessage={handleSendMessage}
        isRecording={isRecording}
        appState={appState}
        toggleRecording={toggleRecording}
        useGoogleSearch={useGoogleSearch}
        setUseGoogleSearch={setUseGoogleSearch}
      />
      {/* FIX: Removed hidden <audio> element as it's no longer used. */}
    </div>
  );
};

export default App;
