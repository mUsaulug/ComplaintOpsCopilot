
export enum CustomerSegment {
  STANDARD = 'STANDARD',
  GOLD = 'GOLD',
  VIP_PLATINUM = 'VIP_PLATINUM'
}

export enum ComplaintCategory {
  FRAUD_UNAUTHORIZED_TX = 'FRAUD_UNAUTHORIZED_TX',
  CHARGEBACK_DISPUTE = 'CHARGEBACK_DISPUTE',
  TRANSFER_DELAY = 'TRANSFER_DELAY',
  ACCESS_LOGIN_MOBILE = 'ACCESS_LOGIN_MOBILE',
  CARD_LIMIT_CREDIT = 'CARD_LIMIT_CREDIT',
  INFORMATION_REQUEST = 'INFORMATION_REQUEST',
  CAMPAIGN_POINTS_REWARDS = 'CAMPAIGN_POINTS_REWARDS',
  UNKNOWN = 'UNKNOWN'
}

// UI display labels for categories (Turkish)
export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  [ComplaintCategory.FRAUD_UNAUTHORIZED_TX]: 'Dolandırıcılık / Yetkisiz İşlem',
  [ComplaintCategory.CHARGEBACK_DISPUTE]: 'İade / İtiraz',
  [ComplaintCategory.TRANSFER_DELAY]: 'Transfer Gecikmesi',
  [ComplaintCategory.ACCESS_LOGIN_MOBILE]: 'Erişim / Giriş / Mobil',
  [ComplaintCategory.CARD_LIMIT_CREDIT]: 'Kart / Limit / Kredi',
  [ComplaintCategory.INFORMATION_REQUEST]: 'Bilgi Talebi',
  [ComplaintCategory.CAMPAIGN_POINTS_REWARDS]: 'Kampanya / Puan / Ödül',
  [ComplaintCategory.UNKNOWN]: 'Bilinmiyor'
};

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum Sentiment {
  ANGRY = 'ANGRY',
  NEUTRAL = 'NEUTRAL',
  CONCERNED = 'CONCERNED'
}

export interface ComplaintData {
  id: string;
  backendId?: number;
  timestamp: string;
  customerName: string;
  customerSegment: CustomerSegment;
  // originalText REMOVED for KVKK compliance
  maskedText: string;
  piiTags: string[];

  // New backend fields
  insanIncelemesiGerekli?: boolean;
  reviewId?: string;
  sistemDurumu?: BackendSistemDurumu;
}

export interface BackendSistemDurumu {
  rag_durumu: string;
  llm_durumu: string;
}

export interface BackendGuvenSkorlari {
  kategori: number;
  oncelik: number;
}

export interface BackendKaynak {
  dokuman_adi: string;
  kaynak: string;
  ozet: string;
}

export interface BackendComplaintResponse {
  id: number;
  maskedText: string;
  kategori: string;
  oncelik: string;
  oneri: string;
  durum: string;
  kaynaklar: BackendKaynak[];
  insan_incelemesi_gerekli: boolean;
  review_id: string;
  guven_skorlari: BackendGuvenSkorlari;
  sistem_durumu: BackendSistemDurumu;
}

export interface KBArticle {
  id: string;
  title: string;
  relevance: number;
  summary?: string;
  source?: string;
}

export interface AnalysisResult {
  category: ComplaintCategory;
  priority: Priority;
  sentiment: Sentiment;
  confidenceScore: number;
  reasoning: string;
}

export interface Suggestion {
  responseDraft: string;
  actions: string[];
  kbArticles: KBArticle[];
}

export interface SimilarComplaint {
  id: number;
  masked_text: string;
  category: string;
  similarity_score: number;
  created_at: string;
  status: string;
}

export interface ComplaintState {
  complaint: ComplaintData;
  analysis: AnalysisResult | null;
  suggestion: Suggestion | null;
  similarComplaints: SimilarComplaint[] | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}
