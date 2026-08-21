# Deploy na Vercel

Site estático (Astro). A Vercel detecta o framework sozinha:
build `npm run build`, saída `dist/`. Não há adapter nem função serverless.

## Por que `cleanUrls: false`

As URLs vieram do WordPress e já estão indexadas no formato antigo:

- páginas e listagens com barra — `/empresa/`, `/servicos/`
- posts com extensão — `/servicos/escolta-armada.html`

Com `cleanUrls: true` a Vercel redireciona `/algo.html` para `/algo`, o que
quebraria todas as URLs de serviço, notícia e FAQ que o Google já conhece.
O valor `false` é o padrão da plataforma, mas fica explícito aqui para
ninguém ligar sem perceber o efeito.

## Cache

Imagens, vídeo, CSS e JS não têm hash no nome (vieram do tema antigo), então
o navegador revalida de hora em hora e a CDN segura por uma semana. A Vercel
limpa a CDN a cada deploy, então trocar o vídeo do herói aparece na hora.
Os arquivos em `/_astro/` têm hash e a própria Vercel os cacheia como
imutáveis.

## Domínio

`grupomegaelite.com.br` — registrado e com DNS na GoDaddy. No go-live só
mudam o registro A da raiz e o CNAME do `www`. **Os registros MX e o TXT de
SPF (`secureserver.net`) não podem ser tocados**: são o e-mail da empresa.
