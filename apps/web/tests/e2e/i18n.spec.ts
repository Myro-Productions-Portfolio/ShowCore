import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    // Create test user and login
    await page.goto('/');
    await page.evaluate(() => {
      const testUser = {
        id: 'test_user_123',
        email: 'test@showcore.com',
        name: 'Test User',
        role: 'technician',
        profileComplete: true,
        emailVerified: true,
      };
      localStorage.setItem('showcore_user', JSON.stringify(testUser));
      localStorage.setItem('showcore_language', JSON.stringify('en'));
    });
    
    await page.goto('/settings');
    await page.click('button:has-text("Appearance")');
  });

  test('should display English content by default', async ({ page }) => {
    // Check English content in settings
    await expect(page.locator('h2')).toContainText('Appearance Settings');
    await expect(page.locator('text=Theme')).toBeVisible();
    await expect(page.locator('text=Font Size')).toBeVisible();
    await expect(page.locator('text=Language')).toBeVisible();
  });

  test('should change to Spanish and show translated content', async ({ page }) => {
    // Change language to Spanish
    await page.selectOption('select[id="language"]', 'es');
    
    // Wait for language change to take effect
    await page.waitForTimeout(500);
    
    // Check that Spanish content is displayed
    await expect(page.locator('h2')).toContainText('Configuración de Apariencia');
    await expect(page.locator('text=Tema')).toBeVisible();
    await expect(page.locator('text=Tamaño de Fuente')).toBeVisible();
    await expect(page.locator('text=Idioma')).toBeVisible();
  });

  test('should change to French and show translated content', async ({ page }) => {
    // Change language to French
    await page.selectOption('select[id="language"]', 'fr');
    
    // Wait for language change to take effect
    await page.waitForTimeout(500);
    
    // Check that French content is displayed
    await expect(page.locator('h2')).toContainText('Paramètres d\'Apparence');
    await expect(page.locator('text=Thème')).toBeVisible();
    await expect(page.locator('text=Taille de Police')).toBeVisible();
    await expect(page.locator('text=Langue')).toBeVisible();
  });

  test('should persist language selection across page reloads', async ({ page }) => {
    // Change to Spanish
    await page.selectOption('select[id="language"]', 'es');
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    
    // Should still show Spanish content
    await expect(page.locator('h2')).toContainText('Configuración de Apariencia');
    
    // Language selector should show Spanish as selected
    const selectedValue = await page.locator('select[id="language"]').inputValue();
    expect(selectedValue).toBe('es');
  });

  test('should update HTML lang attribute when language changes', async ({ page }) => {
    // Check initial lang attribute
    let htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
    
    // Change to Spanish
    await page.selectOption('select[id="language"]', 'es');
    await page.waitForTimeout(500);
    
    // Check updated lang attribute
    htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('es');
    
    // Change to French
    await page.selectOption('select[id="language"]', 'fr');
    await page.waitForTimeout(500);
    
    // Check updated lang attribute
    htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('fr');
  });

  test('should show all available language options', async ({ page }) => {
    const languageSelect = page.locator('select[id="language"]');
    
    // Check that all expected languages are available
    await expect(languageSelect.locator('option[value="en"]')).toContainText('English');
    await expect(languageSelect.locator('option[value="es"]')).toContainText('Español');
    await expect(languageSelect.locator('option[value="fr"]')).toContainText('Français');
    await expect(languageSelect.locator('option[value="de"]')).toContainText('Deutsch');
    await expect(languageSelect.locator('option[value="it"]')).toContainText('Italiano');
    await expect(languageSelect.locator('option[value="pt"]')).toContainText('Português');
    await expect(languageSelect.locator('option[value="ja"]')).toContainText('日本語');
    await expect(languageSelect.locator('option[value="zh"]')).toContainText('中文');
    await expect(languageSelect.locator('option[value="ko"]')).toContainText('한국어');
  });

  test('should handle language fallback gracefully', async ({ page }) => {
    // Manually set an unsupported language in localStorage
    await page.evaluate(() => {
      localStorage.setItem('showcore_language', JSON.stringify('xx'));
    });
    
    // Reload page
    await page.reload();
    
    // Should fallback to English
    await expect(page.locator('h2')).toContainText('Appearance Settings');
    
    // Language selector should show English as selected
    const selectedValue = await page.locator('select[id="language"]').inputValue();
    expect(selectedValue).toBe('en');
  });
});