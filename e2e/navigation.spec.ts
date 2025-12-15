import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working navbar links', async ({ page }) => {
    await page.goto('/');
    
    // Test main navigation links
    const navLinks = [
      { name: /restaurants/i, url: /restaurants/ },
    ];
    
    for (const link of navLinks) {
      const navLink = page.getByRole('link', { name: link.name }).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await expect(page).toHaveURL(link.url);
        await page.goto('/');
      }
    }
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/');
    
    // Check mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Check desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/unknown-page-that-does-not-exist');
    
    await expect(page.getByText(/404|page.*introuvable|not found/i)).toBeVisible();
  });
});
