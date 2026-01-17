# Product Gaps & Roadmap

## MVP’de Kritik Ürün Boşlukları

1) **Java Orchestrator Eksikliği** → UI/DB/Workflow gerçek akış çalışmıyor.
2) **KVKK Kanıtlanabilirliği** → Fail-closed davranışının uçtan uca kanıtı yok.
3) **SLA & Human-in-the-loop** → SLA/priority policy tanımlı değil; queue management yok.
4) **Audit & Explainability** → SOP kaynakları var ama audit trail merkezi değil.
5) **Contract Test Automation** → Java/Python/Frontend sözleşme testleri kopuk.

---

## 2 Haftalık “Demo-Ready Hardening” Planı

**Hafta 1**
- Java orchestrator minimal API (TR/EN) + DB entity + DTO + WebClient çağrıları.
- KVKK fail-closed testleri (mask fail, PII leak, raw text rejection).
- Frontend enum ve API mapping uyumu.

**Hafta 2**
- Auth + rate limit + request id propagation.
- LLM provider timeout/retry/backoff.
- RAG eval seti + toplu ölçüm raporu.
- CI pipeline: `mvn test` + `pytest` + frontend build.

---

## 6 Haftalık “Interview Showcase” Planı (Kanıt Odaklı)

**Sprint 1 (Hafta 1-2)**
- Full contract tests (TR/EN endpoints, negative cases).
- KVKK kanıt dosyaları + redaction logs.

**Sprint 2 (Hafta 3-4)**
- Human-in-the-loop workflow (queue, SLA, manual override).
- Audit dashboard (review_id, change history, SOP traceability).

**Sprint 3 (Hafta 5-6)**
- RAG kalite ölçümü (precision/recall) + model card.
- Security hardening: OPA policy, secret management, SBOM.
