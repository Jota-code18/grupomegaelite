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
  await expect(page.locator('input[name="nome"]')).toBeVisible();
  await expect(page.locator('input[name="assunto"]')).toBeVisible();
  await expect(page.locator('textarea[name="mensagem"]')).toBeVisible();
});

test('formulário monta o link do WhatsApp sem chave externa', async ({ page }) => {
  // Intercepta window.open: valida o link montado sem sair para o WhatsApp real.
  await page.addInitScript(() => {
    (window as unknown as { __aberto: string[] }).__aberto = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { __aberto: string[] }).__aberto.push(String(url));
      return null;
    };
  });
  await page.goto('/contato/');
  await page.fill('input[name="nome"]', 'João Teste');
  await page.fill('input[name="assunto"]', 'Orçamento portaria');
  await page.fill('textarea[name="mensagem"]', 'Gostaria de um orçamento.');
  await page.click('button[type="submit"]');

  const aberto = await page.evaluate(
    () => (window as unknown as { __aberto: string[] }).__aberto[0],
  );
  expect(aberto).toContain('wa.me/');
  expect(decodeURIComponent(aberto)).toContain('João Teste');
  expect(decodeURIComponent(aberto)).toContain('Orçamento portaria');
});

test('formulário exige os campos obrigatórios', async ({ page }) => {
  await page.goto('/contato/');
  await page.click('button[type="submit"]');
  await expect(page.locator('input[name="nome"]')).toHaveClass(/is-invalid/);
});

test('home mostra o herói 3D acima do carrossel', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('.hero-elite');
  await expect(hero).toBeVisible();
  await expect(hero.locator('h1')).toContainText('confiança');
  await expect(page.locator('model-viewer')).toHaveAttribute('src', '/models/elite-3d.glb');
});

test('header não tem topbar nem logo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.topbar')).toHaveCount(0);
  await expect(page.locator('header.site-header img')).toHaveCount(0);
  await expect(page.locator('header.site-header .btn-orcamento')).toBeVisible();
});

test('404 renderiza a página de erro', async ({ page }) => {
  await page.goto('/rota-inexistente-xyz-123', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('404');
});
