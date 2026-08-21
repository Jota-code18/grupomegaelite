import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * A home tem um vídeo de alguns MB no herói. Esperar o evento `load` faria cada
 * teste aguardar o vídeo inteiro baixar — o que nenhum deles verifica. O DOM
 * pronto é o sinal certo aqui.
 */
const abrirHome = (page: Page) => page.goto('/', { waitUntil: 'domcontentloaded' });

test('home carrega com título e menu', async ({ page }) => {
  await abrirHome(page);
  await expect(page).toHaveTitle(/Mega Elite/);
  await expect(page.locator('#primary-menu').first()).toContainText('Serviços');
});

test('serviço abre com a URL .html preservada', async ({ page }) => {
  await page.goto('/servicos/');
  // Dentro de <main>: o rodapé também lista os serviços, e por papel/nome o
  // teste não depende da classe do card (compartilhada com a home).
  await page.getByRole('main').getByRole('link', { name: 'Escolta Armada', exact: true }).click();
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

test('home mostra o herói com o vídeo do escudo acima do carrossel', async ({ page }) => {
  await abrirHome(page);
  const hero = page.locator('.hero-elite');
  await expect(hero).toBeVisible();
  await expect(hero.locator('h1')).toContainText('confiança');
  const video = hero.locator('video.hero-elite__video');
  await expect(video).toHaveAttribute('loop', '');
  await expect(video.locator('source')).toHaveAttribute('src', '/videos/escudo.mp4');
  // O 3D ao vivo saiu de cena: nada de model-viewer nem GLB no site publicado.
  await expect(page.locator('model-viewer')).toHaveCount(0);
});

test('header não tem topbar nem logo e fica sobre o herói', async ({ page }) => {
  await abrirHome(page);
  await expect(page.locator('.topbar')).toHaveCount(0);
  await expect(page.locator('header.site-header img')).toHaveCount(0);
  await expect(page.locator('header.site-header .btn-orcamento')).toBeVisible();
  // Fixo e sem reservar espaço: o herói começa no topo, por baixo do header.
  await expect(page.locator('header.site-header')).toHaveCSS('position', 'fixed');
  const heroTop = await page
    .locator('.hero-elite')
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(heroTop).toBeLessThanOrEqual(1);
});

test('menu mobile abre pelo botão do header', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirHome(page);
  const gaveta = page.locator('#menu-mobile');
  await expect(gaveta).toBeHidden();
  await page.click('.header-toggle');
  await expect(gaveta).toBeVisible();
  await expect(gaveta.locator('a')).toHaveCount(6);
});

test('páginas internas não ficam escondidas atrás do header fixo', async ({ page }) => {
  await page.goto('/servicos/');
  const topo = await page.locator('main h1').evaluate((el) => el.getBoundingClientRect().top);
  expect(topo).toBeGreaterThan(60);
});

test('página de orçamento traz os gerentes com WhatsApp', async ({ page }) => {
  await page.goto('/telefones/');
  const cartoes = page.locator('.contato-card');
  await expect(cartoes).toHaveCount(2);
  await expect(cartoes.filter({ hasText: 'Bruno Mendes' })).toBeVisible();
  await expect(cartoes.filter({ hasText: 'Iram' })).toBeVisible();

  const zap = page.locator('.btn-zap').first();
  const href = (await zap.getAttribute('href')) ?? '';
  expect(href).toContain('wa.me/5562992309119');
  // A tabela antiga trazia uma quebra de linha no meio da URL do WhatsApp.
  expect(href).not.toMatch(/\s/);
});

test('404 renderiza a página de erro', async ({ page }) => {
  await page.goto('/rota-inexistente-xyz-123', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('404');
});

test('rodapé perdeu o texto de e-commerce e o crédito do dev antigo', async ({ page }) => {
  await page.goto('/contato/');
  const rodape = page.locator('footer.rodape-elite');
  await expect(rodape).toBeVisible();

  // Textos herdados do tema WordPress, que não descreviam esta empresa.
  await expect(rodape).not.toContainText('Preços e condições de pagamento');
  await expect(rodape).not.toContainText('imagens dos produtos');
  // O logo do dev anterior era carregado de um domínio de terceiros.
  await expect(page.locator('img[src*="produtosmatao"]')).toHaveCount(0);

  await expect(rodape.getByRole('link', { name: 'Política de Privacidade' })).toBeVisible();
  await expect(rodape).toContainText(String(new Date().getFullYear()));
});

test('cada gerente tem um avatar identificando quem é', async ({ page }) => {
  await page.goto('/telefones/');
  const avatares = page.locator('.contato-card__avatar');
  await expect(avatares).toHaveCount(2);

  for (const avatar of await avatares.all()) {
    await expect(avatar).toBeVisible();
    const foto = avatar.locator('.contato-card__foto');
    if (await foto.count()) {
      // O onerror remove a <img> quebrada, então toda <img> que sobra carregou.
      const carregou = await foto.evaluate((el: HTMLImageElement) => el.naturalWidth > 0);
      expect(carregou).toBe(true);
    } else {
      // Sem a foto no disco, as iniciais assumem — o cartão nunca fica vazio.
      await expect(avatar.locator('.contato-card__iniciais')).toBeVisible();
    }
  }
});
