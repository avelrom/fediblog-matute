import { actor } from '../lib/actor';
import { SITE } from '../config';

/** Metadatos del feed (RSS y JSON Feed) de este tema. */
export const feedChannel = {
  title: SITE.site.title,
  description: actor.summaryText || `Entradas de ${actor.handle}`,
  language: SITE.site.locale,
  author: actor.name,
  avatar: actor.avatar,
};
