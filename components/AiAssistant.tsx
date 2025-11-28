
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { getFinancialAdvice, getLoginHelp } from '../services/geminiService';
import { AiMessage } from '../types';

interface AiAssistantProps {
  contextData?: string;
  mode: 'LOGIN_HELP' | 'FINANCIAL_ADVISOR';
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ contextData = '', mode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([
    { 
      role: 'model', 
      text: mode === 'LOGIN_HELP' 
        ? "Assalamu Alaikum! Having trouble logging in? I can help you access your account securely." 
        : "Assalamu Alaikum! I'm Fatema. Ask me about your savings or for financial advice." 
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: AiMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    let responseText = '';
    if (mode === 'LOGIN_HELP') {
        responseText = await getLoginHelp(input);
    } else {
        responseText = await getFinancialAdvice(input, contextData);
    }

    setIsThinking(false);
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-4 w-80 sm:w-96 bg-nova-800/95 backdrop-blur-xl border border-nova-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-slide-up origin-bottom-right">
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-nova-800 to-nova-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-nova-accent/20 rounded-lg">
                <Sparkles size={16} className="text-nova-accent" />
              </div>
              <span className="font-medium text-sm text-white">Fatema Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-4 no-scrollbar bg-nova-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-nova-accent text-nova-900 rounded-tr-none font-medium' 
                    : 'bg-nova-700 text-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-nova-700/50 p-3 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/5 bg-nova-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask something..."
                className="flex-1 bg-nova-900 border border-nova-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nova-accent focus:ring-1 focus:ring-nova-accent transition-all placeholder:text-slate-500"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="p-2.5 bg-nova-accent text-nova-900 rounded-xl hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto h-14 w-14 bg-gradient-to-tr from-nova-accent to-green-600 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="fill-current" />}
        {!isOpen && (
             <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
           </span>
        )}
      </button>
    </div>
  );
};
