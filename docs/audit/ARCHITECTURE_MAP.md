# ComplaintOps Copilot - Architecture Map

## Uçtan Uca Akış (Mermaid)

```mermaid
flowchart LR
  A[Frontend React] -->|/api/sikayet| B[Java Orchestrator]
  B -->|/mask| C[Python AI Service]
  C -->|masked_text| B
  B -->|/predict| C
  B -->|/retrieve| C
  B -->|/generate| C
  C -->|action_plan + draft| B
  B -->|masked only| D[(PostgreSQL)]
  B -->|/api/complaints| A

  C -->|review records (masked)| E[(SQLite review_store)]
  C -->|RAG| F[(ChromaDB)]
```

> **Not:** Java orchestrator kodu repo’da bulunmadığı için akış Java tarafında **UNKNOWN** kabul edilir.

---

## Veri Sınıfları ve Yaşam Döngüsü

| Veri Sınıfı | Tanım | Nerede Yaşar? | Durum |
|---|---|---|---|
| **Raw Text (PII olabilir)** | Müşteri şikayet metni | Frontend input (RAM) → Java orchestrator (RAM) | **DB’ye yazılmamalı** |
| **Masked Text** | PII maskelenmiş metin | Python AI servis (RAM) → Java → DB (PostgreSQL) → Review store (SQLite) | **İzinli** |
| **Derived Fields** | Kategori, öncelik, risk flag, SOP kaynakları | Python AI + Java | **İzinli** |
| **LLM Output** | Yanıt taslağı + action plan | Python AI → Java | **PII taramasından geçmeli** |

---

## Kaynak-of-Truth

- **Python şemaları:** `backend-python/app/schemas.py`
- **API şeması dokümantasyonu:** `docs/API_SCHEMA_TR_v2.md`
- **Java DTO’ları:** Repo’da mevcut değil (**UNKNOWN**)
