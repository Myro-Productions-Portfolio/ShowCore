import { Page } from '@playwright/test';

/**
 * Test utilities for ShowCore application
 */

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'technician' | 'company';
  profileComplete: boolean;
  emailVerified: boolean;
  avatar?: string;
}

/**
 * Create a test user and store in localStorage
 */
export async function createTestUser(page: Page, user?: Partial<TestUser>): Promise<TestUser> {
  const defaultUser: TestUser = {
    id: 'test_user_123',
    email: 'test@showcore.com',
    name: 'Test User',
    role: 'technician',
    profileComplete: true,
    emailVerified: true,
    ...user,
  };

  await page.evaluate((userData) => {
    localStorage.setItem('showcore_user', JSON.stringify(userData));
  }, defaultUser);

  return defaultUser;
}

/**
 * Set default app settings
 */
export async function setDefaultSettings(page: Page, settings?: {
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  language?: string;
}) {
  const defaultSettings = {
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
    ...settings,
  };

  await page.evaluate((settingsData) => {
    localStorage.setItem('showcore_theme', JSON.stringify(settingsData.theme));
    localStorage.setItem('showcore_font_size', JSON.stringify(settingsData.fontSize));
    localStorage.setItem('showcore_language', JSON.stringify(settingsData.language));
  }, defaultSettings);
}

/**
 * Clear all app storage
 */
export async function clearAppStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Login with test user
 */
export async function loginWithTestUser(page: Page, user?: Partial<TestUser>) {
  await clearAppStorage(page);
  await createTestUser(page, user);
  await setDefaultSettings(page);
  await page.goto('/');
}

/**
 * Wait for navigation and ensure page is loaded
 */
export async function waitForPageLoad(page: Page, expectedUrl?: string) {
  if (expectedUrl) {
    await page.waitForURL(expectedUrl);
  }
  await page.waitForLoadState('networkidle');
}

/**
 * Take a screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `tests/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Check if element has specific CSS class
 */
export async function hasClass(page: Page, selector: string, className: string): Promise<boolean> {
  const element = page.locator(selector);
  const classAttribute = await element.getAttribute('class');
  return classAttribute?.includes(className) || false;
}

/**
 * Get localStorage value
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<any> {
  return await page.evaluate((storageKey) => {
    const item = localStorage.getItem(storageKey);
    return item ? JSON.parse(item) : null;
  }, key);
}

/**
 * Set localStorage value
 */
export async function setLocalStorageItem(page: Page, key: string, value: any) {
  await page.evaluate(({ storageKey, storageValue }) => {
    localStorage.setItem(storageKey, JSON.stringify(storageValue));
  }, { storageKey: key, storageValue: value });
}

/**
 * Wait for element to be visible with timeout
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.locator(selector).waitFor({ state: 'visible', timeout });
}

/**
 * Fill form field and wait for it to be updated
 */
export async function fillAndWait(page: Page, selector: string, value: string) {
  await page.fill(selector, value);
  await page.waitForFunction(
    ({ sel, val }) => {
      const element = document.querySelector(sel) as HTMLInputElement;
      return element && element.value === val;
    },
    { selector, value }
  );
}

/**
 * Click and wait for navigation
 */
export async function clickAndWaitForNavigation(page: Page, selector: string, expectedUrl?: string) {
  await Promise.all([
    expectedUrl ? page.waitForURL(expectedUrl) : page.waitForNavigation(),
    page.click(selector)
  ]);
}

/**
 * Mock API responses for testing
 */
export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Test responsive design at different viewport sizes
 */
export const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
};

export async function testAtViewport(page: Page, size: keyof typeof VIEWPORT_SIZES, testFn: () => Promise<void>) {
  await page.setViewportSize(VIEWPORT_SIZES[size]);
  await testFn();
}

/**
 * Check accessibility basics
 */
export async function checkBasicAccessibility(page: Page) {
  // Check for alt text on images
  const images = page.locator('img');
  const imageCount = await images.count();
  
  for (let i = 0; i < imageCount; i++) {
    const img = images.nth(i);
    const alt = await img.getAttribute('alt');
    if (alt === null) {
      console.warn(`Image ${i} missing alt attribute`);
    }
  }
  
  // Check for proper heading hierarchy
  const headings = page.locator('h1, h2, h3, h4, h5, h6');
  const headingCount = await headings.count();
  
  if (headingCount === 0) {
    console.warn('No headings found on page');
  }
  
  // Check for form labels
  const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"], textarea, select');
  const inputCount = await inputs.count();
  
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    
    if (id) {
      const label = page.locator(`label[for="${id}"]`);
      const labelExists = await label.count() > 0;
      
      if (!labelExists && !ariaLabel) {
        console.warn(`Input ${i} missing associated label`);
      }
    }
  }
}