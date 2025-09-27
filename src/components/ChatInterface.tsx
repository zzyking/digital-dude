import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import type { ChatInterfaceProps } from '../types';

// 聊天界面组件
const ChatInterface = ({ messages, onSendMessage }: ChatInterfaceProps) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="card-glass p-6 flex flex-col overflow-hidden min-h-96 lg:h-[calc(100dvh-200px)] lg:min-h-96">
      <h3 className="text-lg font-semibold text-white mb-4 text-center flex-shrink-0">智能对话</h3>
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin min-h-0 max-h-64 lg:max-h-full">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-3 ${
              msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* 头像 */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.type === 'user' 
                ? 'bg-blue-600' 
                : 'bg-gray-600'
            }`}>
              {msg.type === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>
            
            {/* 消息气泡 */}
            <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} max-w-xs`}>
              <div className={`p-3 rounded-lg ${
                msg.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-800'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
              <div className="text-xs text-white/60 mt-1 px-2">
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="flex gap-3 flex-shrink-0">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入消息与数字人对话..."
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;