import { test, expect } from '@playwright/test';

/**
 * Smoke E2E (CLAUDE.md §18). Verifies the auth gate redirects to /auth/login, a returning-user
 * login reaches the dashboard, and a first-time user is routed to reset password. Relies on the
 * MSW mock backend (VITE_ENABLE_MSW=true in dev).
 */
test('unauthenticated visit redirects to the login screen', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
});

test('returning user logs in and reaches the dashboard', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Username').fill('aarav');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('http://localhost:5173/');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});

test('first-time user is routed to reset password', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Username').fill('newuser');
  await page.getByLabel('Password').fill('whatever');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/auth\/reset-password$/);
});
