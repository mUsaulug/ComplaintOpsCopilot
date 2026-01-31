# ComplaintOps Copilot - Bankacılık Şikayet Yönetim Sistemi

**AI-Destekli Müşteri Şikayeti Analiz ve Yanıt Sistemi**

## 🎯 Proje Özeti

ComplaintOps Copilot, bankacılık sektöründe müşteri şikayetlerini otomatik olarak analiz eden, kategorize eden ve çözüm önerileri üreten bir AI sistemidir.

### Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| **PII Maskeleme** | TCKN, IBAN, telefon, email otomatik maskelenir (KVKK uyumlu) |
| **Fail-Closed Güvenlik** | Maskeleme hatası → pipeline durur, raw text korunur |
| **AI Kategorizasyon** | ML model ile 7 kategori + aciliyet tahmini |
| **RAG Destekli Yanıt** | SOP dokümanlarından ilgili prosedürleri bulur |
| **LLM Yanıt Üretimi** | Müşteriye profesyonel Türkçe yanıt taslağı |
| **Human-in-the-Loop** | Düşük güvenli tahminler manuel incelemeye yönlendirilir |

---

## 🏗️ Mimari

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Java Backend   │────▶│  Python AI      │
│   (React)       │     │  (Orchestrator) │     │  (ML/LLM/RAG)   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │   PostgreSQL    │
                        │   (No Raw PII)  │
                        └─────────────────┘
```

**Java Orchestrator** → İş akışı, KVKK uyumu, DB yönetimi  
**Python AI Service** → PII maskeleme, ML triage, RAG, LLM

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Java 17+
- Python 3.10+
- PostgreSQL (veya H2 test için)
- Node.js 18+ (frontend için)

### Seçenek A: Docker ile (Önerilen)

```bash
# Tüm servisleri başlat (frontend dahil)
docker compose up -d

# Logları görüntüle
docker compose logs -f

# Smoke test
curl http://localhost:8080/api/complaints
```

### Seçenek B: Manuel Kurulum

#### 1. Python AI Service

```bash
cd backend-python
pip install -r requirements.txt

# ChromaDB için SOP'ları yükle
python -m app.rag.ingest

# Triage modelini eğit (opsiyonel, model repo'da mevcut)
python -m app.ml.train

# Servisi başlat
uvicorn app.main:app --reload --port 8000
```

#### 2. Java Backend

```bash
cd backend-java

# application.properties'i düzenle (ai-service.url, db config)
mvn spring-boot:run
```

#### 3. Frontend (Opsiyonel)

```bash
cd frontend-react
npm install
npm run dev
```

### 4. Test Et

```bash
# Türkçe API endpoint
curl -X POST http://localhost:8080/api/sikayet \
  -H "Content-Type: application/json" \
  -d '{"metin": "Kartımdan bilgim dışında 500 TL çekilmiş."}'
