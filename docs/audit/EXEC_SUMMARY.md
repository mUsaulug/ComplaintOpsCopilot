# ComplaintOps Copilot - Executive Summary (Audit)

Bu doküman, ComplaintOps Copilot reposunun uçtan uca incelemesi sonucunda bulunan **en kritik 10 bulgu** ve önerilen aksiyonları özetler. Kanıt ve detaylar için `docs/audit/FINDINGS.md` dosyasına bakınız.

## En Kritik 10 Bulgu + Aksiyonlar

1) **Java orchestrator kayıp / derlenemez** (BLOCKER)
   - **Risk:** Orchestrator olmadığı için TR/EN API kontratı, KVKK “no raw text” garantisi ve DB iş akışı doğrulanamaz; Docker build kırılır.
   - **Aksiyon:** `backend-java/src` ve Maven wrapper dosyaları eklenmeli; DTO/Controller/Entity/Service katmanları gerçek kaynak olarak repo içinde yer almalı.

2) **Java <-> Python kontrat testi kırık** (BLOCKER)
   - **Risk:** `/mask` `/predict` `/retrieve` `/generate` alan isimleri uyumsuzluğu prod ortamda data loss ve 500 hata üretir.
   - **Aksiyon:** Java DTO’ları eklenip `@JsonProperty` alanları Python şemalarıyla birebir hizalanmalı.

3) **PII maskeleme hatasında fail-closed davranışının servis seviyesinde garanti edilmesi gerekiyordu** (HIGH)
   - **Risk:** Maskeleme/PII taraması hata verirse akışın açık kalması PII sızıntısına yol açabilir.
   - **Aksiyon:** Python API’de maskeleme ve PII tarama hataları için `MASKING_FAILED` / `RAW_TEXT_REJECTED` bloklamaları zorunlu.

4) **Benzer şikayetler API’sinde raw text riski** (HIGH)
   - **Risk:** `/similar/{id}` endpoint’inde kullanıcıdan gelen `query_text` maskelemeden geçmeden embedding’e girerse raw PII işlenebilir.
   - **Aksiyon:** Query text maskelemeden geçirilmeli; index endpoint’i PII tespiti halinde fail-closed yapmalı.

5) **Repo içinde raw PII içeren örnek veri** (HIGH)
   - **Risk:** Test/dataset dosyalarında TCKN/IBAN formatında raw PII yer alıyor; KVKK açısından hassas içerik repo’da tutuluyor.
   - **Aksiyon:** Gerçekçi örnekler maskelenmeli veya synthetic/hashed hale getirilmeli; data governance notu eklenmeli.

6) **Frontend kategori/öncelik enum’ları backend kontratıyla uyumsuz** (MEDIUM)
   - **Risk:** UI’da yanlış kategori/öncelik gösterimi ve yanlış aksiyon tetiklenmesi.
   - **Aksiyon:** Frontend enum ve mapping tablosu API şeması ile senkronize edilmeli.

7) **Review kayıtları local SQLite, saklama/şifreleme politikası yok** (MEDIUM)
   - **Risk:** Maskelenmiş metinler bile regülasyon gereği saklama ve erişim kontrollerine tabi; merkezi audit politikası yok.
   - **Aksiyon:** Şifreli storage + retention policy + erişim logları planlanmalı.

8) **LLM çağrılarında timeout/retry policy ve rate-limit eksik** (MEDIUM)
   - **Risk:** Uzun süren çağrılar, DoS ve maliyet artışı.
   - **Aksiyon:** Provider seviyesinde timeout, retry/backoff ve rate limit eklenmeli.

9) **RAG embedding modeli Türkçe için uygun değil** (LOW)
   - **Risk:** Türkçe SOP’larda geri çağırım düşük, yanlış kaynak önerisi.
   - **Aksiyon:** Multilingual embedding modeli ve değerlendirme seti eklenmeli.

10) **Dokümantasyon/gerçek kaynak-of-truth uyuşmazlığı** (LOW)
   - **Risk:** README ve API şeması “uygulandı” diyor ama backend kodu yok; işletim süreçleri yanlış yönlenir.
   - **Aksiyon:** Docs’lar gerçek kodla senkronize edilmeli ve eksik alanlar “UNKNOWN” işaretlenmeli.

---

## Önerilen Acil Yol Haritası (Özet)

- **0–3 gün:** Java orchestrator temel iskeleti + DTO/Controller + DB entity’leri + kontrat testleri.
- **1 hafta:** KVKK “no raw text” fail-closed akışları + PII sanitization testleri + auth/rate limit.
- **2 hafta:** RAG model iyileştirme + LLM output guard + frontend kontrat senkronizasyonu.
