import { expect, test } from '@playwright/test';

test('home carrega com título e menu', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Mega Elite/);
  await expect(page.locator('#primary-menu').first()).toContainText('Serviços');
});

test('serviço abre com a URL .html preservada', async ({ page }) => {
  await page.goto('/servicos/');
  await page.locator('a.title-servicos-page', { hasText: 'Escolta Armada' }).click();
  await expect(page).toHaveURL(/\/servicos\/escolta-armada\.html$/);
  await expect(page.locator('h1')).toContainText('Escolta Armada');
});

test('contato tem o formulário novo', async ({ page }) => {
  await page.goto('/contato/');
  await expect(page.locator('form.mega-form')).toBeVisible();
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
});

test('404 renderiza a página de erro', async ({ page }) => {
  await page.goto('/rota-inexistente-xyz-123', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('404');
});
