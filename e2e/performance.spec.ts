import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (generous for slow connections)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/');
    
    // Check that images have loading="lazy" attribute
    const images = page.locator('img[loading="lazy"]');
    const count = await images.count();
    
    // Should have at least some lazy-loaded images
    expect(count).toBeGreaterThan(0);
  });

  test('should have service worker registered for PWA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if service worker is registered
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    // PWA should have service worker
    expect(swRegistration).toBe(true);
  });

  test('should work offline after initial load (PWA)', async ({ page, context }) => {
    // Load the page first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate - should show cached content or offline message
    await page.reload();
    
    // Should still show something (cached content)
    await expect(page.locator('body')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have at least one h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/restaurants');
    await page.waitForLoadState('networkidle');
    
    // Check that images have alt attributes
    const imagesWithoutAlt = page.locator('img:not([alt])');
    const count = await imagesWithoutAlt.count();
    
    // Should have no images without alt text
    expect(count).toBe(0);
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first button
    await page.keyboard.press('Tab');
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });
});
