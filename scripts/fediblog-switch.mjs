#!/usr/bin/env node
/**
 * Cambia tu blog a otro tema de Fediblog conservando tu configuración.
 *
 *   node scripts/fediblog-switch.mjs <tema>        (mallo, matute, weiss, gaite)
 *   node scripts/fediblog-switch.mjs <tema> --dry-run
 *
 * Normalmente no se ejecuta a mano: lo lanza el flujo «Cambiar de tema
 * Fediblog» desde la pestaña Actions de GitHub (o el trabajo equivalente de
 * GitLab), que abre un Pull Request con el cambio para que lo revises.
 *
 * Qué hace:
 *  1. Trae los archivos del tema nuevo (los de su `fediblog.manifest.json`) y
 *     borra los del tema anterior que el nuevo no usa.
 *  2. Lleva a tu `src/config.ts` nuevo los ajustes que TÚ habías cambiado en el
 *     anterior (tu cuenta, título, redes, comentarios…). Lo que sea propio del
 *     tema anterior y no exista en el nuevo se anota en el informe.
 *  3. Trae las fuentes e iconos que necesite el tema nuevo (sin pisar los tuyos)
 *     y sus dependencias en `package.json`.
 *
 * Variables opcionales: THEMES_DIR (carpeta con los temas, para probar sin red)
 * y REPORT_PATH (dónde escribir el informe en Markdown).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, rmdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const target = (args.find((a) => !a.startsWith('--')) || process.env.THEME || '').trim().toLowerCase();
const THEMES_DIR = process.env.THEMES_DIR || null;
const REPORT_PATH = process.env.REPORT_PATH || null;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const local = (p) => join(ROOT, p);
const readLocal = (p) => (existsSync(local(p)) ? readFileSync(local(p)) : null);
function writeLocal(p, content) {
  if (dryRun) return;
  mkdirSync(dirname(local(p)), { recursive: true });
  writeFileSync(local(p), content);
}

async function fetchRaw(repo, ref, path) {
  if (THEMES_DIR) {
    const name = repo.split('/').pop().replace(/^fediblog-/, '');
    const full = join(THEMES_DIR, name, path);
    return existsSync(full) ? readFileSync(full) : null;
  }
  if (repo.includes('USER/')) {
    throw new Error(`El repositorio del tema sigue con el marcador «${repo}». Cámbialo en fediblog.manifest.json («themes»).`);
  }
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`No se pudo descargar ${path} de ${repo}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Lectura y reescritura de config.ts (sin ejecutarlo) ──────────────────
// Los archivos de configuración son de la forma `clave: valor,` (un valor por
// línea) dentro de bloques `clave: {` … `}`. Se leen los valores sencillos de una
// línea y se sustituyen en el config nuevo conservando sus comentarios y tipos.
const OPEN = /^(\s*)([A-Za-z0-9_]+):\s*\{\s*$/;
const CLOSE = /^\s*\}(?:\s+as\s+[^{}]*)?[,;]?\s*$/;
const KV = /^(\s*)([A-Za-z0-9_]+):\s*(.*)$/;

/** Separa «valor, // comentario» respetando comillas. */
function splitValue(rest) {
  let q = null;
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '/' && rest[i + 1] === '/') return { code: rest.slice(0, i).trimEnd(), comment: rest.slice(i) };
  }
  return { code: rest.trimEnd(), comment: '' };
}

function balanced(s) {
  let q = null, d = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') q = c;
    else if ('[({'.includes(c)) d++;
    else if ('])}'.includes(c)) d--;
  }
  return !q && d === 0;
}

/** Recorre un config y devuelve [{ path, lineIndex, key, indent, value, suffix, comma, comment }]. */
function scan(text) {
  const lines = text.split('\n');
  const stack = [];
  const out = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) return;
    const open = line.match(OPEN);
    if (open) { stack.push(open[2]); return; }
    if (CLOSE.test(line)) { stack.pop(); return; }
    const kv = line.match(KV);
    if (!kv) return;
    const { code, comment } = splitValue(kv[3]);
    if (!code || !balanced(code)) return; // valor de varias líneas: no se toca
    const comma = code.endsWith(',') ? ',' : '';
    let body = comma ? code.slice(0, -1).trimEnd() : code;
    let suffix = '';
    const as = body.match(/^(.*?)\s+as\s+(.+)$/);
    if (as) { body = as[1].trim(); suffix = ` as ${as[2]}`; }
    out.push({ path: [...stack, kv[2]].join('.'), lineIndex: i, key: kv[2], indent: kv[1], value: body, suffix, comma, comment });
  });
  return { lines, entries: out };
}

