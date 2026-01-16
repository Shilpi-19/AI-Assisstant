
import React, { useRef, useEffect } from 'react';
import { Message, Sender, AppState } from '../types';

interface ChatWindowProps {
  messages: Message[];
  appState: AppState;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, appState }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  const AILoadingIndicator = () => (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-fast"></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-fast animation-delay-200"></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-fast animation-delay-400"></div>
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-end gap-3 ${
            message.sender === Sender.User ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.sender === Sender.AI && (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              ✨
            </div>
          )}
          <div
            className={`max-w-xs md:max-w-md lg:max-w-2xl rounded-2xl p-3 shadow-md ${
              message.sender === Sender.User
                ? 'bg-brand-primary text-white rounded-br-none'
                : 'bg-brand-dark text-brand-text border border-gray-700 rounded-bl-none'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          </div>
        </div>
      ))}
       {(appState === AppState.Loading || appState === AppState.Transcribing) && (
         <div className="flex items-end gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              ✨
            </div>
            <div className="max-w-xs md:max-w-md lg:max-w-2xl rounded-2xl p-3 shadow-md bg-brand-dark text-brand-text border border-gray-700 rounded-bl-none">
              <AILoadingIndicator />
            </div>
         </div>
       )}
      <div ref={endOfMessagesRef} />
    </main>
  );
};

export default ChatWindow;
