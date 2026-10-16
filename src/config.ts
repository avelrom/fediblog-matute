/**
 * Ajustes de Matute.
 *
 * Matute es el tema más sencillo de fediblog: convierte los mensajes públicos
 * de una cuenta del fediverso en un blog de solo texto, sin apenas ajustes.
 * Inspirado en Ana María Matute. Si quieres más control (comentarios,
 * destacados, dos cuentas, vistas de galería…), el resto de temas de fediblog
 * lo ofrecen — este es justo lo contrario a propósito.
 */
export const SITE = {
  /**
   * De dónde viene la cuenta:
   *   'mastodon' → ActivityPub (Mastodon, Pixelfed, GoToSocial…).
   *   'bluesky'  → AT Protocol (Bluesky).
   */
  source: 'mastodon' as 'mastodon' | 'bluesky',

  /**
   * Cuenta de la que se leen las entradas. Debe ser pública.
   *   Mastodon/Pixelfed: '@usuario@instancia'.
   *   Bluesky: 'usuario.bsky.social' o tu dominio propio (con o sin @).
   */
  handle: '@fediblogtest@mastodon.social',

  // ─── Ajustes generales del sitio ──────────────────────────────────────────
  site: {
    /** Nombre del blog: cabecera, título de las pestañas y feeds. */
    title: 'Matute',

    /** Idioma y formato de fechas (ej: 'es-ES', 'en-US'). */
    locale: 'es-ES',

    /**
     * Colores propios (formato #rrggbb). `null` = el del tema.
     *   accent → detalles y énfasis.   title → títulos del sitio y de las entradas.
     */
    colors: {
      accent: null as string | null,
      title: null as string | null,
    },

    /**
     * Letra del blog:
     *   'sans'  → Inter (sans-serif moderna y nítida, por defecto).
     *   'serif' → texto en serifa, de lectura clásica.
     *   'mono'  → todo en monoespaciada, más austero.
     */
    font: 'sans' as 'serif' | 'sans' | 'mono',

    /**
     * Tamaño del texto en cada elemento, a elegir entre xs, s, m, l y xl
     * (m = el del tema). No tiene que ver con el S/M/L de los lectores, que
     * cambia el diseño general.
     */
    fontSize: {
      /** Nombre del sitio en la cabecera. */
      brand: 'm' as 'xs' | 's' | 'm' | 'l' | 'xl',
      /** Títulos de los listados (inicio, archivo, etiquetas). */
      title: 'm' as 'xs' | 's' | 'm' | 'l' | 'xl',
      /** Título dentro de cada entrada. */
      postTitle: 'm' as 'xs' | 's' | 'm' | 'l' | 'xl',
      /** Texto de lectura de las entradas y extractos. */
      body: 'm' as 'xs' | 's' | 'm' | 'l' | 'xl',
    },

    /**
     * Modo oscuro:
     *   'toggle' → botón en la cabecera (claro/oscuro), recordado en el navegador.
     *   'auto'   → sigue al sistema, sin botón.
     *   'light'  → siempre claro.
     *   'dark'   → siempre oscuro.
     */
    darkMode: 'toggle' as 'toggle' | 'auto' | 'light' | 'dark',

    /**
     * Enlaces del menú: el texto que se muestra y su icono (de Lucide, o de
     * Phosphor con prefijo `ph:`, p. ej. `'ph:house'`). Icono vacío = solo texto.
     */
    menu: {
      about: {
        label: 'about',
        icon: 'user',
      },
      archive: {
        label: 'archivo',
        icon: 'archive',
      },
      rss: {
        label: 'rss',
        icon: 'rss',
      },
    },

    /**
     * Tamaños de texto (S / M / L) que ofrece el selector. Uno solo = el blog
     * siempre se ve a ese tamaño y no aparece el selector.
     */
    sizes: ['sm', 'md', 'lg'] as ('sm' | 'md' | 'lg')[],
    /** Tamaño con el que se abre el blog (debe estar en `sizes`; si no, M o el primero). */
    defaultSize: 'md' as 'sm' | 'md' | 'lg',
    /**
     * Dónde sustituir los enlaces de texto por iconos de Lucide:
     *   'both'    → en móvil y en escritorio.
     *   'mobile'  → solo en móvil (en escritorio se muestra el texto).
     *   'desktop' → solo en escritorio (en móvil se muestra el texto).
     *   'none'    → desactivado (siempre texto, aunque haya iconos configurados).
     */
    navIconsMode: 'both' as 'both' | 'mobile' | 'desktop' | 'none',

    /**
     * En móvil (pantallas estrechas), ocultar los iconos de redes sociales del menú
     * para no saturar la barra superior. Se consultan en /about/.
     */
    hideSocialOnMobile: true,

    /**
     * Panel lateral de vista previa: marca o desmarca opciones y ve el efecto
     * al momento, sin tocar este archivo. Pensado para decidir la
     * configuración antes de instalar el tema; por defecto está apagado.
     */
    previewSidebar: false,
  },

  // ─── Contenido ────────────────────────────────────────────────────────────
  ingest: {
    /**
     * Marca opcional (un emoji, normalmente) para publicar solo algunos
     * mensajes en vez de todos. Se busca en cualquier parte del mensaje y se
     * quita del texto. `null` = se publican todos los mensajes propios.
     */
    marker: '✍🏻' as string | null,
  },

  /** Inicio. */
  home: {
    /** Entradas por página. */
    postsPerPage: 30,
  },

  /** Entradas. */
  post: {
    /** Mostrar las respuestas de otras cuentas (comentarios) al final de cada entrada. */
    showComments: true,

    /** Mostrar «me gusta» y compartidas al final de cada entrada (a 0 no se muestran). */
    showMetrics: true,

    /** Máximo de comentarios que se muestran por entrada (el resto, en la red original). */
    commentLimit: 30,

    /** Avatares de los comentarios: 'remote' (foto de la cuenta) o 'dicebear' (siempre generado). */
    commentAvatars: 'remote' as 'remote' | 'dicebear',
    /** Estilo de los avatares generados (dicebear.com/styles), con `commentAvatars: 'dicebear'`. */
    dicebearStyle: 'line-face', // caras a línea, a juego con la tipografía
  },

  /** Página /about/. */
  profile: {
    /** Página «Acerca de» y su enlace en el menú. Si la desactivas, ni existe la página ni sale el enlace. */
    show: true,
    /** Tu nombre en «Acerca de». `null` = el de tu cuenta del fediverso. */
    name: null as string | null,
    /** Tu texto en «Acerca de» (párrafos separados por una línea en blanco). `null` = la biografía de tu cuenta. */
    bio: null as string | null,
    /** Texto libre adicional, bajo la biografía (párrafos separados por una línea en blanco). Vacío = nada: no se añade ningún texto automático. */
    extraText: null as string | null,
    /**
     * Mostrar la imagen de cabecera de la red social en /about/.
     * Si la cuenta del fediverso o Bluesky tiene cabecera configurada, se muestra sobre el perfil.
     */
    showBanner: true,
    /** Foto de perfil junto al nombre. */
    showAvatar: true,
    /** Biografía (la tuya o la de la cuenta). */
    showBio: true,
    /** Número de seguidores, si la instancia lo hace público. */
    showFollowers: true,
    /** Campos del perfil de la cuenta (web, pronombres…). */
    showFields: true,
  },

  /** Archivo. */
  archive: {
    /** Mostrar enlace a la página de archivo en el menú. */
    show: true,
  },

  /**
   * Cuentas de redes sociales enlazadas en el menú y en /about/.
   * Puedes usar la URL completa o el usuario/handle de cada aplicación
   * (ej: 'bluesky', 'instagram', 'pixelfed', '@mastodon@mastodon.social').
   * Deja en '' las que no uses.
   */
  social: {
    mastodon: 'https://mastodon.social/@mastodon',
    bluesky: 'https://bsky.app/profile/bsky.app',
    instagram: 'https://www.instagram.com/instagram/',
    pixelfed: 'https://pixelfed.social/pixelfed',
    substack: '',
  },
} as const;
