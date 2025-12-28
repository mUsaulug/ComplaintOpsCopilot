
export enum CustomerSegment {
  STANDARD = 'STANDARD',
  GOLD = 'GOLD',
  VIP_PLATINUM = 'VIP_PLATINUM'
}

export enum ComplaintCategory {
  FRAUD_UNAUTHORIZED_TX = 'FRAUD_UNAUTHORIZED_TX',
  CHARGEBACK_DISPUTE = 'CHARGEBACK_DISPUTE',
  TRANSFER_DELAY = 'TRANSFER_DELAY',
  TECHNICAL = 'TECHNICAL',
  CARD_ISSUE = 'CARD_ISSUE',
  SERVICE_ISSUE = 'SERVICE_ISSUE',
  UNKNOWN = 'UNKNOWN'
}

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
