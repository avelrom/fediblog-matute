import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Sitio Astro estático. Las entradas se descargan del fediverso en la
// compilación (dentro del loader de contenido), así que no hay adaptador ni
// servidor que configurar.
//
// `site` / `base` se derivan solos al compilar, de modo que `npm run build`
// genera las rutas de assets, el RSS y el sitemap correctos sin editar nada:
//   · GitHub Pages: GITHUB_REPOSITORY = "usuario/repo"
//       → https://<usuario>.github.io/<repo>/
//   · GitLab Pages: CI_PAGES_URL = "https://usuario.gitlab.io/proyecto"
//   · Netlify: URL = "https://tu-sitio.netlify.app"
//   · Dominio propio: define la variable SITE_URL (https://tudominio.com). Con
//     ella el sitio se sirve en la raíz; si no, define también BASE_PATH.
// En local, sin nada de lo anterior, se usa un dominio de ejemplo: suficiente
// para que el RSS y el sitemap se generen.
const repo = process.env.GITHUB_REPOSITORY;
const [owner, name] = repo?.split('/') ?? [];
const gitlab = process.env.CI_PAGES_URL ? new URL(process.env.CI_PAGES_URL) : null;

const site =
  process.env.SITE_URL ||
  (owner ? `https://${owner}.github.io` : gitlab ? gitlab.origin : process.env.URL || 'https://ejemplo.com');
const base =
  process.env.BASE_PATH ||
  (process.env.SITE_URL ? undefined : name ? `/${name}/` : gitlab && gitlab.pathname !== '/' ? gitlab.pathname : undefined);

// El editor (con su importador de Substack) vive en Fediblog; esta plantilla
// solo lo incrusta en un <iframe> (ver src/pages/editor.astro).

export default defineConfig({
  site,
  base,
  integrations: [sitemap()],
  // @fediblog/core se distribuye como TypeScript: que Vite lo compile con el sitio.
  vite: { ssr: { noExternal: ['@fediblog/core'] } },
});
