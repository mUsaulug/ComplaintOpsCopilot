
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { chatWithAI } from '../services/geminiService';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Merhaba Zeynep, bu vakada sana nasıl yardımcı olabilirim? Politika sorgulama veya ters ibraz süreçleri hakkında sorabilirsin.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
        const aiResponse = await chatWithAI([], userMsg);
        setMessages(prev => [...prev, { role: 'ai', text: aiResponse || 'Anlaşılmadı.' }]);
    } catch (err) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Hata oluştu, lütfen tekrar deneyin.' }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <Icons.Robot />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:right-6 sm:bottom-24 sm:w-96 sm:h-[600px] bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.15)] flex flex-col z-[60] animate-fade-in border overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icons.Robot />
              <div>
                <p className="text-sm font-bold">Policy Assistant</p>
                <p className="text-[10px] text-slate-400">Gemini 3 Pro Image-Preview</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-800 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-zinc-100 text-slate-800 rounded-tl-none border'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 p-3 rounded-2xl rounded-tl-none border flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-zinc-50">
            <div className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Bir soru sorun... (örn: KB-99 nedir?)"
                className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors"
              >
                <Icons.Check />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
