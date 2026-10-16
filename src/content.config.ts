import { defineCollection } from 'astro:content';
import { siteLoader } from '@fediblog/core/site-loader';
import { notaSchema } from '@fediblog/core/schema';
import { SITE } from './config';

// La colección «notas» no vive en disco: la puebla el loader a partir de la
// cuenta del fediverso indicada en src/config.ts (SITE.handle).
const notas = defineCollection({
  loader: siteLoader(SITE, {
    firstSentenceAsTitle: true,
    dicebearBackground: ['f5f5f4', 'e7e5e4', 'd6d3d1'],
  }),
  schema: notaSchema,
});

export const collections = { notas };
