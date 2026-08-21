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

## Nada de `trailingSlash`

A chave fica **ausente** de propósito. As páginas de listagem são pastas
(`/servicos/index.html`), então a URL canônica leva barra — é assim que o
sitemap, os links internos e as tags canônicas apontam. Com
`trailingSlash: false` a Vercel devolve 308 em `/servicos/`, `/contato/` e
`/telefones/`, cobrando um redirecionamento em cada navegação interna. Sem a
chave, as duas formas respondem 200.

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
