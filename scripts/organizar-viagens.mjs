#!/usr/bin/env node
// Organiza as expedições entre os dois painéis do Pages CMS:
//   src/content/viagens/proximas/   → painel "Expedições"
//   src/content/viagens/realizadas/ → painel "Expedições realizadas"
//
// 1. Viagem com status "proxima" ou "esgotada" cuja data de fim já passou
//    vira "realizada" (horário de Brasília).
// 2. Cada arquivo vai para a pasta que corresponde ao status.
//
// Roda no build diário do GitHub Actions (antes do build) e pode ser rodado à mão:
//   node scripts/organizar-viagens.mjs           → aplica
//   node scripts/organizar-viagens.mjs --simular → só mostra o que faria
import { readdir, readFile, writeFile, rename, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = 'src/content/viagens';
const PASTA = { proxima: 'proximas', esgotada: 'proximas', realizada: 'realizadas' };
const simular = process.argv.includes('--simular');
const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()); // AAAA-MM-DD

async function arquivosMd(dir) {
  const out = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) out.push(...(await arquivosMd(p)));
    else if (d.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// Lê um campo simples do frontmatter (status: x / fim: 2026-01-20 / fim: '2026-01-20')
const campo = (fm, nome) => {
  const m = fm.match(new RegExp(`^${nome}:\\s*['"]?([^'"\\n#]+?)['"]?\\s*(#.*)?$`, 'm'));
  return m ? m[1].trim() : undefined;
};

const mudancas = [];
for (const arq of await arquivosMd(BASE)) {
  let txt = await readFile(arq, 'utf8');
  const fmMatch = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];
  let status = campo(fm, 'status');
  const fim = campo(fm, 'fim')?.slice(0, 10);

  if ((status === 'proxima' || status === 'esgotada') && fim && fim < hoje) {
    const novoFm = fm.replace(/^status:.*$/m, 'status: realizada');
    txt = txt.replace(fm, novoFm);
    mudancas.push(`${path.basename(arq)}: status ${status} → realizada (terminou em ${fim})`);
    status = 'realizada';
    if (!simular) await writeFile(arq, txt);
  }

  const pasta = PASTA[status];
  if (!pasta) continue;
  const destino = path.join(BASE, pasta, path.basename(arq));
  if (path.resolve(destino) !== path.resolve(arq)) {
    if (existsSync(destino)) {
      console.warn(`⚠ ${destino} já existe — ${arq} não foi movido.`);
      continue;
    }
    mudancas.push(`${path.relative(BASE, arq)} → ${pasta}/`);
    if (!simular) {
      await mkdir(path.dirname(destino), { recursive: true });
      await rename(arq, destino);
    }
  }
}

console.log(mudancas.length ? mudancas.map((m) => '• ' + m).join('\n') : 'Expedições já organizadas.');
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `mudou=${mudancas.length > 0}\n`);
