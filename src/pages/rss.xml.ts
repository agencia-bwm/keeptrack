import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/utils';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: 'Blog KeepTrack 4x4',
    description: 'Dicas de condução 4x4 e relatos das expedições da KeepTrack.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.titulo,
      description: p.data.resumo,
      pubDate: p.data.publicado,
      link: `/blog/${p.id}/`,
      categories: [p.data.categoria, ...p.data.tags],
    })),
    customData: '<language>pt-BR</language>',
  });
}
