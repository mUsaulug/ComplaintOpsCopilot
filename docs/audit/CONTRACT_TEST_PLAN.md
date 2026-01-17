# Contract Test Plan (TR/EN + AI Service)

## 1) Türkçe API: `/api/sikayet`

| Case | Input | Expected | Negative? |
|---|---|---|---|
| TR-01 | `{metin: "..."}` | `kategori`, `oncelik`, `durum` alanları dolu | ❌ |
| TR-02 | `metin` < 20 char | `400` + hata mesajı | ✅ |
| TR-03 | PII içerir | `maskedText` DB’ye yazılır, raw text yok | ✅ |
| TR-04 | Masking fail | `durum=MASKELEME_HATASI` | ✅ |

## 2) English API: `/api/analyze`

| Case | Input | Expected | Negative? |
|---|---|---|---|
| EN-01 | `{text: "..."}` | `category`, `urgency`, `status` alanları dolu | ❌ |
| EN-02 | Unknown category | `category=UNKNOWN` | ✅ |
| EN-03 | LLM fail | `error_code` + template response | ✅ |

## 3) Python AI Service

### `/mask`
- **Positive:** Masked text döner, `original_text` yok.
- **Negative:** Presidio error → `503 MASKING_FAILED` (fail-closed).

### `/predict`
- **Positive:** category + urgency + confidence alanları.
- **Negative:** model_loaded=false ise fallback değerler.

### `/retrieve`
- **Positive:** relevant_sources listesi.
- **Negative:** RAG down → boş kaynak listesi.

### `/generate`
- **Positive:** action_plan + customer_reply_draft + sources.
- **Negative:** PII leak → `error_code=PII_BLOCKED` + fallback response.

### `/index-complaint`
- **Positive:** masked_text ile indexing.
- **Negative:** raw PII tespit → `400 RAW_TEXT_REJECTED`.

### `/similar/{complaint_id}`
- **Positive:** masked query_text ile similarity listesi.
- **Negative:** masking fail → `503 MASKING_FAILED`.

---

## 4) Enum Mapping Matrix

| EN | TR |
|---|---|
| FRAUD_UNAUTHORIZED_TX | DOLANDIRICILIK_YETKISIZ_ISLEM |
| CHARGEBACK_DISPUTE | IADE_ITIRAZ |
| TRANSFER_DELAY | TRANSFER_GECIKMESI |
| ACCESS_LOGIN_MOBILE | ERISIM_GIRIS_MOBIL |
| CARD_LIMIT_CREDIT | KART_LIMIT_KREDI |
| INFORMATION_REQUEST | BILGI_TALEBI |
| CAMPAIGN_POINTS_REWARDS | KAMPANYA_PUAN_ODUL |
| UNKNOWN | MANUEL_INCELEME |

---

## 5) Timeout & Fallback Testleri

- Masking timeout → 503 + fail-closed.
- LLM timeout → Template fallback + risk flag.
- RAG timeout → empty sources + `RAG_UNAVAILABLE` flag.
