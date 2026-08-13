// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://grupomegaelite.com.br',
  // Preserva as URLs antigas do WordPress mantendo o esquema MISTO:
  //   páginas/categorias  -> /empresa/, /servicos/   (pasta/index.astro -> pasta/index.html)
  //   posts (serviços...)  -> /servicos/escolta-armada.html  ([slug].astro -> arquivo .html)
  // 'preserve' respeita a estrutura de arquivos exatamente (Astro 4.8+).
  build: { format: 'preserve' },
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
});
