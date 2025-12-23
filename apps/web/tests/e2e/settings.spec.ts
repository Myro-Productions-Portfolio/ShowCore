import { test, expect } from '@playwright/test';

test.describe('Settings & Theming', () => {
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
      localStorage.setItem('showcore_theme', JSON.stringify('light'));
      localStorage.setItem('showcore_font_size', JSON.stringify('medium'));
      localStorage.setItem('showcore_language', JSON.stringify('en'));
    });
    
    await page.goto('/settings');
  });

  test('should display settings page correctly', async ({ page }) => {
    // Should show settings header
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Should show role toggle
    await expect(page.locator('button:has-text("Technician")')).toBeVisible();
    await expect(page.locator('button:has-text("Company")')).toBeVisible();
    
    // Should show appearance settings by default
    await expect(page.locator('h2')).toContainText('Appearance Settings');
  });

  test('should change theme successfully', async ({ page }) => {
    // Navigate to appearance settings
    await page.click('button:has-text("Appearance")');
    
    // Should show theme options
    await expect(page.locator('text=Theme')).toBeVisible();
    
    // Click dark theme
    await page.click('input[value="dark"]');
    
    // Check that dark theme is applied
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
    
    // Check localStorage
    const storedTheme = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('showcore_theme') || '""')
    );
    expect(storedTheme).toBe('dark');
  });

  test('should change font size successfully', async ({ page }) => {
    await page.click('button:has-text("Appearance")');
    
    // Click large font size
    await page.click('input[value="large"]');
    
    // Check that large font class is applied
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('text-lg');
    
    // Check localStorage
    const storedFontSize = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('showcore_font_size') || '""')
    );
    expect(storedFontSize).toBe('large');
  });

  test('should change language successfully', async ({ page }) => {
    await page.click('button:has-text("Appearance")');
    
    // Change language to Spanish
    await page.selectOption('select[id="language"]', 'es');
    
    // Check that language is stored
    const storedLanguage = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('showcore_language') || '""')
    );
    expect(storedLanguage).toBe('es');
    
    // Check that HTML lang attribute is updated
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('es');
  });

  test('should switch between technician and company roles', async ({ page }) => {
    // Should start with technician selected
    await expect(page.locator('button:has-text("Technician")')).toHaveClass(/bg-white/);
    
    // Click company button
    await page.click('button:has-text("Company")');
    
    // Company should be selected
    await expect(page.locator('button:has-text("Company")')).toHaveClass(/bg-white/);
    
    // Should show different settings sections for company
    // (This would depend on your actual implementation)
  });

  test('should persist settings across page reloads', async ({ page }) => {
    // Change settings
    await page.click('button:has-text("Appearance")');
    await page.click('input[value="dark"]');
    await page.click('input[value="large"]');
    await page.selectOption('select[id="language"]', 'fr');
    
    // Reload page
    await page.reload();
    
    // Settings should be preserved
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
    expect(htmlClass).toContain('text-lg');
    
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('fr');
  });

  test('should show debug information', async ({ page }) => {
    await page.click('button:has-text("Appearance")');
    
    // Should show debug info section
    await expect(page.locator('text=Debug Info:')).toBeVisible();
    await expect(page.locator('text=Current theme:')).toBeVisible();
    await expect(page.locator('text=HTML classes:')).toBeVisible();
  });
});