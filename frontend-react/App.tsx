
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SmartComplaintViewer from './components/SmartComplaintViewer';
import AIInsightCard from './components/AIInsightCard';
import ResponseEditor from './components/ResponseEditor';
import ActionBar from './components/ActionBar';
import ChatBot from './components/ChatBot';
import { Toaster, toast } from 'sonner';
import { ComplaintData, CustomerSegment, ComplaintState, Priority } from './types';
import { submitComplaint, findSimilarComplaints, approveComplaint, rejectComplaint } from './services/backendService';
import { adaptBackendResponse } from './services/dataAdapter';

const INITIAL_COMPLAINT: ComplaintData = {
  id: "CMP-2024-8921",
  timestamp: new Date().toISOString(),
  customerName: "Ahmet Yılmaz",
  customerSegment: CustomerSegment.VIP_PLATINUM,
  maskedText: "Yükleniyor...",
  piiTags: []
};

const App: React.FC = () => {
  const [state, setState] = useState<ComplaintState>({
    complaint: INITIAL_COMPLAINT,
    analysis: null,
    suggestion: null,
    similarComplaints: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  });

  const [draftResponse, setDraftResponse] = useState('');

  const runAnalysis = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Backend'e gönder
      // NOTE: In real app, we might get text from a secure input or previous step. 
      // For demo, we are using a hardcoded text if maskedText is initial.
      const textToSubmit = "Kredi kartımdan Apple Store harcaması çekilmiş, ben yapmadım! İade istiyorum hemen!";

      const backendResult = await submitComplaint(textToSubmit);

      // 2. Backend response'u frontend format'ına çevir
      const { analysis, suggestion } = adaptBackendResponse(backendResult);

      // 3. State'i güncelle
      setState(prev => ({
        ...prev,
        complaint: {
          ...prev.complaint,
          id: backendResult.id.toString(),
          backendId: backendResult.id,
          maskedText: backendResult.maskedText,
          piiTags: [],
          // Backend fields for HITL and explainability
          insanIncelemesiGerekli: backendResult.insan_incelemesi_gerekli,
          reviewId: backendResult.review_id,
          sistemDurumu: backendResult.sistem_durumu
        },
        analysis,
        suggestion,
        isLoading: false
      }));

      setDraftResponse(suggestion.responseDraft);
      toast.success("Analiz başarıyla tamamlandı.");

      // 4. Benzer şikayetleri yükle
      if (backendResult.id) {
        findSimilarComplaints(backendResult.id, 5)
          .then(similarData => {
            setState(prev => ({
              ...prev,
              similarComplaints: similarData
            }));
          })
          .catch(err => {
            console.warn('Similar complaints failed:', err);
            // Non-critical, just ignore or show empty
            setState(prev => ({ ...prev, similarComplaints: [] }));
          });
      }
    } catch (err) {
      console.error('Backend error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Backend bağlantı hatası. Lütfen backend servislerini başlatın.'
      }));
      toast.error("Bağlantı hatası oluştu.");
    }
  }, [state.complaint.maskedText]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const handleApprove = async () => {
    if (!state.complaint.backendId) return;
    setState(prev => ({ ...prev, isSubmitting: true }));
    try {
      await approveComplaint(state.complaint.backendId, "AI destekli kontrol tamamlandı.");
      toast.success("Şikayet onaylandı ve yanıt gönderildi.");
    } catch (err) {
      toast.error("Onaylama işlemi başarısız.");
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleReject = async () => {
    if (!state.complaint.backendId) return;
    if (!window.confirm("Bu şikayeti reddetmek istediğinizden emin misiniz?")) return;

    try {
      await rejectComplaint(state.complaint.backendId, "Reddedildi.");
      toast.info("Şikayet reddedildi.");
    } catch (err) {
      toast.error("Red işlemi başarısız.");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-900">
      <Toaster position="top-right" richColors />
      <Header />

      <main className="flex flex-1 overflow-hidden relative">
        <section className="w-[40%] border-r border-slate-200 bg-zinc-50 flex flex-col relative z-0">
          <SmartComplaintViewer data={state.complaint} />
        </section>

        <section className="flex-1 bg-white flex flex-col h-full overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
            <AIInsightCard
              analysis={state.analysis}
              isLoading={state.isLoading}
              needsHumanReview={state.complaint.insanIncelemesiGerekli}
            />

            <ResponseEditor
              suggestion={state.suggestion}
              onTextChange={setDraftResponse}
            />

            {state.similarComplaints && state.similarComplaints.length > 0 && (
              <div className="mt-8 animate-fade-in">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-3">Benzer Geçmiş Vakalar</h4>
                <div className="space-y-2">
                  {state.similarComplaints.map(sc => (
                    <div key={sc.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center hover:bg-slate-100 transition-colors cursor-pointer">
                      <p className="text-xs text-slate-600 font-medium truncate max-w-[70%] italic">"{sc.masked_text}"</p>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">%{Math.round(sc.similarity_score * 100)} Eşleşme</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-24" />
          </div>

          <ActionBar
            onApprove={handleApprove}
            onHold={() => toast.info("Şikayet bekleme listesine alındı.")}
            onReject={handleReject}
            isReady={!!state.analysis && !state.isLoading}
            confidenceScore={state.analysis?.confidenceScore || 0}
          />
        </section>
      </main>

      <ChatBot />

      {state.isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-slate-900">İşlem Yapılıyor...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
