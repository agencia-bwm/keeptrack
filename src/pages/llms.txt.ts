// llms.txt gerado no build a partir do conteúdo do painel
import type { APIContext } from 'astro';
import { getSite, getTreinamentos, getViagens, getPosts, agendaTurmas, dataLonga, formatarTelefone } from '../lib/utils';

export async function GET({ site: base }: APIContext) {
  const site = await getSite();
  const u = (p: string) => new URL(p, base).href;
  const ts = await getTreinamentos();
  const { proximas, realizadas } = await getViagens();
  const posts = await getPosts();
  const agenda = await agendaTurmas();
  const txt = `# KeepTrack 4x4

> Empresa de Brotas-SP especializada em treinamentos de técnicas de condução 4x4 e expedições off-road guiadas pelo Brasil e pela América do Sul. Os treinamentos acontecem no Raceville Speed Club (Brotas-SP). Atendimento e inscrições pelo WhatsApp ${formatarTelefone(site.whatsappPrincipal)}.

## Treinamentos
${ts.map((t) => `- [${t.data.titulo}](${u(`/treinamentos/${t.id}/`)}): ${t.data.resumo}`).join('\n')}

## Próximas turmas
${agenda.length ? agenda.map((a) => `- ${dataLonga(a.turma.data)}: ${a.treinamento.data.titulo}, ${a.turma.local ?? a.treinamento.data.local}`).join('\n') : '- Novas turmas em breve'}

## Viagens e expedições
${[...proximas, ...realizadas].map((v) => `- [${v.data.titulo}](${u(`/viagens/${v.id}/`)}): ${v.data.resumo}`).join('\n')}

## Blog
${posts.map((p) => `- [${p.data.titulo}](${u(`/blog/${p.id}/`)}): ${p.data.resumo}`).join('\n')}

## Empresa
- [A KeepTrack](${u('/a-keeptrack/')}): história, equipe, frota e parceria com o Raceville Speed Club
- [Contato](${u('/contato/')}): WhatsApp, e-mail (${site.email}), Instagram e Facebook
`;
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
