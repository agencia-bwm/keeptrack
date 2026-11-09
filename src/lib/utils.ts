import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/* Configurações gerais (arquivo único do painel) */
export async function getSite() {
  const e = await getEntry('config', 'site');
  if (!e) throw new Error('src/content/config/site.yml não encontrado');
  return e.data;
}

/* WhatsApp ---------------------------------------------------------------- */
export function linkWhatsApp(numero: string, texto?: string) {
  const q = texto ? `?text=${encodeURIComponent(texto)}` : '';
  return `https://wa.me/${numero}${q}`;
}

export function formatarTelefone(numero: string) {
  // 5514998028008 -> (14) 99802-8008
  const n = numero.replace(/^55/, '');
  return `(${n.slice(0, 2)}) ${n.slice(2, n.length - 4)}-${n.slice(-4)}`;
}

/* Datas -------------------------------------------------------------------- */
const TZ = 'UTC'; // datas do painel são dias "puros"; formatar em UTC evita voltar um dia
export const hoje = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

export function dataLonga(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
}
export function dataCurta(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ });
}
export function diaMes(d: Date) {
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: TZ });
  const mes = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: TZ }).replace('.', '');
  const ano = d.toLocaleDateString('pt-BR', { year: 'numeric', timeZone: TZ });
  const semana = d.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: TZ });
  return { dia, mes, ano, semana };
}
export function mesAno(d: Date) {
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: TZ }).replace('.', '').replace(' de ', ' ');
}

/** Período de viagem. Viagens realizadas mostram só mês/ano. */
export function periodo(inicio: Date, fim: Date, somenteMes = false) {
  if (somenteMes) {
    const a = mesAno(inicio);
    const b = mesAno(fim);
    return a === b ? a : `${a.split(' ')[0]}–${b}`;
  }
  const mesmoMes = inicio.getUTCMonth() === fim.getUTCMonth() && inicio.getUTCFullYear() === fim.getUTCFullYear();
  if (mesmoMes) {
    return `${inicio.getUTCDate()} a ${dataLonga(fim)}`;
  }
  return `${dataLonga(inicio).replace(/ de \d{4}$/, '')} a ${dataLonga(fim)}`;
}

export function dias(inicio: Date, fim: Date) {
  return Math.round((fim.getTime() - inicio.getTime()) / 86400000) + 1;
}

/* Rótulos ------------------------------------------------------------------ */
export const rotulos = {
  dificuldade: { leve: 'Leve', moderado: 'Moderado', avancado: 'Avançado' },
  statusViagem: { proxima: 'Inscrições abertas', esgotada: 'Esgotada', realizada: 'Realizada' },
  modalidade: { grupo: 'Aberto em grupo', personalizado: 'Personalizado', corporativo: 'Corporativo' },
  nivel: { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado', todos: 'Todos os níveis' },
  categoria: { relatos: 'Relatos de viagem', dicas: 'Dicas 4x4', equipamentos: 'Equipamentos', noticias: 'Notícias' },
  statusTurma: { aberta: 'Vagas abertas', esgotada: 'Esgotada', realizada: 'Realizada' },
} as const;

/* Coleções ------------------------------------------------------------------ */
export type Treinamento = CollectionEntry<'treinamentos'>;
export type Viagem = CollectionEntry<'viagens'>;
export type Post = CollectionEntry<'blog'>;

/** Turmas futuras de um treinamento (data >= hoje e não realizadas), em ordem. */
export function proximasTurmas(t: Treinamento) {
  const h = hoje().getTime();
  return t.data.turmas
    .filter((x) => x.data.getTime() >= h && x.status !== 'realizada')
    .sort((a, b) => a.data.getTime() - b.data.getTime());
}

/** Todas as próximas turmas de todos os treinamentos, para a home e a listagem. */
export async function agendaTurmas() {
  const ts = await getTreinamentos();
  return ts
    .flatMap((t) => proximasTurmas(t).map((turma) => ({ turma, treinamento: t })))
    .sort((a, b) => a.turma.data.getTime() - b.turma.data.getTime());
}

export async function getTreinamentos() {
  return (await getCollection('treinamentos')).sort((a, b) => a.data.ordem - b.data.ordem);
}

/** Uma viagem "próxima" com data de fim já passada vira realizada automaticamente. */
export function statusEfetivo(v: Viagem) {
  if (v.data.status !== 'realizada' && v.data.fim.getTime() < hoje().getTime()) return 'realizada';
  return v.data.status;
}

export async function getViagens() {
  const vs = await getCollection('viagens');
  const proximas = vs
    .filter((v) => statusEfetivo(v) !== 'realizada')
    .sort((a, b) => a.data.inicio.getTime() - b.data.inicio.getTime());
  const realizadas = vs
    .filter((v) => statusEfetivo(v) === 'realizada')
    .sort((a, b) => b.data.inicio.getTime() - a.data.inicio.getTime());
  return { proximas, realizadas };
}

export async function getPosts() {
  return (await getCollection('blog', (p) => import.meta.env.DEV || !p.data.rascunho)).sort(
    (a, b) => b.data.publicado.getTime() - a.data.publicado.getTime(),
  );
}

export function tempoLeitura(texto = '') {
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}
