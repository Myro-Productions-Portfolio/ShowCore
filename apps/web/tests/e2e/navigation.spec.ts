import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
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
    });
    
    await page.goto('/');
  });

  test('should navigate to all main pages', async ({ page }) => {
    // Test Dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Test Discovery
    await page.click('a[href="/discovery"]');
    await expect(page).toHaveURL('/discovery');
    await expect(page.locator('h1')).toContainText('Discover');
    
    // Test Bookings
    await page.click('a[href="/bookings"]');
    await expect(page).toHaveURL('/bookings');
    await expect(page.locator('h1')).toContainText('Bookings');
    
    // Test Show Proof
    await page.click('a[href="/show-proof"]');
    await expect(page).toHaveURL('/show-proof');
    await expect(page.locator('h1')).toContainText('Show Proof');
    
    // Test Reviews
    await page.click('a[href="/reviews"]');
    await expect(page).toHaveURL('/reviews');
    await expect(page.locator('h1')).toContainText('Reviews');
    
    // Test Analytics
    await page.click('a[href="/analytics"]');
    await expect(page).toHaveURL('/analytics');
    await expect(page.locator('h1')).toContainText('Analytics');
    
    // Test Settings
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Test Help
    await page.click('a[href="/help"]');
    await expect(page).toHaveURL('/help');
    await expect(page.locator('h1')).toContainText('Help');
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Dashboard should be active by default
    await expect(page.locator('a[href="/"]')).toHaveClass(/bg-amber/);
    
    // Navigate to discovery
    await page.click('a[href="/discovery"]');
    await expect(page.locator('a[href="/discovery"]')).toHaveClass(/bg-amber/);
    
    // Dashboard should no longer be active
    await expect(page.locator('a[href="/"]')).not.toHaveClass(/bg-amber/);
  });

  test('should show notifications dropdown', async ({ page }) => {
    // Click notifications button
    await page.click('[data-testid="notifications-button"]');
    
    // Should show notifications dropdown
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=New Booking Request')).toBeVisible();
  });

  test('should show user menu', async ({ page }) => {
    // Click user menu
    await page.click('[data-testid="user-menu"]');
    
    // Should show user menu options
    await expect(page.locator('text=View Profile')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Sign out')).toBeVisible();
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Navigate directly to settings
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Navigate directly to discovery
    await page.goto('/discovery');
    await expect(page.locator('h1')).toContainText('Discover');
    
    // Navigate to non-existent page should show 404 or redirect
    await page.goto('/non-existent-page');
    // This would depend on your error handling implementation
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should still work
    await page.click('a[href="/discovery"]');
    await expect(page).toHaveURL('/discovery');
    
    // Mobile-specific elements should be visible
    // This would depend on your responsive design implementation
  });
});