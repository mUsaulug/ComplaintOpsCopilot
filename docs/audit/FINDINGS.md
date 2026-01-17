# ComplaintOps Copilot - Findings

Aşağıdaki bulgular, repo içi kanıtlarla doğrulanmıştır. Her bulgu için **kanıt**, **risk**, **fix**, **patch** ve **test** bilgisi sağlanır.

---

## CO-001
- **Severity:** BLOCKER
- **Alan:** Java
- **Kanıt:** `backend-java/Dockerfile` Maven wrapper ve `src` dizini bekliyor; repo içinde bu dosyalar yok. Ayrıca README Java kaynakları varmış gibi gösteriyor.
- **Risk:** Java orchestrator build/run edilemez. TR/EN API kontratı ve KVKK “no raw text” garantileri doğrulanamaz.
- **Fix:** `backend-java/src/main/java` ve `mvnw/.mvn` dosyalarını repo’ya ekle; Controller/Service/DTO/Entity katmanlarını oluştur.
- **Patch:** UYGULANMADI (kapsam büyük, backend code eksik).
- **Test:** `mvn -q test` (Java kaynakları eklendikten sonra).

## CO-002
- **Severity:** BLOCKER
- **Alan:** Java/Python
- **Kanıt:** Python testleri Java DTO dosyasını bekliyor; dosya yoksa test fail olur.
- **Risk:** CI pipeline kırılır ve kontrat uyumu otomatik doğrulanamaz.
- **Fix:** Java DTO’larını ekle ve Python şemalarıyla aynı JSON alanları kullan.
- **Patch:** UYGULANMADI (Java kaynakları eksik).
- **Test:** `pytest -q backend-python/tests/test_java_contract_alignment.py`.

## CO-003
- **Severity:** HIGH
- **Alan:** Python/KVKK
- **Kanıt:** Maskeleme/PII taraması hata verirse fail-closed garanti edilmelidir; yeni guard eklenmiştir.
- **Risk:** Maskeleme hatası PII sızıntısına neden olabilir.
- **Fix:** Maskeleme hatasında `MASKING_FAILED` dön ve akışı durdur.
- **Patch:** `app/api/routes.py` içinde maskeleme try/except + `503` bloklama eklendi.
- **Test:** Yeni negatif test eklenmeli: maskeleme exception -> `503`.

## CO-004
- **Severity:** HIGH
- **Alan:** Python/KVKK
- **Kanıt:** `/similar/{id}` endpoint’inde `query_text` maskelemeden önce embedding’e gidiyordu.
- **Risk:** Raw PII embedding veya loglarda kalabilir.
- **Fix:** `query_text` maskelemeden geçirilmeli.
- **Patch:** `app/api/routes.py` içinde `query_text` sanitize edildi.
- **Test:** Yeni negatif test: raw TCKN içeren query -> PII maskeden sonra embedding.

## CO-005
- **Severity:** HIGH
- **Alan:** Python/KVKK
- **Kanıt:** `/index-complaint` endpoint’i raw text’i kabul edebilecek durumdaydı.
- **Risk:** Maskelenmemiş şikayetlerin embedding index’e girmesi KVKK ihlali.
- **Fix:** PII tespiti halinde request’i `400 RAW_TEXT_REJECTED` ile blokla.
- **Patch:** `app/api/routes.py` içinde PII taraması ve bloklama eklendi.
- **Test:** Yeni negatif test: raw TCKN içeren index request -> `400`.

## CO-006
- **Severity:** HIGH
- **Alan:** Data/KVKK
- **Kanıt:** `backend-python/data/golden_set.json` içinde raw TCKN/IBAN örnekleri var.
- **Risk:** Repo içinde raw PII barındırma KVKK ve bilgi güvenliği riskidir.
- **Fix:** Dataset’leri maskelenmiş/synthetic hale getir; data governance notu ekle.
- **Patch:** UYGULANMADI (veri seti değişimi kararı gerekli).
- **Test:** Data lint kontrolü (PII regex scan) eklenmeli.

## CO-007
- **Severity:** MEDIUM
- **Alan:** Frontend/Contract
- **Kanıt:** Frontend enum’ları backend kategori/öncelik şemasıyla tam uyumlu değil.
- **Risk:** UI yanlış kategori/öncelik gösterebilir.
- **Fix:** `frontend-react/types.ts` ve `dataAdapter.ts` mapping’i API şemasıyla hizala.
- **Patch:** UYGULANMADI (backend kontratı netleşmeli).
- **Test:** Frontend contract test (snapshot) önerilir.

## CO-008
- **Severity:** MEDIUM
- **Alan:** Python/Review
- **Kanıt:** Review kayıtları SQLite’da tutuluyor, encryption/retention policy yok.
- **Risk:** Maskelenmiş veriler bile regülasyon kapsamında; erişim/audit politikası eksik.
- **Fix:** Şifreli storage + retention + erişim logları.
- **Patch:** UYGULANMADI (mimari karar gerekli).
- **Test:** Veri saklama policy testi ve migration.

## CO-009
- **Severity:** MEDIUM
- **Alan:** Python/LLM
- **Kanıt:** Provider çağrılarında timeout/retry policy yok; tek seferde başarısız olabilir.
- **Risk:** Uzun süren çağrılar DoS ve maliyet artışı yaratabilir.
- **Fix:** Provider seviyesinde timeout + retry/backoff + circuit breaker.
- **Patch:** UYGULANMADI.
- **Test:** Timeout simülasyonu ve retry testi.

## CO-010
- **Severity:** MEDIUM
- **Alan:** Security/API
- **Kanıt:** FastAPI layer’da auth/rate limit yok.
- **Risk:** Unauthorized kullanım ve brute-force/dos riski.
- **Fix:** JWT/API key + rate limit middleware.
- **Patch:** UYGULANMADI.
- **Test:** Auth-required endpoint testleri.

## CO-011
- **Severity:** LOW
- **Alan:** RAG/ML
- **Kanıt:** `rag_service.py` default embedding kullanıyor; Türkçe için uygun model önerisi yorum satırında.
- **Risk:** Türkçe geri çağırım düşebilir.
- **Fix:** Multilingual embedding + değerlendirme seti.
- **Patch:** UYGULANMADI.
- **Test:** RAG eval (precision/recall) eklenmeli.

## CO-012
- **Severity:** LOW
- **Alan:** Docs/Truth Source
- **Kanıt:** README ve API şeması Java kaynaklarının varlığını ve testleri işaret ediyor; repo’da Java kodu yok.
- **Risk:** Dokümantasyon ve gerçek kaynak-of-truth uyuşmuyor.
- **Fix:** Docs’ları gerçek kod durumu ile senkronize et ve eksikleri işaretle.
- **Patch:** UYGULANMADI (dokümantasyon revizyonu planlanmalı).
- **Test:** Dokümantasyon doğruluk checklist’i.
