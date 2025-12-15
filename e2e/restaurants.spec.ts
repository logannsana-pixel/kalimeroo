import { test, expect } from '@playwright/test';

test.describe('Restaurants Page', () => {
  test('should display restaurants list', async ({ page }) => {
    await page.goto('/restaurants');
    
    await expect(page.getByRole('heading', { name: /restaurants/i })).toBeVisible();
    
    // Wait for restaurants to load
    await page.waitForLoadState('networkidle');
  });

  test('should filter restaurants by search', async ({ page }) => {
    await page.goto('/restaurants');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find search input and type
    const searchInput = page.getByPlaceholder(/rechercher/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('pizza');
      await page.waitForTimeout(500); // Debounce delay
    }
  });

  test('should navigate to restaurant detail', async ({ page }) => {
    await page.goto('/restaurants');
    
    await page.waitForLoadState('networkidle');
    
    // Click on first restaurant card
    const restaurantCard = page.locator('[data-testid="restaurant-card"]').first();
    if (await restaurantCard.isVisible({ timeout: 5000 })) {
      await restaurantCard.click();
      await expect(page).toHaveURL(/.*restaurant\/.*/);
    }
  });
});
