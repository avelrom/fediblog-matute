import { rssXsl } from '@fediblog/core/lib/rss-xsl';

// Hoja de estilo con la que el navegador muestra el feed (los lectores RSS la ignoran).
export const GET = () =>
  rssXsl({
    light: { bg: '#ffffff', fg: '#111111', muted: '#6b6b6b', line: '#e4e4e4', soft: '#f5f5f5', accent: '#3a3a3a' },
    dark: { bg: '#121212', fg: '#ececec', muted: '#9a9a9a', line: '#2e2e2e', soft: '#1c1c1c', accent: '#c8c8c8' },
    font: "'Commit Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  });
