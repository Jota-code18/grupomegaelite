import { expect, test } from '@playwright/test';

const conteudo = (page: import('@playwright/test').Page, seletor: string) =>
  page.locator(seletor).getAttribute('content');

test('home tem título, descrição e canônica', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/Grupo Mega Elite/);

  const descricao = (await conteudo(page, 'meta[name="description"]')) ?? '';
  expect(descricao.length).toBeGreaterThan(70);
  expect(descricao.length).toBeLessThanOrEqual(180);
  expect(descricao.toLowerCase()).toContain('anápolis');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://grupomegaelite.com.br/',
  );
  expect(await conteudo(page, 'meta[name="robots"]')).toContain('index');
});

test('todas as páginas principais têm descrição própria', async ({ page }) => {
  const rotas = ['/', '/servicos/', '/faq/', '/noticias/', '/contato/', '/telefones/', '/empresa/'];
  const vistas = new Set<string>();

  for (const rota of rotas) {
    await page.goto(rota, { waitUntil: 'domcontentloaded' });
    const d = (await conteudo(page, 'meta[name="description"]')) ?? '';
    expect(d, `sem descrição em ${rota}`).not.toBe('');
    // Descrição repetida entre páginas é o erro clássico que o Search Console aponta.
    expect(vistas.has(d), `descrição duplicada em ${rota}`).toBe(false);
    // Acima de ~165 o Google corta no meio da frase.
    expect(d.length, `descrição longa demais em ${rota}`).toBeLessThanOrEqual(165);
    vistas.add(d);

    expect(await page.locator('h1').count(), `${rota} precisa de exatamente um h1`).toBe(1);
  }
});

test('dados estruturados descrevem a empresa e as perguntas', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const bruto = await page.locator('script[type="application/ld+json"]').textContent();
  const dados = JSON.parse(bruto ?? '{}');
  const tipos = dados['@graph'].map((n: { '@type': string }) => n['@type']);

  expect(tipos).toContain('SecurityService');
  expect(tipos).toContain('WebSite');
  expect(tipos).toContain('FAQPage');

  const empresa = dados['@graph'].find(
    (n: { '@type': string }) => n['@type'] === 'SecurityService',
  );
  expect(empresa.address.addressLocality).toBe('Anápolis');
  expect(empresa.telephone).toMatch(/^\+55\d+$/);
  expect(empresa.makesOffer.length).toBeGreaterThanOrEqual(5);

  const faq = dados['@graph'].find((n: { '@type': string }) => n['@type'] === 'FAQPage');
  // Resposta vazia faz o Google descartar o bloco inteiro.
  for (const q of faq.mainEntity) {
    expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
  }
});

test('página de serviço declara Service e trilha de navegação', async ({ page }) => {
  await page.goto('/servicos/escolta-armada.html', { waitUntil: 'domcontentloaded' });
  const dados = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  );
  const tipos = dados['@graph'].map((n: { '@type': string }) => n['@type']);
  expect(tipos).toContain('Service');
  expect(tipos).toContain('BreadcrumbList');
});

test('cada página tem exatamente um h1 e não pula níveis', async ({ page }) => {
  for (const rota of ['/', '/servicos/', '/faq/', '/contato/']) {
    await page.goto(rota, { waitUntil: 'domcontentloaded' });
    const niveis = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));

    expect(niveis.filter((n) => n === 1).length, `h1 em ${rota}`).toBe(1);
    for (let i = 1; i < niveis.length; i++) {
      expect(niveis[i] - niveis[i - 1], `salto de nível em ${rota}`).toBeLessThanOrEqual(1);
    }
  }
});

test('robots, sitemap e llms.txt estão publicados e coerentes', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  const textoRobots = await robots.text();
  expect(textoRobots).toContain('Sitemap: https://grupomegaelite.com.br/sitemap-index.xml');

  const indice = await request.get('/sitemap-index.xml');
  expect(indice.ok()).toBe(true);

  const mapa = await request.get('/sitemap-0.xml');
  expect(mapa.ok()).toBe(true);
  const xml = await mapa.text();
  expect(xml).toContain('<loc>https://grupomegaelite.com.br/</loc>');
  // A 404 não pode ser oferecida para indexação.
  expect(xml).not.toContain('/404');

  const llms = await request.get('/llms.txt');
  expect(llms.ok()).toBe(true);
  const textoLlms = await llms.text();
  expect(textoLlms).toContain('# Grupo Mega Elite');
  expect(textoLlms).toContain('Anápolis');
  expect(textoLlms).toContain('/servicos/escolta-armada.html');
});

test('404 fica fora do índice dos buscadores', async ({ page }) => {
  await page.goto('/rota-que-nao-existe-abc', { waitUntil: 'domcontentloaded' });
  expect(await conteudo(page, 'meta[name="robots"]')).toContain('noindex');
});
