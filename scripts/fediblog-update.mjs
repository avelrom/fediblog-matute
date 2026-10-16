#!/usr/bin/env node
/**
 * Trae mejoras del tema (Fediblog/Texto) sin tocar lo tuyo.
 *
 * Cómo funciona, en corto: `fediblog.manifest.json` lista qué archivos son
 * "del tema" (layouts, componentes, lib, páginas de ruta…). Todo lo que no
 * está en esa lista — sobre todo `src/config.ts`, tu configuración — no se
 * toca nunca. `.fediblog/lock.json` recuerda el sha256 de cada archivo del
 * tema tal y como estaba la última vez que se sincronizó:
 *
 *   - Si tu copia local coincide con ese sha (no la has tocado) y la de
 *     arriba cambió → se actualiza sola.
 *   - Si tu copia local coincide con ese sha y arriba no cambió → no hay nada
 *     que hacer.
 *   - Si tu copia local NO coincide (la editaste) y arriba tampoco cambió →
 *     se deja tal cual, es tuya.
 *   - Si tu copia local NO coincide Y arriba también cambió → conflicto: no
 *     se sobrescribe nada, se escribe la versión de arriba al lado como
 *     «archivo.ext.upstream» para que compares y fusiones a mano.
 *
 * Uso:
 *   npm run fediblog:update
 *   npm run fediblog:update -- --dry-run          (solo informa, no escribe nada)
 *   npm run fediblog:update -- --upstream-dir ../otra-copia   (para probar en local, sin red)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MANIFEST_PATH = join(ROOT, 'fediblog.manifest.json');
const LOCK_PATH = join(ROOT, '.fediblog', 'lock.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const upstreamDirFlag = args.indexOf('--upstream-dir');
const upstreamDir = upstreamDirFlag !== -1 ? args[upstreamDirFlag + 1] : null;

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function readLocal(path) {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full) : null;
}

function writeLocal(path, content) {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

async function fetchUpstream(path, manifest) {
  if (upstreamDir) {
    const full = join(upstreamDir, path);
    return existsSync(full) ? readFileSync(full) : null;
  }
  if (manifest.repo.includes('USER/')) {
    throw new Error(
      `fediblog.manifest.json todavía tiene el marcador «${manifest.repo}» sin rellenar. Cambia "repo" por el repositorio real del tema antes de actualizar.`
    );
  }
  const url = `https://raw.githubusercontent.com/${manifest.repo}/${manifest.ref}/${path}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`No se pudo descargar ${path}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function loadLock() {
  if (!existsSync(LOCK_PATH)) return { version: null, files: {} };
  try {
    return JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
  } catch {
    return { version: null, files: {} };
  }
}

function saveLock(lock) {
  if (dryRun) return;
  mkdirSync(dirname(LOCK_PATH), { recursive: true });
  writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n');
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('No encuentro fediblog.manifest.json — ¿estás en la carpeta del tema?');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const lock = loadLock();
  const firstRun = !existsSync(LOCK_PATH);
  if (firstRun) {
    console.log('Primera vez que se ejecuta: no hay .fediblog/lock.json todavía.');
    console.log('Por seguridad, cualquier archivo que ya difiera de la versión de arriba se deja intacto (con un .upstream al lado) en vez de sobrescribirse a ciegas.\n');
  }

  const results = { updated: [], upToDate: [], userModified: [], conflicts: [], added: [], missingUpstream: [] };
  const newFileLocks = {};

  for (const path of manifest.framework) {
    let upstream;
    try {
      upstream = await fetchUpstream(path, manifest);
    } catch (err) {
      console.error(`✗ ${path}: ${err.message}`);
      process.exitCode = 1;
      continue;
    }
    if (upstream === null) {
      results.missingUpstream.push(path);
      continue;
    }
    const upstreamSha = sha256(upstream);
    const local = readLocal(path);
    const lockedSha = lock.files[path];

    if (local === null) {
      // No existe en tu copia todavía (archivo nuevo del tema).
      if (!dryRun) writeLocal(path, upstream);
      results.added.push(path);
      newFileLocks[path] = upstreamSha;
      continue;
    }

    const localSha = sha256(local);

    if (localSha === upstreamSha) {
      // Ya coincide (lo hayas tocado o no): nada que hacer, solo fijar el lock.
      results.upToDate.push(path);
      newFileLocks[path] = upstreamSha;
      continue;
    }

    // lockedSha === undefined solo pasa en la primera ejecución sin lock previo;
    // ahí NO asumimos que el archivo esté "sin tocar" (ver aviso de más arriba).
    const treatAsUnmodified = lockedSha === localSha;

    if (treatAsUnmodified) {
      // No lo has tocado desde el último sync: se actualiza solo.
      if (!dryRun) writeLocal(path, upstream);
      results.updated.push(path);
      newFileLocks[path] = upstreamSha;
    } else if (firstRun) {
      // Primera vez, sin lock: no sabemos si es tuyo. No se sobrescribe.
      if (!dryRun) writeLocal(`${path}.upstream`, upstream);
      results.conflicts.push(path);
      // No fijamos lock todavía — a que decidas y vuelvas a ejecutar.
    } else if (lockedSha === upstreamSha) {
      // Arriba no ha cambiado desde tu último sync; solo lo tocaste tú.
      results.userModified.push(path);
      newFileLocks[path] = lockedSha;
    } else {
      // Los dos cambiaron, de forma distinta: conflicto real.
      if (!dryRun) writeLocal(`${path}.upstream`, upstream);
      results.conflicts.push(path);
      newFileLocks[path] = lockedSha; // se mantiene hasta que fusiones a mano
    }
  }

  if (!dryRun) {
    saveLock({ version: manifest.ref, files: newFileLocks });
  }

  console.log(`\n${results.updated.length} actualizados`);
  results.updated.forEach((p) => console.log(`  ↑ ${p}`));
  if (results.added.length) {
    console.log(`\n${results.added.length} nuevos (no existían en tu copia)`);
    results.added.forEach((p) => console.log(`  + ${p}`));
  }
  if (results.conflicts.length) {
    console.log(`\n⚠ ${results.conflicts.length} con conflicto — revisa el «.upstream» y fusiona a mano:`);
    results.conflicts.forEach((p) => console.log(`  ⚠ ${p}  →  ${p}.upstream`));
  }
  if (results.userModified.length) {
    console.log(`\n${results.userModified.length} tuyos, sin cambios arriba (se dejan tal cual):`);
    results.userModified.forEach((p) => console.log(`  · ${p}`));
  }
  console.log(`\n${results.upToDate.length} sin cambios.`);
  if (results.missingUpstream.length) {
    console.log(`\n${results.missingUpstream.length} ya no existen en el tema (puedes borrarlos si quieres):`);
    results.missingUpstream.forEach((p) => console.log(`  - ${p}`));
  }
  if (dryRun) console.log('\n(--dry-run: no se ha escrito nada)');
}

main();
