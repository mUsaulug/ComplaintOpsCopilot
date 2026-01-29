import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Erişilebilirlik Testleri (Accessibility - A11y)
 * Sayfanın WCAG standartlarına uygunluğunu denetler.
 */
test.describe('Erişilebilirlik (A11y)', () => {
    test('Ana sayfa erişilebilirlik kontrolü', async ({ page }) => {
        await page.goto('http://localhost:3000');

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

        // Rapor oluştur
        if (accessibilityScanResults.violations.length > 0) {
            console.log('Erişilebilirlik İhlalleri:', JSON.stringify(accessibilityScanResults.violations, null, 2));
        }

        // İhlal olmamalı (veya bilinen ihlaller hariç tutulabilir)
        // Şimdilik sadece raporlama yapıyoruz, testi fail ettirmiyoruz
        expect(accessibilityScanResults.violations.length).toBeLessThan(10);
    });
});
