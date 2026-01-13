
import { AnalysisResult, Suggestion, ComplaintCategory, Priority, Sentiment, BackendComplaintResponse } from '../types';

const CATEGORY_MAP: Record<string, ComplaintCategory> = {
  'DOLANDIRICILIK_YETKISIZ_ISLEM': ComplaintCategory.FRAUD_UNAUTHORIZED_TX,
  'IADE_ITIRAZ': ComplaintCategory.CHARGEBACK_DISPUTE,
  'TRANSFER_GECIKMESI': ComplaintCategory.TRANSFER_DELAY,
  'ERISIM_GIRIS_MOBIL': ComplaintCategory.TECHNICAL,
  'KART_LIMIT_KREDI': ComplaintCategory.CARD_ISSUE,
  'BILGI_TALEBI': ComplaintCategory.SERVICE_ISSUE,
  'KAMPANYA_PUAN_ODUL': ComplaintCategory.SERVICE_ISSUE,
  'TEKNIK': ComplaintCategory.TECHNICAL,
  'MANUEL_INCELEME': ComplaintCategory.UNKNOWN
};

const PRIORITY_MAP: Record<string, Priority> = {
  'YUKSEK': Priority.HIGH,  // Backend sends 'YUKSEK'
  'ORTA': Priority.MEDIUM, // Backend sends 'ORTA'
  'DUSUK': Priority.LOW    // Backend sends 'DUSUK'
};

export function adaptBackendResponse(backend: BackendComplaintResponse): {
  analysis: AnalysisResult;
  suggestion: Suggestion;
} {
  // Handle confidence scores (backend returns guven_skorlari object)
  const catConf = backend.guven_skorlari?.kategori || 0;
  const urgConf = backend.guven_skorlari?.oncelik || 0;
  const avgConfidence = (catConf + urgConf) / 2;

  const analysis: AnalysisResult = {
    category: CATEGORY_MAP[backend.kategori] || ComplaintCategory.UNKNOWN,
    priority: PRIORITY_MAP[backend.oncelik] || Priority.MEDIUM,
    sentiment: Sentiment.NEUTRAL,
    confidenceScore: avgConfidence,
    reasoning: `Kategori güveni: %${Math.round(catConf * 100)}, Öncelik güveni: %${Math.round(urgConf * 100)}`
  };

  const suggestion: Suggestion = {
    responseDraft: backend.oneri,
    actions: backend.insan_incelemesi_gerekli ? ["HUMAN_REVIEW_REQUIRED"] : ["AUTO_APPROVE_ELIGIBLE"],
    kbArticles: (backend.kaynaklar || []).map((k, index) => ({
      id: `doc-${index}`,
      title: k.dokuman_adi || 'Bilinmeyen Doküman',
      relevance: 1.0, // Backend doesn't return score per source in summary, default to 1
      summary: k.ozet,
      source: k.kaynak
    }))
  };

  return { analysis, suggestion };
}
