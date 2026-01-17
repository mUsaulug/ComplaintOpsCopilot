# KVKK & Security Model

## 1) Tehdit Modeli (STRIDE özeti)

| Threat | Açıklama | Örnek | Kontrol Durumu |
|---|---|---|---|
| **S**poofing | API’ye yetkisiz erişim | Auth/Ratelimit yok | **Açık** |
| **T**ampering | LLM output manipülasyonu | Prompt injection | Kısmi (input sanitize) |
| **R**epudiation | Audit trail eksikliği | Review logs lokal | Kısmi |
| **I**nfo Disclosure | Raw PII sızıntısı | Similarity query_text | **Kritik (fix eklendi)** |
| **D**oS | Uzun LLM çağrıları | Timeout/retry yok | Açık |
| **E**levation | Service-level abuse | Rate limit yok | Açık |

---

## 2) “No Raw Text” ve “Fail-Closed” Kanıtları

### Python AI Service
- **Raw PII response engeli:** `/mask` endpoint’i yalnızca masked_text döner.
- **Fail-closed maskeleme:** Maskeleme hatası `MASKING_FAILED` ile bloklanır.
- **LLM output taraması:** Output PII tespiti halinde bloklanır (`PII_BLOCKED`).
- **Similarity endpoint:** Raw query text maskelemeden geçer.

### Java Orchestrator
- **Durum:** **UNKNOWN** (Java kaynakları repo’da bulunmuyor).

---

## 3) Log Redaction Standardı

- **Yalnızca masked_text_length + entity types loglanmalı**.
- **Raw PII asla loglanmamalı**.
- Logging formatı JSON (request_id ile). 

---

## 4) LLM Output Güvenliği

- **Input sanitize:** Prompt injection filtreleri (``` ve system tags).
- **Output validation:** JSON parse + Pydantic model doğrulama.
- **PII scan:** LLM output, mask scan sonrası bloklanır.
- **Fail-closed:** PII scan hata verirse çıktı bloklanır.

---

## 5) Önerilen Ek Güvenlik Kontrolleri

- Auth (JWT/API key) + rate limit.
- Provider timeout + retry/backoff.
- SOP/RAG kaynaklarına read-only erişim.
- Audit log merkezi ve WORM storage.
