import type { APIRoute } from 'astro';
import { getNotas } from '@fediblog/core/lib/notas';
import { buildFeed, feedContext, toRss } from '@fediblog/core/lib/feed';
import { feedChannel } from '../lib/feed';

// RSS 2.0 con el contenido completo (<content:encoded>) e imágenes, pensado
// para lectores RSS. El navegador lo muestra estilado con rss-styles.xsl.
export const GET: APIRoute = async (context) => {
  const ctx = feedContext(context);
  const entries = await buildFeed(await getNotas(), ctx);
  return new Response(toRss(feedChannel, entries, ctx, { stylesheet: `${ctx.base}rss-styles.xsl` }), {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  });
};
