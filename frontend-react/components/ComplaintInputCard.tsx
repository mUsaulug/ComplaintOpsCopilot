import React from 'react';
import KVKKBadge from './KVKKBadge';
import { Icons } from '../constants';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

const MIN_LENGTH = 20;

const ComplaintInputCard: React.FC<Props> = ({ value, onChange, onSubmit, isSubmitting, error }) => {
  const remaining = Math.max(0, MIN_LENGTH - value.trim().length);
  const isValid = value.trim().length >= MIN_LENGTH;

  return (
    <div className="p-6 border-b bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Yeni Şikayet</h3>
          <KVKKBadge />
        </div>
        <span className={`text-[10px] font-bold ${isValid ? 'text-emerald-600' : 'text-slate-400'}`}>
          {isValid ? 'Doğrulandı' : `${remaining} karakter daha`}
        </span>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Şikayet metnini buraya yazın... (örn: Kartımdan bilgim dışında 500 TL çekildi)"
          className="w-full h-28 p-4 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-mono">
          {value.trim().length} karakter
        </div>
      </div>

      {error && (
        <div className="mt-3 text-[11px] text-rose-600 font-semibold flex items-center gap-2">
          <Icons.Alert />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
        className={`mt-4 w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2
          ${isValid && !isSubmitting
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
      >
        <Icons.Cpu />
        {isSubmitting ? 'Analiz başlatılıyor...' : 'Analizi Başlat'}
      </button>
    </div>
  );
};

export default ComplaintInputCard;
