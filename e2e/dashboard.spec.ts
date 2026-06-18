import { test, expect } from '@playwright/test';

test('test à la mano de l\'affichage du prix du btc au chargment', async ({ page }) => {
    test.setTimeout(70_000); // sinon le test passe pas, le retour de l'api esttrop long

    await page.goto('/');

    const prix = page.getByTestId('current-price');

    await expect(prix).toBeVisible();
    await expect(prix).toContainText('$', { timeout: 65_000 });
});

test('test à la mano un message est affiché quand aucun trade n\'existe', async ({ page }) => {
    test.setTimeout(70_000);

    await page.goto('/');

    const trade = page.getByTestId('trade-history-empty');
    await expect(trade).toBeVisible();


});