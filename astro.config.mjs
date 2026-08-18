// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://grupomegaelite.com.br',
  // Preserva as URLs antigas do WordPress mantendo o esquema MISTO:
  //   páginas/categorias  -> /empresa/, /servicos/   (pasta/index.astro -> pasta/index.html)
  //   posts (serviços...)  -> /servicos/escolta-armada.html  ([slug].astro -> arquivo .html)
  // 'preserve' respeita a estrutura de arquivos exatamente (Astro 4.8+).
  build: { format: 'preserve' },
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      // A 404 e a página de captura do vídeo não devem ser indexadas.
      filter: (page) => !/\/404\/?$|render-escudo/.test(page),
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        // O Astro entrega a rota sem extensão. Os posts são arquivos .html no
        // disco e as demais páginas são pastas — reproduzir isso aqui, senão o
        // sitemap aponta para URLs que não existem.
        if (!item.url.endsWith('/') && !item.url.endsWith('.html')) {
          const caminho = new URL(item.url).pathname.replace(/^\/|\/$/g, '').split('/');
          const ehPost =
            caminho.length === 2 && ['servicos', 'noticias', 'faq'].includes(caminho[0]);
          item.url += ehPost ? '.html' : '/';
        }

        // A home é a porta de entrada; serviços vêm logo depois.
        if (item.url === 'https://grupomegaelite.com.br/') item.priority = 1.0;
        else if (item.url.includes('/servicos/')) item.priority = 0.9;
        else if (item.url.includes('/telefones/') || item.url.includes('/contato/'))
          item.priority = 0.8;
        else item.priority = 0.6;
        return item;
      },
    }),
  ],
});
