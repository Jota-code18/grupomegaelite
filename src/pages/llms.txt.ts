import { getCollection } from 'astro:content';
import site from '../data/site.json';
import { metaDescricao } from '../lib/text';

/**
 * llms.txt — resumo do site em texto puro para buscadores com IA (AEO/GEO).
 * É gerado a partir das mesmas coleções que montam as páginas, então nunca
 * descreve algo que não existe mais no site.
 */
export async function GET() {
  const base = site.seo.url;
  const [servicos, noticias, faq] = await Promise.all([
    getCollection('servicos'),
    getCollection('noticias'),
    getCollection('faq'),
  ]);

  const linha = (titulo: string, url: string, desc: string) => `- [${titulo}](${url}): ${desc}`;

  const texto = `# ${site.seo.marca}

> ${site.seo.descricaoPadrao}

Empresa de segurança privada com sede em Anápolis (GO), atuando em Anápolis e região há 30 anos.
Central de monitoramento própria, equipes treinadas e atendimento 24 horas.

## Dados da empresa

- Nome: ${site.seo.marca} (Vigilância e Segurança)
- Cidade: Anápolis - GO, Brasil
- Endereço: ${site.topbar.address}
- Televendas: ${site.topbar.phone}
- WhatsApp: ${site.contato.whatsapp_display}
- E-mail: ${site.contato.email}
- Áreas atendidas: ${site.seo.regioes.join(', ')}
- Serviços: ${site.seo.servicos.join('; ')}

## Serviços

${servicos.map((s) => linha(s.data.title, `${base}/servicos/${s.data.slug}.html`, metaDescricao(s.data.html, 130))).join('\n')}

## Perguntas frequentes

${faq.map((f) => linha(f.data.title, `${base}/faq/${f.data.slug}.html`, metaDescricao(f.data.html, 130))).join('\n')}

## Conteúdos

${noticias.map((n) => linha(n.data.title, `${base}/noticias/${n.data.slug}.html`, metaDescricao(n.data.html, 130))).join('\n')}

## Páginas

- [Empresa](${base}/empresa/): história, missão, visão e valores da Mega Elite.
- [Peça seu orçamento](${base}/telefones/): telefones e WhatsApp dos gerentes comerciais.
- [Contato](${base}/contato/): formulário, e-mail e endereço.
- [Política de Privacidade](${base}/politica-de-privacidade/)
- [Termos de Uso](${base}/termos-de-uso/)
- [Adequação à LGPD](${base}/adequacao-a-lgpd/)
`;

  return new Response(texto, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