```

---

## 🤖 LLM Provider Yapılandırması

ComplaintOps Copilot, üç farklı LLM sağlayıcısını destekler:

| Provider | Env Değişkeni | Model Örnekleri |
|----------|--------------|-----------------|
| **OpenAI** | `OPENAI_API_KEY` | gpt-3.5-turbo, gpt-4 |
| **Gemini** | `GEMINI_API_KEY` | gemini-pro |
| **OpenRouter** | `OPENROUTER_API_KEY` | xiaomi/mimo-vl-flash:free, claude-3 |

### OpenRouter Kurulumu

OpenRouter, tek bir API ile 100+ farklı modele erişim sağlar.

#### 1. API Key Alma
1. [OpenRouter](https://openrouter.ai/) hesabı oluşturun
2. [API Keys](https://openrouter.ai/keys) sayfasından yeni key oluşturun

#### 2. Yapılandırma

```bash
# backend-python/.env dosyasına ekleyin:
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=xiaomi/mimo-vl-flash:free
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_APP_NAME=ComplaintOpsCopilot
```

#### 3. Docker ile Çalıştırma

```bash
OPENROUTER_API_KEY=your-key LLM_PROVIDER=openrouter docker compose up -d
```

### ⚠️ API Key Güvenliği

> **ÖNEMLİ**: 
> - API key'i **asla** kod veya dokümana yazmayın
> - Key ifşa olduysa **hemen** [OpenRouter Dashboard](https://openrouter.ai/keys)'dan revoke edin
> - `.env` dosyası `.gitignore`'dadır, commit edilmez
> - Key'i sadece env değişkeni olarak kullanın

---

## 📡 API Referansı

### POST /mask (Python)

**Request:**
```json
{
  "text": "Müşteri no 1234567890, email test@example.com"
}
```

**Response:**
```json
{
  "masked_text": "Müşteri no [MASKED_ACCOUNT], email [MASKED_EMAIL]",
  "masked_entities": ["ACCOUNT_NUMBER", "EMAIL_ADDRESS"]
}
```

### POST /predict (Python)

**Request:**
```json
{
  "text": "Kartımdan bilgim dışında 500 TL çekildi."
}
```

**Response:**
```json
{
  "category": "FRAUD_UNAUTHORIZED_TX",
  "category_confidence": 0.82,
  "urgency": "HIGH",
  "urgency_confidence": 0.76,
  "needs_human_review": false,
  "model_loaded": true,
  "review_status": "AUTO_APPROVED",
  "review_id": null
}
```

### POST /retrieve (Python)

**Request:**
```json
{
  "text": "Kart aidatı iadesi",
  "category": "INFORMATION_REQUEST"
}
```

**Response:**
```json
{
  "relevant_sources": [
    {
      "doc_name": "sop_3",
      "source": "Bank_SOP_v1",
      "snippet": "Aidat iadesi için müşteri talebini kaydedin...",
      "chunk_id": "sop_3:12"
    }
  ]
}
```

### POST /generate (Python)

**Request:**
```json
{
  "text": "Kartımdan bilgim dışında 500 TL çekildi.",
  "category": "FRAUD_UNAUTHORIZED_TX",
  "urgency": "HIGH",
  "relevant_sources": [
    {
      "doc_name": "sop_3",
      "source": "Bank_SOP_v1",
      "snippet": "Fraud şüphesi durumunda kartı hemen bloke edin...",
      "chunk_id": "sop_3:12"
    }
  ]
}
```

**Response:**
```json
{
  "action_plan": [
    "Kartı güvenlik nedeniyle bloke edin.",
    "Müşteriye iade sürecini başlatın."
  ],
  "customer_reply_draft": "Sayın müşterimiz, kartınız güvenlik nedeniyle bloke edilmiştir...",
  "risk_flags": ["FRAUD_CASE"],
  "sources": [
    {
      "doc_name": "sop_3",
      "source": "Bank_SOP_v1",
      "snippet": "Fraud şüphesi durumunda kartı hemen bloke edin...",
      "chunk_id": "sop_3:12"
    }
  ],
  "error_code": null
}
```

### POST /api/sikayet (Türkçe)

**Request:**
```json
{
  "metin": "Kartımdan bilgim dışında 500 TL çekilmiş."
}
```

**Response:**
```json
{
  "id": 42,
  "maskedText": "Kartımdan [MASKED_AMOUNT] TL çekilmiş.",
  "kategori": "DOLANDIRICILIK_YETKISIZ_ISLEM",
  "oncelik": "YUKSEK",
  "oneri": "Sayın müşterimiz, kartınız güvenlik nedeniyle bloke edilmiştir...",
  "durum": "ANALIZ_EDILDI",
  "kaynaklar": [
    {
      "dokuman_adi": "sop_3",
      "kaynak": "Bank_SOP_v1",
      "ozet": "Fraud Şüphesi: Karttan bilgisi dışında işlem yapıldığını..."
    }
  ],
  "insan_incelemesi_gerekli": false,
  "review_id": null,
  "guven_skorlari": {
    "kategori": 0.82,
    "oncelik": 0.76
  },
  "sistem_durumu": {
    "rag_durumu": "OK",
    "llm_durumu": "OK"
  },
  "review_sync_failed": false
}
```

### POST /api/analyze (English)

**Request:**
```json
{
  "text": "I cannot login to the mobile app."
}
```

**Response:**
```json
{
  "id": 42,
  "masked_text": "I cannot login to the mobile app.",
  "category": "ACCESS_LOGIN_MOBILE",
  "urgency": "MEDIUM",
  "recommendation": "We are reviewing your access issue...",
  "status": "ANALYZED",
  "sources": [
    {
      "dokuman_adi": "sop_1",
      "kaynak": "Bank_SOP_v1",
      "ozet": "Mobil giriş sorunlarında..."
    }
  ],
  "needs_human_review": false,
  "review_id": null,
  "confidence_scores": {
    "kategori": 0.77,
    "oncelik": 0.68
  },
  "system_status": {
    "rag_durumu": "OK",
    "llm_durumu": "OK"
  },
  "review_sync_failed": false
}
```

### GET /api/complaints

List all processed complaints.

### GET /api/complaints/{id}

Get complaint by ID.

### POST /api/complaints/{id}/hold

Move complaint to on-hold status.

---

## 🔐 Güvenlik & KVKK

| Özellik | Uygulama |
|---------|----------|
| **No Raw Text in DB** | `Complaint.originalText` alanı yok |
| **Fail-Closed PII** | Maskeleme hatası → `MASKING_FAILED` status |
| **Log Sanitization** | Sadece `masked_text_length` ve `masked_entity_count` loglanır |
| **Prompt Injection Guard** | `<system>`, ` ``` ` tag'leri temizlenir |
| **PII Leak Detection** | LLM çıktısı tekrar PII taramasından geçer, tespit edilirse bloklanır |
| **WebClient Timeouts** | 10s masking, 30s AI çağrıları için timeout |