const kindOf = (v) =>
  /^'.*'$|^".*"$/.test(v) ? 'string' : /^-?\d+(\.\d+)?$/.test(v) ? 'number' : v === 'true' || v === 'false' ? 'boolean' : v === 'null' ? 'null' : v.startsWith('[') ? 'array' : 'other';
const items = (v) => [...v.matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2]);

/** ¿Encaja el valor del usuario en el tipo del config nuevo? */
function compatible(userValue, targetValue, targetSuffix) {
  const uk = kindOf(userValue), tk = kindOf(targetValue);
  const nullable = /\bnull\b/.test(targetSuffix);
  const ok = uk === tk || (uk === 'null' && nullable) || (tk === 'null' && ['string', 'number'].includes(uk));
  if (!ok || uk === 'other') return false;
  const allowed = new Set(items(targetSuffix));
  if (allowed.size && (uk === 'string' || uk === 'array')) return items(userValue).every((x) => allowed.has(x));
  return true;
}

// Ajustes equivalentes con distinto nombre según el tema (Matute/Gaite ↔ Mallo/Weiss).
const ALIASES = [
  ['home.postsPerPage', 'gallery.postsPerPage'],
  ['site.sizes', 'gallery.sizes'],
  ['site.defaultSize', 'gallery.defaultSize'],
];
const aliasOf = (path) => ALIASES.flatMap(([a, b]) => (a === path ? [b] : b === path ? [a] : []));

function mergeConfig(userText, oldDefaultText, targetText) {
  const user = scan(userText).entries;
  const old = oldDefaultText ? new Map(scan(oldDefaultText).entries.map((e) => [e.path, e.value])) : null;
  const tgt = scan(targetText);
  const byPath = new Map(tgt.entries.map((e) => [e.path, e]));
  const carried = [], missing = [], skipped = [];
  for (const u of user) {
    if (old && old.get(u.path) === u.value) continue; // sin tocar respecto al tema anterior
    const t = byPath.get(u.path) ?? aliasOf(u.path).map((a) => byPath.get(a)).find(Boolean);
    if (!t) { missing.push(u.path); continue; }
    if (t.value === u.value) continue;
    if (!compatible(u.value, t.value, t.suffix)) { skipped.push(u.path); continue; }
    tgt.lines[t.lineIndex] = `${t.indent}${t.key}: ${u.value}${t.suffix}${t.comma}${t.comment ? ` ${t.comment}` : ''}`;
    carried.push(t.path);
  }
  return { text: tgt.lines.join('\n'), carried, missing, skipped };
}

