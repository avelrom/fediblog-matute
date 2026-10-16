import type { APIRoute } from 'astro';
import { getNotas } from '@fediblog/core/lib/notas';
import { buildFeed, feedContext, toJsonFeed } from '@fediblog/core/lib/feed';
import { feedChannel } from '../lib/feed';

// JSON Feed 1.1, para los lectores que lo prefieren al XML.
export const GET: APIRoute = async (context) => {
  const ctx = feedContext(context);
  const entries = await buildFeed(await getNotas(), ctx);
  return new Response(toJsonFeed(feedChannel, entries, ctx), {
    headers: { 'content-type': 'application/feed+json; charset=utf-8' },
  });
};
