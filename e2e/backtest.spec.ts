import { test, expect } from '@playwright/test';

test('lancer un backtest depuis l\'interface affiche les résultats', async ({ page }) => {
  await page.goto('/backtest');

  await page.getByLabel('Stratégie').selectOption('SMA');
  await page.getByLabel('Date de début').fill('2024-01-01');
  await page.getByLabel('Date de fin').fill('2024-02-29');
  await page.getByRole('button', { name: 'Lancer le backtest' }).click();

  await expect(page.getByTestId('backtest-pnl-result')).toBeVisible({ timeout: 15_000 });
});
