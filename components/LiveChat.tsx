import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ShieldCheck, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface LiveChatProps {
  user: UserType;
}

interface ChatMessage {
  _id: string;
  userId: string;
  userName: string;
  memberId: string;
  userImage?: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

export const LiveChat: React.FC<LiveChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!user.token) return;
    try {
      const data = await api.getChatMessages(user.token);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user.token]);

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || !user.token) return;
    const msg = inputText;
    setInputText('');
    setShowEmoji(false);
    
    try {
      await api.sendChatMessage(user.token, msg);
      await fetchMessages();
    } catch (e) {
      console.error("Failed to send", e);
      setInputText(msg);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start pointer-events-none">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-4 w-80 sm:w-96 bg-nova-800/95 backdrop-blur-xl border border-nova-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-slide-up origin-bottom-left">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-emerald-600 to-teal-700 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-sm block">Live Community</span>
                <span className="text-[10px] opacity-80 block">Friends Fund Group Chat</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 no-scrollbar bg-nova-900/50">
            {messages.length === 0 && (
                <div className="text-center text-slate-500 py-10 text-xs">
                    Start the conversation!
                </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.userId === user.id;
              return (
                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* User Avatar */}
                    {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-nova-700 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-emerald-400">
                             {msg.userImage ? (
                                 <img src={msg.userImage} alt={msg.userName} className="w-full h-full object-cover" />
                             ) : (
                                 msg.userName.charAt(0)
                             )}
                        </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Sender Name */}
                      {!isMe && (
                          <span className="text-[10px] text-slate-400 ml-1 mb-1 flex items-center gap-1">
                             {msg.isAdmin && <ShieldCheck size={10} className="text-amber-400" />}
                             {msg.userName}
                          </span>
                      )}

                      {/* Bubble */}
                      <div className={`p-3 rounded-2xl text-sm break-words ${
                        isMe 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-nova-700 text-slate-200 rounded-tl-none border border-white/5'
                      }`}>
                        {msg.message}
                      </div>

                      {/* Time */}
                      <span className="text-[9px] text-slate-600 mt-1 mx-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker Popover */}
          {showEmoji && (
              <div className="absolute bottom-16 left-2 z-10">
                  <EmojiPicker 
                    onEmojiClick={onEmojiClick} 
                    theme={Theme.DARK} 
                    width={300} 
                    height={350}
                    lazyLoadEmojis={true}
                  />
              </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-white/5 bg-nova-800">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowEmoji(!showEmoji)}
                className={`p-2.5 rounded-xl transition-colors ${showEmoji ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                  <Smile size={20} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-nova-900 border border-nova-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        className="pointer-events-auto h-14 w-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 group z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} className="fill-current" />}
        {!isOpen && (
             <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
           </span>
        )}
      </button>
    </div>
  );
};