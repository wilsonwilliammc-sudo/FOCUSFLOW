
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import Button from './Button';
import { createStudyChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = createStudyChatSession();
      setMessages([{ role: 'model', text: 'Olá! Sou seu assistente de estudos FocusFlow. Como posso te ajudar a brilhar hoje?' }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessageStream({ message: userMessage });
      let fullResponse = '';
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
        fullResponse += chunk.text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].text = fullResponse;
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um probleminha técnico. Pode repetir?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-4 w-[calc(100vw-2rem)] sm:w-[350px] md:w-[400px] h-[70vh] max-h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <ICONS.Brain />
              </div>
              <div>
                <h3 className="font-bold text-sm">Assistente IA</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">FocusFlow Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
              <ICONS.X />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-br-none shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text || (isLoading && idx === messages.length - 1 ? <span className="animate-pulse">...</span> : '')}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Dúvida?"
              className="flex-grow bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 transition-all"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md flex items-center justify-center"
            >
              <ICONS.Send />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-900 rotate-90' : 'bg-emerald-600'
        }`}
      >
        {isOpen ? <ICONS.X /> : <ICONS.Message />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
