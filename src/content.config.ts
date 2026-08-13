import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const postSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  date: z.string().optional(),
  image: z.string().nullable().optional(),
  order: z.number().optional(),
  html: z.string(),
});

const servicos = defineCollection({ loader: file('src/data/servicos.json'), schema: postSchema });
const noticias = defineCollection({ loader: file('src/data/noticias.json'), schema: postSchema });
const faq = defineCollection({ loader: file('src/data/faq.json'), schema: postSchema });

const paginas = defineCollection({
  loader: file('src/data/paginas.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    html: z.string(),
  }),
});

export const collections = { servicos, noticias, faq, paginas };
