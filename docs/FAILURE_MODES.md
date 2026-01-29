# ComplaintOps Copilot - Failure Modes (Hata Senaryoları)

Bu doküman, sistemin çeşitli hata durumlarında nasıl davrandığını açıklar.

---

## 1. PII Maskeleme Hatası (FAIL-CLOSED) ⚠️ KRİTİK

**Senaryo:** Python AI servisi çöker veya erişilemez.

**Davranış:**
- Pipeline **hemen durur**
- Raw text **asla** LLM/DB/log'a gitmez
- `durum: MASKELEME_HATASI` döner
- `kategori: MANUEL_INCELEME` otomatik atanır

**Response:**
```json
{
  "durum": "MASKELEME_HATASI",
  "kategori": "MANUEL_INCELEME",
  "oncelik": "YUKSEK",
  "oneri": "Şikayetiniz alındı. Manuel inceleme için yönlendirildi."
}
```

**Kanıt:** [OrchestratorService.java:L49-61](file:///c:/Users/monster/Desktop/system-main/ComplaintOpsCopilot/backend-java/src/main/java/com/complaintops/backend/OrchestratorService.java#L49-L61)

---

## 2. RAG Retrieval Hatası

**Senaryo:** ChromaDB erişilemez veya `/retrieve` timeout.

**Mevcut Davranış:**
- Boş kaynak listesi döner: `kaynaklar: []`
- LLM hala çağrılır (RAG fallback)
- Log: `RAG failed: {hata mesajı}`

**Hedef Davranış (P1):**
- `durum: KAYNAK_BULUNAMADI_DEVAM` flag'i eklenebilir
- risk_flags'e `RAG_UNAVAILABLE` eklenir

**Kanıt:** [OrchestratorService.java:L108-112](file:///c:/Users/monster/Desktop/system-main/ComplaintOpsCopilot/backend-java/src/main/java/com/complaintops/backend/OrchestratorService.java#L108-L112)

---

## 3. LLM Generate Hatası

**Senaryo:** OpenAI API erişilemez veya timeout.

**Mevcut Davranış:**
- Template fallback yanıt döner
- `oneri: "Şikayetiniz alındı. En kısa sürede size dönüş yapılacaktır."`
- Log: `Generation failed: {hata mesajı}`

**Hedef Davranış (P1):**
- `durum: YANIT_URETILEMEDI_TEMPLATE` flag'i
- risk_flags'e `LLM_UNAVAILABLE` eklenir

**Kanıt:** [OrchestratorService.java:L128-134](file:///c:/Users/monster/Desktop/system-main/ComplaintOpsCopilot/backend-java/src/main/java/com/complaintops/backend/OrchestratorService.java#L128-L134)

---

## 4. Triage Model Hatası

**Senaryo:** ML model yüklenemez veya `/predict` çöker.

**Mevcut Davranış:**
- Varsayılan değerler atanır:
  - `kategori: MANUAL_REVIEW`
  - `oncelik: MEDIUM`
  - `insan_incelemesi_gerekli: true`

**Kanıt:** [OrchestratorService.java:L90-96](file:///c:/Users/monster/Desktop/system-main/ComplaintOpsCopilot/backend-java/src/main/java/com/complaintops/backend/OrchestratorService.java#L90-L96)

---

## 5. Veritabanı Hatası

**Senaryo:** PostgreSQL erişilemez.

**Mevcut Davranış:**
- Spring JPA exception fırlatır
- HTTP 500 döner (iyileştirilmeli)

**Hedef Davranış (P1):**
- Graceful error response
- `durum: GECICI_SORUN_MANUEL_INCELEME`

---

## Özet Tablosu

| Hata | Mevcut | Hedef (P1) | Kritiklik |
|------|--------|------------|-----------|
| Maskeleme çöker | ✅ Fail-closed | - | ⚠️ Kritik |
| RAG çöker | ✅ Boş kaynak | Graceful flag | Orta |
| LLM çöker | ✅ Template | Graceful flag | Orta |
| Triage çöker | ✅ Default | - | Düşük |
| DB çöker | ❌ 500 error | Graceful | Yüksek |

---

## README'ye Eklenecek Bölüm

```markdown
## Failure Modes

| Senaryo | Sistem Davranışı |
|---------|------------------|
| **PII Maskeleme çöker** | Pipeline durur, raw text korunur, `MASKELEME_HATASI` döner |
| **RAG çöker** | Boş kaynak listesi, LLM devam eder |
| **LLM çöker** | Template yanıt döner |
| **Düşük güven** | `insan_incelemesi_gerekli: true`, review kaydı oluşur |

Detaylar için: [docs/FAILURE_MODES.md](docs/FAILURE_MODES.md)
```


---

## 6. Infrastructure Hataları (Runtime/Deployment)

### 6.1 Gunicorn Worker OOM Loop
**Senaryo:** Python container RAM yetersizliği veya yanlış konfigürasyon.
**Belirti:**
- Log: `Worker was sent SIGKILL! Perhaps out of memory?`
- Log: `WORKER TIMEOUT`
- Container sürekli restart eder.

**Çözüm (Uygulanan):**
- `WEB_CONCURRENCY=1` (Tek worker)
- `--preload` (Modeli master process yükler, copy-on-write RAM tasarrufu)
- `TIMEOUT=300` (Büyük modellerin yüklenmesi için 5dk süre)
- Build-time model download (Runtime'da indirme engellendi)

### 6.2 Docker Build Context Şişmesi
**Senaryo:** `python-ai` build context root folder ise.
**Belirti:** Build sırasında GB'larca veri transferi.
**Çözüm:** `.dockerignore` dosyası ile `venv`, `node_modules`, `data` hariç tutuldu.

### 6.3 PyTorch GPU Bloom
**Senaryo:** `sentence-transformers` varsayılan olarak CUDA/Nvidia bağımlılıklarını çeker.
**Belirti:** İmaj boyutu > 6GB, build süresi çok uzun.
**Çözüm:** Dockerfile'da `pip install torch --index-url https://download.pytorch.org/whl/cpu` ile CPU-only zorlandı.

---

*Bu doküman v1.1 - 26 Ocak 2026*
