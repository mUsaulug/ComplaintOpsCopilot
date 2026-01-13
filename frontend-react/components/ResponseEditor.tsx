
import React, { useState, useEffect } from 'react';
import { Suggestion } from '../types';
import { Icons } from '../constants';

interface Props {
  suggestion: Suggestion | null;
  onTextChange: (text: string) => void;
}

const ResponseEditor: React.FC<Props> = ({ suggestion, onTextChange }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (suggestion) {
      setText(suggestion.responseDraft);
    }
  }, [suggestion]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTextChange(e.target.value);
  };

  const handleMagicAction = (type: string) => {
    // Simulated magic actions - normally would call Gemini again
    let newText = text;
    if (type === 'formal') newText = "Sayın Müşterimiz, " + text;
    if (type === 'short') newText = text.substring(0, 100) + "...";
    setText(newText);
    onTextChange(newText);
  };

  if (!suggestion) return null;

  return (
    <div className="flex flex-col gap-4 mt-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
           Yazışma Taslağı
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => handleMagicAction('formal')}
            className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
          >
            ✨ Daha Resmi Yap
          </button>
          <button 
            onClick={() => handleMagicAction('empathetic')}
            className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
          >
            ✨ Empatik Yap
          </button>
        </div>
      </div>

      <div className="relative group">
        <textarea
          value={text}
          onChange={handleChange}
          className="w-full h-48 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-sm text-slate-800 leading-relaxed font-medium"
          placeholder="AI taslağı hazırlanıyor..."
        />
        <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-mono">
          {text.length} karakter
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">Kanıt Kartları</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestion.kbArticles.map((article) => (
            <div
              key={article.id}
              className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Icons.Shield />
                  {article.title}
                </div>
                <span className="text-[10px] font-bold text-blue-600">
                  %{(article.relevance * 100).toFixed(0)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed min-h-[40px]">
                {article.summary || "Kaynak özeti bulunamadı."}
              </p>
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                {article.source || "Kaynak: Bilinmiyor"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResponseEditor;
