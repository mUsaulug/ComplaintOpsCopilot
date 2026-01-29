# ComplaintOps Copilot - Test Guide

Bu doküman, sistemin test süreçlerini ve doğrulama adımlarını içerir.

## 📋 Genel Bakış

Sistem üç seviyede test edilir:
1. **Smoke Tests:** Temel API fonksiyonları ve Failed-Closed senaryosu.
2. **Unit Tests:** Java ve Python servislerinin iç mantığı.
3. **E2E Tests:** UI üzerinden uçtan uca kullanıcı senaryoları (Playwright).

---

## 🚀 1. Otomatik Test Scripti (Önerilen)

Tüm backend testlerini (API + Unit + Fail-Closed) tek komutla çalıştırın:

```powershell
.\scripts\run_tests.ps1
```

Bu script şunları yapar:
- Servislerin (Java, Python) ayakta olduğunu kontrol eder.
- Türkçe şikayet ile API'yi test eder.
- Fail-Closed senaryosunu (Python servisini durdurarak) test eder.
- Container'lar içinde unit testleri çalıştırır.
- Sonuçları `docs/evidence/{tarih}/` altına kaydeder.

---

## 🎭 2. UI E2E Testleri (Playwright)

Tarayıcı tabanlı testler için Playwright kullanılır. Video kaydı ve ekran görüntüleri alınır.

### Gereksinimler
- Node.js 18+
- Servislerin çalışıyor olması (`docker compose up -d`)

### Çalıştırma
```bash
cd frontend-react
npx playwright test
```

### Senaryolar
| Test Dosyası | Açıklama |
|--------------|----------|
| `complaint-flow.spec.ts` | Normal şikayet akışı, PII maskeleme, Hata durumu |
| `advanced-scenarios.spec.ts` | Uzun metin, RAG detayları, Offline mod, Triage kontrolü |
| `a11y.spec.ts` | Erişilebilirlik (WCAG) kontrolü |

### Raporlama
Test bittiğinde raporu görmek için:
```bash
npx playwright show-report
```
Kanıtlar (Video/Screenshot): `docs/evidence/.../ui_screenshots`

---

## 🧪 3. Manuel Test Adımları

### Senaryo A: PII Maskeleme Doğrulaması
1. Frontend'i aç: http://localhost:3000
2. Metin Gir: `TC Kimlik: 12345678901`
3. Analiz Sonucunda PII'nin `[MASKED_TCKN]` olduğunu gör.
4. Logları kontrol et:
   ```bash
   docker compose logs complaintops-python | grep "12345678901"
   ```
   **Sonuç:** Hiçbir çıktı olmamalı.

### Senaryo B: Fail-Closed (Maskeleme Hatası)
1. Python servisini durdur: `docker compose stop complaintops-python`
2. Frontend'den şikayet gönder.
3. **Beklenen:** "Maskeleme servisine erişilemedi (Güvenlik nedeniyle işlem durduruldu)" hatası.

---

## 🛑 4. Güvenlik Denetimi

### API Key Kontrolü
Kod içinde hardcoded key olup olmadığını tarayın:
```bash
grep -r "sk-" .
```
*(Sadece .env ve .env.example dosyalarında olmalı)*

### Container Vulnerability Scan
(Eğer Trivy yüklü ise)
```bash
trivy image complaintopscopilot-python:latest
```
