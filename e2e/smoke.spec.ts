import { test, expect } from '@playwright/test';

/**
 * Smoke E2E (CLAUDE.md §18). Verifies the auth gate redirects to /login, the dev sign-in
 * lands on the dashboard, and theme toggle works. Replace/extend with real flows per feature.
 */
test('unauthenticated visit redirects to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('dev sign-in reaches the dashboard shell', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('http://localhost:5173/');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
