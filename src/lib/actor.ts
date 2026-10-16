/** Datos de la cuenta: el motor vive en @fediblog/core, aquí solo los valores por defecto del tema. */
import { createActor } from '@fediblog/core/lib/actor';
import { SITE } from '../config';

export const { actor, formatCount } = createActor({ handle: SITE.handle, profile: SITE.profile, locale: SITE.site.locale });
