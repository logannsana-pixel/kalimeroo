import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page with key elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for service types section
    await expect(page.getByText(/restaurants/i)).toBeVisible();
    
    // Check for bottom navigation on mobile
    if (page.viewportSize()?.width && page.viewportSize()!.width < 768) {
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
    }
  });

  test('should navigate to restaurants page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /restaurants/i }).first().click();
    
    await expect(page).toHaveURL(/.*restaurants/);
  });

  test('should display food categories', async ({ page }) => {
    await page.goto('/');
    
    // Wait for categories to load
    await page.waitForLoadState('networkidle');
    
    // Should have category items
    const categories = page.locator('[data-testid="food-category"]');
    await expect(categories.first()).toBeVisible({ timeout: 10000 });
  });
});
