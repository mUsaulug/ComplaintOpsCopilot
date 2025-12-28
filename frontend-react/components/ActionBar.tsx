
import React from 'react';

interface Props {
  onApprove: () => void;
  onHold: () => void;
  onReject: () => void;
  isReady: boolean;
  confidenceScore: number;
}

const ActionBar: React.FC<Props> = ({ onApprove, onHold, onReject, isReady, confidenceScore }) => {
  const needsManualReview = confidenceScore < 0.7;

  return (
    <div className="h-20 border-t bg-white flex items-center justify-between px-8 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-20">
      <div className="flex gap-4">
        <button 
          onClick={onHold}
          className="flex flex-col items-center justify-center h-12 px-6 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
        >
          <span className="text-xs font-bold uppercase tracking-tight">Beklet</span>
          <span className="text-[9px] text-slate-400 font-mono">Alt + H</span>
        </button>
        <button 
          onClick={onReject}
          className="flex flex-col items-center justify-center h-12 px-6 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
        >
          <span className="text-xs font-bold uppercase tracking-tight">Reddet</span>
          <span className="text-[9px] text-rose-300 font-mono">Alt + R</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right mr-4 hidden sm:block">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Durum</p>
          <p className="text-xs font-bold text-slate-600">Onay Bekliyor</p>
        </div>
        
        <button
          disabled={!isReady}
          onClick={onApprove}
          className={`flex flex-col items-center justify-center h-14 px-10 rounded-xl transition-all shadow-lg active:scale-95
            ${isReady 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
          `}
        >
          <span className="text-sm font-bold uppercase tracking-tight">
            {needsManualReview ? 'İncele & Gönder' : 'Onayla & Gönder'}
          </span>
          <span className="text-[10px] opacity-70 font-mono">⌘ + Enter</span>
        </button>
      </div>
    </div>
  );
};

export default ActionBar;