---

## 🧪 Testler

```bash
# Java testleri
cd backend-java
mvn test

# Python testleri
cd backend-python
# Offline/CI için (Presidio model indirmeden çalıştırır)
PII_REGEX_ONLY=true pytest test_kvkk_compliance.py -v

# Frontend build
cd frontend-react
npm run build
```

### Test Coverage

- **KvkkComplianceTest.java** → Fail-closed, no-raw-text
- **SikayetSchemaTest.java** → Türkçe API kontratı
- **test_kvkk_compliance.py** → PII maskeleme, log sanitization

---

## 📁 Proje Yapısı

```
ComplaintOpsCopilot/
├── backend-java/
│   ├── src/main/java/com/complaintops/backend/
│   │   ├── ComplaintController.java   # REST API
│   │   ├── OrchestratorService.java   # İş akışı + timeouts
│   │   ├── Complaint.java             # Entity (no raw text)
│   │   └── DTOs.java                  # API kontratları
│   ├── Dockerfile                     # Multi-stage build
│   └── src/test/java/                 # KVKK testleri
│
├── backend-python/
│   ├── app/
│   │   ├── main.py                    # FastAPI endpoints
│   │   ├── api/routes.py              # Route handlers
│   │   ├── schemas.py                 # Pydantic models
│   │   ├── services/
│   │   │   ├── masking_service.py     # Presidio PII maskeleme
│   │   │   ├── triage_service.py      # ML kategorizasyon
│   │   │   ├── rag_service.py         # ChromaDB RAG
│   │   │   ├── llm_service.py         # LLM orchestration
│   │   │   ├── review_service.py      # Human review audit
│   │   │   └── llm_providers/         # OpenAI/Gemini/OpenRouter providers
│   │   ├── ml/                        # ML training scripts
│   │   └── rag/                       # RAG ingest scripts
│   ├── Dockerfile                     # Python service
│   └── test_kvkk_compliance.py        # KVKK testleri
│
├── frontend-react/
│   ├── App.tsx                        # Ana uygulama
│   ├── components/                    # UI bileşenleri
│   └── services/backendService.ts     # Backend API client
│
├── docker-compose.yml                 # Full stack deployment
│
└── docs/
    ├── postman_collection.json        # Demo collection
    └── evidence/                       # Test kanıtları
```

---

## 🎬 Demo Senaryosu (2 Dakika)

1. Frontend’i açın: `http://localhost:3000`
2. Örnek şikayet girin ve **Analizi Başlat**’a tıklayın.
3. Pipeline kartlarında Maskeleme → Triage → RAG → LLM → İnceleme durumlarını izleyin.
4. Kanıt kartlarından SOP özetlerini kontrol edin.
5. “İncele & Gönder” ile insan onayını simüle edin.

---

## ⚠️ Failure Modes (Hata Senaryoları)

| Senaryo | Sistem Davranışı |
|---------|------------------|
| **PII Maskeleme çöker** | Pipeline durur, raw text korunur, `MASKELEME_HATASI` döner |
| **RAG erişilemez** | Boş kaynak listesi, LLM devam eder |
| **LLM API çöker** | Template yanıt döner |
| **Triage hatası** | Varsayılan: `UNKNOWN` kategori, `ORTA` öncelik, `insan_incelemesi_gerekli: true` |
| **Düşük güven skoru** | `insan_incelemesi_gerekli: true`, review kaydı oluşur |
| **WebClient timeout** | 10s (mask) / 30s (AI) sonra graceful degradation |

---

## 🎯 Demo Senaryoları

### Senaryo 1: Dolandırıcılık Şikayeti
```json
{"metin": "Kartımdan bilgim dışında 5000 TL çekilmiş, TC: 12345678901"}
```
→ PII maskelenir → `FRAUD_UNAUTHORIZED_TX` → `YUKSEK` öncelik

### Senaryo 2: Transfer Gecikmesi
```json
{"metin": "EFT yaptım 3 saattir ulaşmadı"}
```
→ `TRANSFER_DELAY` → `ORTA` öncelik → FAST SOP önerisi

### Senaryo 3: Maskeleme Hatası (Fail-Closed)
Python servisi kapalıyken istek gönder → `MASKELEME_HATASI` status, raw text korunur

---

## 📜 Lisans

MIT License - Demo/MVP amaçlı
