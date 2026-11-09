#!/usr/bin/env node
/**
 * Baixa as fotos provisórias do site antigo (www.keeptrack.com.br/wp/wp-content/uploads/...)
 * citadas no conteúdo para src/assets/uploads/legado/, mantendo o caminho.
 * Depois disso o Astro passa a otimizá-las (AVIF/WebP) automaticamente — não precisa
 * mudar o conteúdo: src/lib/imagens.ts usa a cópia local quando ela existe.
 *
 * Uso: npm run imagens
 */
import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;
const DESTINO = join(RAIZ, 'src/assets/uploads/legado');
const RE = /https:\/\/www\.keeptrack\.com\.br\/wp\/wp-content\/uploads\/([^\s"')]+)/g;

async function arquivos(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await arquivos(p)));
    else if (/\.(md|ya?ml|astro|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

const urls = new Map();
for (const f of [...(await arquivos(join(RAIZ, 'src/content'))), ...(await arquivos(join(RAIZ, 'src/pages')))]) {
  for (const m of (await readFile(f, 'utf8')).matchAll(RE)) urls.set(m[1], m[0]);
}

let ok = 0, pulou = 0, falhou = 0;
for (const [rel, url] of urls) {
  const alvo = join(DESTINO, rel);
  try { await access(alvo); pulou++; continue; } catch {}
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    await mkdir(dirname(alvo), { recursive: true });
    await writeFile(alvo, Buffer.from(await r.arrayBuffer()));
    ok++;
    console.log('✓', rel);
  } catch (e) {
    falhou++;
    console.warn('✗', rel, e.message);
  }
}
console.log(`\n${ok} baixadas, ${pulou} já existiam, ${falhou} falharam (${urls.size} no total).`);
