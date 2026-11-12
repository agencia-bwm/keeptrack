/**
 * Artes de compartilhamento (Open Graph 1200×630) geradas no build, uma por página.
 * Cada página nova entra aqui automaticamente quando vem de uma coleção
 * (treinamentos, viagens, posts). Páginas fixas estão listadas em `fixas`.
 */
import { getEntry } from 'astro:content';
import { getTreinamentos, getViagens, getPosts, quandoViagem, statusEfetivo, rotulos, proximasTurmas, dataLonga } from './utils';

export interface ArteOg {
  slug: string;      // caminho da página sem barras ('' = home)
  eyebrow: string;
  titulo: string;
  sub?: string;
  imagem: string;    // mesmo valor do campo de imagem do painel
}

/**
 * Endereço onde o site está publicado neste build. Na Vercel (versão de teste)
 * usa o domínio da própria Vercel; na Hostinger, o domínio oficial (astro.config).
 * Sem isso a imagem de compartilhamento apontaria para keeptrack.com.br, que
 * ainda é o site antigo, e o WhatsApp/Facebook não mostrariam imagem nenhuma.
 */
export function origemPublicada(site: URL | undefined): string {
  const e = process.env;
  const vercel = e.VERCEL_ENV === 'production' ? e.VERCEL_PROJECT_PRODUCTION_URL : e.VERCEL_BRANCH_URL || e.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return (site ?? new URL('https://www.keeptrack.com.br')).origin;
}

/** Caminho da arte para uma URL de página: '/viagens/x/' -> '/og/viagens/x.jpg' */
export function urlOg(pathname: string) {
  const slug = pathname.replace(/^\/|\/$/g, '');
  return `/og/${slug || 'home'}.jpg`;
}

export async function artesOg(): Promise<ArteOg[]> {
  const home = (await getEntry('home', 'home'))!.data;
  const sobre = (await getEntry('sobre', 'a-keeptrack'))!.data;
  const ts = await getTreinamentos();
  const { proximas, realizadas } = await getViagens();
  const posts = await getPosts();

  const fixas: ArteOg[] = [
    { slug: '', eyebrow: 'Treinamentos e expedições 4x4', titulo: home.heroTitulo, sub: 'Brasil e América do Sul', imagem: home.heroImagem },
    { slug: 'a-keeptrack', eyebrow: 'Quem somos', titulo: sobre.titulo, sub: 'Expedições, treinamentos e eventos off-road', imagem: sobre.capa },
    { slug: 'treinamentos', eyebrow: 'Treinamentos', titulo: 'Treinamentos de condução 4x4', sub: 'Haras Tuiuti · Tuiuti-SP', imagem: '/src/assets/uploads/fotos/treinamento/defender-subida.jpg' },
    { slug: 'viagens', eyebrow: 'Expedições guiadas', titulo: 'Viagens & Expedições 4x4', sub: 'Roteiros off-road pelo Brasil e América do Sul', imagem: '/src/assets/uploads/fotos/jalapao/dunas.jpg' },
    { slug: 'blog', eyebrow: 'Dicas 4x4', titulo: 'Dicas e relatos off-road', sub: 'Técnica, equipamentos e histórias de expedição', imagem: '/src/assets/uploads/fotos/canastra/poeira.jpg' },
    { slug: 'contato', eyebrow: 'Contato', titulo: 'Fale com a KeepTrack', sub: 'Atendimento direto pelo WhatsApp', imagem: '/src/assets/uploads/fotos/treinamento/turma-defender.jpg' },
    { slug: 'politica-de-privacidade', eyebrow: 'LGPD', titulo: 'Privacidade e cookies', sub: 'Como tratamos seus dados', imagem: '/src/assets/uploads/fotos/canastra/comboio-aereo.jpg' },
  ];

  const treinamentos: ArteOg[] = ts.map((t) => {
    const prox = proximasTurmas(t)[0];
    return {
      slug: `treinamentos/${t.id}`,
      eyebrow: `Treinamento · ${rotulos.modalidade[t.data.modalidade]}`,
      titulo: t.data.titulo,
      sub: prox ? `Próxima turma: ${dataLonga(prox.data)} · ${t.data.local}` : t.data.local,
      imagem: t.data.capa,
    };
  });

  const viagens: ArteOg[] = [...proximas, ...realizadas].map((v) => {
    const st = statusEfetivo(v);
    return {
      slug: `viagens/${v.id}`,
      eyebrow: `Expedição · ${rotulos.statusViagem[st]}`,
      titulo: v.data.titulo,
      sub: `${quandoViagem(v, st === 'realizada')} · ${v.data.destinos.slice(0, 2).join(' · ')}`,
      imagem: v.data.capa,
    };
  });

  const blog: ArteOg[] = posts.map((p) => ({
    slug: `blog/${p.id}`,
    eyebrow: rotulos.categoria[p.data.categoria],
    titulo: p.data.titulo,
    sub: dataLonga(p.data.publicado),
    imagem: p.data.capa,
  }));

  return [...fixas, ...treinamentos, ...viagens, ...blog];
}
