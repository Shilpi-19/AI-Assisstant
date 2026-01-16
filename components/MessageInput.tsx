
import React, { useState } from 'react';
import { AppState } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isRecording: boolean;
  appState: AppState;
  toggleRecording: () => void;
  useGoogleSearch: boolean;
  setUseGoogleSearch: (value: boolean) => void;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const MicIcon = ({ isRecording }: { isRecording: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${isRecording ? 'text-red-500 animate-pulse' : ''}`}>
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 11-13.5 0v-1.5a.75.75 0 01.75-.75z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);


const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isRecording,
  appState,
  toggleRecording,
  useGoogleSearch,
  setUseGoogleSearch,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(text);
    setText('');
  };

  const isLoading = appState === AppState.Loading || appState === AppState.Transcribing;

  return (
    <div className="bg-brand-gray p-4 border-t border-gray-700 shadow-inner">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 md:space-x-4 max-w-4xl mx-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={isRecording ? "Recording..." : "Type your message or use the mic..."}
          className="flex-1 bg-brand-dark border border-gray-600 rounded-2xl p-3 text-sm resize-none focus:ring-2 focus:ring-brand-primary focus:outline-none transition duration-200"
          rows={1}
          disabled={isLoading || isRecording}
        />
        <button
          type="button"
          onClick={toggleRecording}
          className="p-3 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-primary transition duration-200"
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <MicIcon isRecording={isRecording} />
        </button>
        <button
          type="submit"
          className="p-3 rounded-full bg-brand-primary text-white hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-primary transition duration-200"
          disabled={!text.trim() || isLoading || isRecording}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </form>
       <div className="flex justify-center items-center mt-3">
            <label htmlFor="google-search-toggle" className="flex items-center cursor-pointer">
                <div className="relative">
                    <input type="checkbox" id="google-search-toggle" className="sr-only" checked={useGoogleSearch} onChange={() => setUseGoogleSearch(!useGoogleSearch)} />
                    <div className="block bg-gray-600 w-12 h-6 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useGoogleSearch ? 'transform translate-x-6 bg-blue-400' : ''}`}></div>
                </div>
                <div className="ml-3 text-xs text-gray-400 flex items-center">
                    <SearchIcon />
                    <span className="ml-1">Use Google Search</span>
                </div>
            </label>
        </div>
    </div>
  );
};

export default MessageInput;
