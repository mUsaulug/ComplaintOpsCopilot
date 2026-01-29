import { test, expect } from '@playwright/test';

/**
 * ComplaintOps Copilot - E2E Test Suite
 * 
 * Bu testler frontend üzerinden tüm şikayet analiz akışını test eder.
 * Video ve screenshot kayıtları docs/evidence/ altına kaydedilir.
 */

test.describe('Şikayet Analiz Akışı', () => {

    test.beforeEach(async ({ page }) => {
        // Ana sayfaya git
        await page.goto('http://localhost:3000');
        // Sayfa yüklenene kadar bekle
        await page.waitForLoadState('networkidle');
    });

    test('normal şikayet analizi - başarılı akış', async ({ page }) => {
        // Şikayet metnini gir
        const complaintText = 'Kartımdan bilgim dışında 500 TL çekilmiş. Acil yardım istiyorum.';

        // Text area veya input bul
        const inputSelector = 'textarea, input[type="text"], [data-testid="complaint-input"]';
        await page.fill(inputSelector, complaintText);

        // Screenshot: Metin girildi
        await page.screenshot({
            path: 'docs/evidence/20260126_0539/ui_screenshots/01_complaint_entered.png',
            fullPage: true
        });

        // Analizi başlat butonuna tıkla
        const submitButton = page.locator('button:has-text("Analiz"), button:has-text("Başlat"), button:has-text("Gönder")').first();
        await submitButton.click();

        // Screenshot: Analiz başladı
        await page.screenshot({
            path: 'docs/evidence/20260126_0539/ui_screenshots/02_analysis_started.png',
            fullPage: true
        });

        // Pipeline adımlarını bekle (max 30 saniye)
        await page.waitForTimeout(15000); // İlk yanıt için bekle

        // Screenshot: Pipeline durumu
        await page.screenshot({
            path: 'docs/evidence/20260126_0539/ui_screenshots/03_pipeline_status.png',
            fullPage: true
        });

        // Sonuç alanlarını kontrol et
        await page.waitForTimeout(10000); // LLM yanıtı için bekle

        // Screenshot: Sonuç ekranı
        await page.screenshot({
            path: 'docs/evidence/20260126_0539/ui_screenshots/04_analysis_result.png',
            fullPage: true
        });

        // Sayfa içeriğini kontrol et - hata mesajı olmamalı
        const pageContent = await page.textContent('body');
        expect(pageContent).not.toContain('Error');
        expect(pageContent).not.toContain('500 Internal');
    });

    test('PII içeren şikayet - maskeleme kontrolü', async ({ page }) => {
        // PII içeren metin
        const piiText = 'TC: 12345678901, IBAN: TR12 0006 2000 1234 5678 9012 34, Tel: 05551234567';

        const inputSelector = 'textarea, input[type="text"], [data-testid="complaint-input"]';
        await page.fill(inputSelector, piiText);

        // Screenshot: PII içeren metin
        await page.screenshot({
            path: 'docs/evidence/20260126_0539/ui_screenshots/05_pii_input.png',
            fullPage: true
        });

        // Gönder
        const submitButton = page.locator('button:has-text("Analiz"), button:has-text("Başlat"), button:has-text("Gönder")').first();
        await submitButton.click();

        // Sonuç için bekle
        await page.waitForTimeout(15000);

        // Screenshot: PII maskeli sonuç
        await page.screenshot({
            path: 'docs/evidence/20260126_0539/ui_screenshots/06_pii_masked_result.png',
            fullPage: true
        });

        // Sayfa içeriğinde raw PII olmamalı
        const pageContent = await page.textContent('body');
        expect(pageContent).not.toContain('12345678901'); // TC
        expect(pageContent).not.toContain('05551234567'); // Tel
    });

    test('kategori ve öncelik gösterimi', async ({ page }) => {
        const complaintText = 'Dolandırıcılık şüphesi: Bilinmeyen bir işlem gördüm kartımda.';

        const inputSelector = 'textarea, input[type="text"], [data-testid="complaint-input"]';
        await page.fill(inputSelector, complaintText);

        const submitButton = page.locator('button:has-text("Analiz"), button:has-text("Başlat"), button:has-text("Gönder")').first();
        await submitButton.click();

        await page.waitForTimeout(15000);

        // Screenshot: Kategori ve öncelik
        await page.screenshot({
            path: 'docs/evidence/20260126_0539/ui_screenshots/07_category_priority.png',
            fullPage: true
        });

        // Kategori veya öncelik alanı görünür olmalı
        const pageContent = await page.textContent('body');
        const hasCategory = pageContent?.includes('Kategori') ||
            pageContent?.includes('FRAUD') ||
            pageContent?.includes('DOLANDIRICILIK');
        expect(hasCategory).toBeTruthy();
    });

});

test.describe('Hata Senaryoları', () => {

    test('boş metin gönderimi', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Boş metin ile gönder
        const submitButton = page.locator('button:has-text("Analiz"), button:has-text("Başlat"), button:has-text("Gönder")').first();

        // Buton disabled olabilir veya validasyon hatası
        await page.screenshot({
            path: 'docs/evidence/20260126_0539/ui_screenshots/08_empty_submit.png',
            fullPage: true
        });
    });

});
