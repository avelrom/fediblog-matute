# Matute

El tema más austero para **escribir**: un índice tipográfico, una línea por entrada, hecho con [Fediblog](https://fediblog.avelrom.es): un blog
estático de [Astro](https://astro.build) cuyo contenido son los **mensajes
públicos de una cuenta del fediverso** (Mastodon, Pixelfed, Bluesky…). Escribes
desde la app que ya usas; el sitio se reconstruye y publica lo nuevo.

Estático de principio a fin: sin cookies, sin analítica y sin rastreo. Las
imágenes se copian a tu dominio, así que el navegador de quien lee no hace
ninguna petición a la instancia de origen. Inspirado en **Ana María Matute**.

- **Índice tipográfico**: fecha y puntos de guía, como el índice de un libro.
- **Tamaño de texto S / M / L** para el visitante, a tu elección.
- Buscador, comentarios, modo oscuro y RSS con el texto completo.

## Empezar

1. Pulsa **Use this template** y crea tu repositorio.
2. Abre `src/config.ts` y pon tu cuenta en `handle` (y `source: 'bluesky'` si es
   de Bluesky).
3. Publica en GitHub Pages: **Settings → Pages → Source: GitHub Actions**. El
   flujo de trabajo `deploy.yml` compila y despliega al hacer push, a diario y
   cuando lo lances a mano.

En local: `npm install` y `npm run dev`.

## Configuración

Todo está en `src/config.ts`. Para decidirlo viendo el resultado, activa el
**panel de configuración** (`site.previewSidebar: true`, o un `.env` local con
`PUBLIC_FB_LIVE_PREVIEW=1`): cambias los ajustes sobre el sitio real y
**Exportar configuración** te da el `config.ts` completo para pegar.

Qué hace cada ajuste:
[fediblog.avelrom.es/configuracion/matute](https://fediblog.avelrom.es/configuracion/matute/) ·
[Propiedades comunes](https://fediblog.avelrom.es/configuracion/propiedades-comunes/).

## Actualizar

- El **motor** (`@fediblog/core`): `npm update @fediblog/core`.
- Los **archivos del tema**: `npm run fediblog:update` (nunca toca tu
  `src/config.ts`), o el flujo **Actualizar tema Fediblog** de GitHub Actions.
  Ver [Actualizar el tema](https://fediblog.avelrom.es/doc/actualizar/).

## Cambiar de tema

Desde GitHub, sin terminal: pestaña **Actions → Cambiar de tema Fediblog → Run workflow** y elige el tema nuevo. Se abre un Pull Request con el cambio (conserva tu cuenta y tus ajustes); si no te convence, lo cierras sin fusionar. Ver [Cambiar de tema](https://fediblog.avelrom.es/personalizar/cambiar-de-tema/).
