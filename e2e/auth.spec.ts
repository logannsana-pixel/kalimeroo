import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display customer login page', async ({ page }) => {
    await page.goto('/auth/customer');
    
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByPlaceholder(/téléphone/i)).toBeVisible();
    await expect(page.getByPlaceholder(/mot de passe/i)).toBeVisible();
  });

  test('should show validation error for invalid phone', async ({ page }) => {
    await page.goto('/auth/customer');
    
    await page.getByPlaceholder(/téléphone/i).fill('123');
    await page.getByPlaceholder(/mot de passe/i).fill('password123');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Should show error toast for invalid phone format
    await expect(page.getByText(/format.*invalide/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/auth/customer');
    
    // Click on signup link
    await page.getByText(/créer un compte/i).click();
    
    // Should show signup form
    await expect(page.getByPlaceholder(/nom complet/i)).toBeVisible();
  });

  test('should display restaurant login page', async ({ page }) => {
    await page.goto('/auth/restaurant');
    
    await expect(page.getByRole('heading', { name: /restaurant/i })).toBeVisible();
  });

  test('should display delivery driver login page', async ({ page }) => {
    await page.goto('/auth/delivery');
    
    await expect(page.getByRole('heading', { name: /livreur/i })).toBeVisible();
  });
});
