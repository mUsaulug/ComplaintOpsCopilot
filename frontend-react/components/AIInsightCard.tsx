
import React from 'react';
import { AnalysisResult, Priority } from '../types';
import { Icons } from '../constants';

interface Props {
  analysis: AnalysisResult | null;
  isLoading: boolean;
  needsHumanReview?: boolean;
}

const AIInsightCard: React.FC<Props> = ({ analysis, isLoading, needsHumanReview }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Icons.Cpu />
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">Analiz Yapılıyor...</p>
          <p className="text-xs text-slate-500 mt-1">PII maskeleniyor ve risk taranıyor</p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.CRITICAL: return 'text-rose-600';
      case Priority.HIGH: return 'text-orange-600';
      case Priority.MEDIUM: return 'text-amber-600';
      default: return 'text-emerald-600';
    }
  };

  const confidenceLevel = analysis.confidenceScore >= 0.9 ? 'high' : analysis.confidenceScore >= 0.7 ? 'medium' : 'low';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden relative">
      <div className={`absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12`}>
        <Icons.Robot />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${confidenceLevel === 'high' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <Icons.Check />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">AI Analiz Paneli</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Model: Gemini 3 Flash</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-slate-900">{Math.round(analysis.confidenceScore * 100)}%</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Güven Skoru</p>
        </div>
      </div>

      {/* Human-in-the-Loop Alert */}
      {needsHumanReview && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 items-center">
          <div className="text-indigo-600">
            <Icons.Alert />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-900">İnsan İncelemesi Gerekli</p>
            <p className="text-[10px] text-indigo-700">Düşük güven skoru veya hassas kategori nedeniyle kontrol edilmeli.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Kategori</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">{analysis.category.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Öncelik</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${analysis.priority === Priority.CRITICAL ? 'bg-rose-600 animate-pulse' : 'bg-slate-400'}`} />
            <span className={`text-sm font-bold ${getPriorityColor(analysis.priority)}`}>{analysis.priority}</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">AI Muhakemesi (Reasoning)</p>
        <p className="text-xs text-slate-600 leading-relaxed italic">
          "{analysis.reasoning}"
        </p>
      </div>

      {analysis.confidenceScore < 0.7 && !needsHumanReview && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 items-center">
          <Icons.Alert />
          <p className="text-[10px] text-amber-700 font-medium">
            Düşük güven skoru. Lütfen önerilen kategoriyi manuel olarak doğrulayın.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIInsightCard;