// ── Principal ────────────────────────────────────────────────────────────
async function main() {
  const manifestPath = 'fediblog.manifest.json';
  if (!existsSync(local(manifestPath))) throw new Error('No encuentro fediblog.manifest.json — ¿estás en la carpeta del blog?');
  const manifest = JSON.parse(readFileSync(local(manifestPath), 'utf8'));
  const themes = manifest.themes || {};
  const available = Object.keys(themes);
  if (!target) throw new Error(`Indica el tema nuevo. Disponibles: ${available.join(', ')}.`);
  if (!themes[target]) throw new Error(`Tema desconocido «${target}». Disponibles: ${available.join(', ')}.`);
  if (target === manifest.theme) throw new Error(`Ya usas ${target}.`);

  const ref = manifest.ref || 'main';
  const targetRepo = themes[target];
  const rawManifest = await fetchRaw(targetRepo, ref, 'fediblog.manifest.json');
  if (!rawManifest) throw new Error(`No encuentro el tema ${target} en ${targetRepo}.`);
  const targetManifest = JSON.parse(rawManifest.toString('utf8'));

  // 1. Archivos del tema nuevo
  const newLock = {};
  const written = [];
  for (const p of targetManifest.framework) {
    const buf = await fetchRaw(targetRepo, ref, p);
    if (!buf) continue;
    writeLocal(p, buf);
    newLock[p] = sha256(buf);
    written.push(p);
  }
  // 2. Archivos del tema anterior que ya no hacen falta
  const removed = [];
  const keep = new Set(targetManifest.framework);
  for (const p of manifest.framework || []) {
    if (keep.has(p) || !existsSync(local(p))) continue;
    if (!dryRun) {
      rmSync(local(p));
      let d = dirname(local(p));
      while (d.startsWith(join(ROOT, 'src')) && d !== join(ROOT, 'src') && readdirSync(d).length === 0) { rmdirSync(d); d = dirname(d); }
    }
    removed.push(p);
  }
  // 3. Configuración: tus ajustes sobre el config del tema nuevo
  const userConfig = readLocal('src/config.ts')?.toString('utf8') ?? '';
  const targetConfig = (await fetchRaw(targetRepo, ref, 'src/config.ts'))?.toString('utf8');
  if (!targetConfig) throw new Error('El tema nuevo no trae src/config.ts.');
  let oldDefault = null;
  try { oldDefault = (await fetchRaw(manifest.repo, ref, 'src/config.ts'))?.toString('utf8') ?? null; } catch { /* sin red: se llevan todos los valores */ }
  const merged = mergeConfig(userConfig, oldDefault, targetConfig);
  writeLocal('src/config.ts', merged.text);
  // 4. Fuentes e iconos del tema nuevo (sin pisar los tuyos)
  const assets = [];
  for (const p of targetManifest.public || []) {
    if (existsSync(local(`public/${p}`))) continue;
    const buf = await fetchRaw(targetRepo, ref, `public/${p}`);
    if (!buf) continue;
    writeLocal(`public/${p}`, buf);
    assets.push(`public/${p}`);
  }
  // 5. Dependencias
  const targetPkg = JSON.parse((await fetchRaw(targetRepo, ref, 'package.json'))?.toString('utf8') || '{}');
  const pkgPath = 'package.json';
  const pkg = JSON.parse(readFileSync(local(pkgPath), 'utf8'));
  pkg.dependencies = { ...(pkg.dependencies || {}), ...(targetPkg.dependencies || {}) };
  if (targetPkg.scripts) pkg.scripts = { ...(pkg.scripts || {}), ...targetPkg.scripts };
  writeLocal(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  // 6. Manifiesto y registro: ahora apuntan al tema nuevo (para futuras actualizaciones)
  writeLocal(manifestPath, JSON.stringify({ ...targetManifest, themes }, null, 2) + '\n');
  writeLocal('.fediblog/lock.json', JSON.stringify({ version: ref, files: newLock }, null, 2) + '\n');

  const report = [
    `# Cambio de tema: ${manifest.theme} → ${target}`,
    '',
    `- ${written.length} archivos del tema nuevo traídos, ${removed.length} del anterior eliminados.`,
    `- **${merged.carried.length} ajustes tuyos conservados** (cuenta, título, redes, comentarios…).`,
    merged.missing.length
      ? `- Ajustes tuyos que el tema nuevo **no tiene** (no se han podido llevar): ${merged.missing.map((x) => `\`${x}\``).join(', ')}.`
      : '- Todos tus ajustes existen en el tema nuevo.',
    merged.skipped.length
      ? `- Ajustes cuyo valor **no es válido** en el tema nuevo (se queda el suyo por defecto): ${merged.skipped.map((x) => `\`${x}\``).join(', ')}.`
      : '',
    assets.length ? `- Fuentes e iconos nuevos: ${assets.map((x) => `\`${x}\``).join(', ')}.` : '',
    '',
    'Revisa `src/config.ts`: el tema nuevo trae ajustes propios con sus valores por defecto.',
    'Si algo no te gusta, cierra este Pull Request sin fusionarlo y tu blog sigue como estaba.',
    '',
  ].filter((l) => l !== '').join('\n');
  console.log(report);
  if (REPORT_PATH) writeFileSync(REPORT_PATH, report + '\n');
  if (dryRun) console.log('\n(--dry-run: no se ha escrito nada)');
}

main().catch((err) => { console.error(`✗ ${err.message}`); process.exit(1); });
