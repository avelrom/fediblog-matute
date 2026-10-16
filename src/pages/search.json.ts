import type { APIRoute } from 'astro';
import { getNotas } from '@fediblog/core/lib/notas';

// Índice estático para el buscador del cliente.
export const GET: APIRoute = async () => {
  const base = import.meta.env.BASE_URL;
  const notas = await getNotas();
  const items = notas.map((n) => ({
    t: n.data.title,
    e: n.data.excerpt.slice(0, 300),
    g: n.data.tags,
    u: `${base}${n.id}/`,
  }));
  return new Response(JSON.stringify(items), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
