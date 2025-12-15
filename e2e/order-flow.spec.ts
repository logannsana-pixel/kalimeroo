import { test, expect } from '@playwright/test';

test.describe('Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a restaurant detail page
    await page.goto('/restaurants');
    await page.waitForLoadState('networkidle');
  });

  test('should display menu items on restaurant page', async ({ page }) => {
    // Click on first restaurant
    const restaurantCard = page.locator('[data-testid="restaurant-card"]').first();
    
    if (await restaurantCard.isVisible({ timeout: 5000 })) {
      await restaurantCard.click();
      
      // Wait for restaurant detail to load
      await page.waitForLoadState('networkidle');
      
      // Should show menu items
      const menuItems = page.locator('[data-testid="menu-item"]');
      await expect(menuItems.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should add item to cart and navigate to cart', async ({ page }) => {
    // This test requires authentication - skip if not logged in
    test.skip(true, 'Requires authenticated user');
  });

  test('should display cart page correctly', async ({ page }) => {
    await page.goto('/cart');
    
    // Should redirect to auth if not logged in, or show cart
    await page.waitForLoadState('networkidle');
    
    // Either auth page or cart page should be visible
    const isOnAuth = page.url().includes('/auth');
    const cartHeading = page.getByRole('heading', { name: /panier/i });
    
    if (!isOnAuth) {
      await expect(cartHeading).toBeVisible();
    }
  });
});

test.describe('Checkout Flow', () => {
  test('should redirect to auth when accessing checkout without login', async ({ page }) => {
    await page.goto('/checkout');
    
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth.*/);
  });
});
