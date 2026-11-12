import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Campos compartilhados ------------------------------------------------- */

// Caminho de imagem: "/src/assets/uploads/arquivo.jpg" (painel) ou URL https (provisório)
const imagem = z.string().min(1);

/** Campo opcional tolerante ao painel: o Pages CMS grava "" ou null quando o
 *  campo fica vazio — aqui isso vira "não preenchido" em vez de quebrar o build. */
const opcional = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), s.optional());

/** Referência gravada pelo painel como caminho ("src/content/viagens/proximas/x.md")
 *  ou como id ("x"): as duas formas viram o id "x". */
const idDoCaminho = (v: unknown) =>
  typeof v === 'string' ? v.split('/').pop()!.replace(/\.(md|mdx|ya?ml)$/, '') : v;

/** id da entrada = campo `slug` (gravado pelo painel) ou, sem ele, o nome do arquivo —
 *  mesmo dentro de subpastas: viagens/proximas/x.md e viagens/realizadas/x.md
 *  continuam com URL /viagens/x/ */
const idPeloSlug = ({ entry, data }: { entry: string; data: Record<string, unknown> }) =>
  typeof data.slug === 'string' && data.slug
    ? data.slug
    : entry.split('/').pop()!.replace(/\.(md|mdx)$/, '');

/* Tolerância a descuidos no painel -------------------------------------
 * O build só para por falta do essencial (título, slug, datas, capa...).
 * Esquecimentos do dia a dia são corrigidos aqui, sem travar a publicação:
 *  - SEO em branco → usa o título e o resumo da página
 *  - textos acima do limite → cortados na última palavra inteira, com "…"
 *  - foto da galeria sem imagem, pergunta do FAQ vazia → ignoradas
 *  - descrição da foto (alt) em branco → usa o título da página
 *  - resposta direta fora de 40–60 palavras → só o painel avisa
 */
const cortar = (max: number) => (t: string) => {
  const s = t.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const corte = s.slice(0, max - 1);
  const ultimoEspaco = corte.lastIndexOf(' ');
  return (ultimoEspaco > max * 0.6 ? corte.slice(0, ultimoEspaco) : corte).replace(/[\s,.;:–-]+$/, '') + '…';
};
const texto = z.string().transform((t) => t.replace(/\s+/g, ' ').trim());
const textoAte = (max: number) => z.string().transform(cortar(max));

const seo = z.object({
  titulo: textoAte(60),
  descricao: textoAte(155),
});

/** Preenche o que o painel deixou em branco antes de validar a página. */
const vazio = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && !v.trim());
const comPadroes = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((bruto) => {
    if (!bruto || typeof bruto !== 'object') return bruto;
    const d = { ...(bruto as Record<string, any>) };
    const seoAtual = d.seo && typeof d.seo === 'object' ? { ...d.seo } : {};
    if (vazio(seoAtual.titulo)) seoAtual.titulo = d.titulo;
    if (vazio(seoAtual.descricao)) seoAtual.descricao = vazio(d.resumo) ? d.titulo : d.resumo;
    d.seo = seoAtual;
    if (vazio(d.capaAlt)) d.capaAlt = d.titulo;
    if (Array.isArray(d.galeria))
      d.galeria = d.galeria
        .filter((g: any) => g && !vazio(g.src))
        .map((g: any) => ({ ...g, alt: vazio(g.alt) ? d.titulo : g.alt }));
    return d;
  }, schema);

const faq = z
  .array(z.object({ pergunta: z.string().nullish(), resposta: z.string().nullish() }))
  .nullish()
  .transform((v) =>
    (v ?? [])
      .filter((f) => !vazio(f.pergunta) && !vazio(f.resposta))
      .map((f) => ({ pergunta: f.pergunta!.trim(), resposta: f.resposta!.trim() })),
  );

const galeria = z
  .array(z.object({ src: z.string().nullish(), alt: z.string().nullish() }))
  .nullish()
  .transform((v) =>
    (v ?? [])
      .filter((g) => !vazio(g.src))
      .map((g) => ({ src: g.src!, alt: (g.alt ?? '').trim() })),
  );

const lista = z
  .array(z.string().nullish())
  .nullish()
  .transform((v) => (v ?? []).filter((x): x is string => !vazio(x)));

/** Resposta direta: obrigatória; a faixa de 40–60 palavras é conferida no painel. */
const respostaDireta = texto.pipe(z.string().min(1, 'Resposta direta é obrigatória'));

const preco = opcional(
  z.object({ valor: opcional(z.number()), texto: opcional(z.string()) }),
);

/* Viagens & Expedições -------------------------------------------------- */
// Painel "Expedições"           → src/content/viagens/proximas/
// Painel "Expedições realizadas" → src/content/viagens/realizadas/
// (scripts/organizar-viagens.mjs move os arquivos quando a viagem termina;
//  a URL vem do campo slug, então não muda com a pasta)
const viagens = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/viagens', generateId: idPeloSlug }),
  schema: comPadroes(z.object({
    titulo: z.string(),
    status: z.enum(['proxima', 'esgotada', 'realizada']),
    inicio: z.coerce.date(),
    fim: z.coerce.date(),
    /** quando as datas exatas ainda não saíram: o site mostra só o mês (ex.: janeiro de 2027) */
    dataAConfirmar: z.boolean().default(false),
    destinos: z.array(z.string()).min(1),
    encontro: opcional(z.string()),
    dificuldade: z.enum(['leve', 'moderado', 'avancado']),
    veiculo: z.string(),
    resumo: textoAte(160),
    resposta: respostaDireta,
    roteiro: z
      .array(
        z.object({
          dia: z.number(),
          titulo: z.string(),
          descricao: z.string(),
          km: opcional(z.number()),
        }),
      )
      .nullish()
      .transform((v) => v ?? []),
    inclui: lista,
    naoInclui: lista,
    preco,
    vagas: opcional(z.number()),
    capa: imagem,
    capaAlt: z.string(),
    galeria,
    faq,
    whatsapp: opcional(z.string()),
    seo,
  })),
});

/* Treinamentos ---------------------------------------------------------- */
const treinamentos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/treinamentos' }),
  schema: comPadroes(z.object({
    titulo: z.string(),
    ordem: z.number().default(10),
    modalidade: z.enum(['grupo', 'personalizado', 'corporativo']),
    nivel: z.enum(['iniciante', 'intermediario', 'avancado', 'todos']),
    resumo: textoAte(160),
    resposta: respostaDireta,
    turmas: z
      .array(
        z.object({
          data: z.coerce.date(),
          horario: opcional(z.string()),
          local: opcional(z.string()),
          vagas: opcional(z.number()),
          status: z.enum(['aberta', 'esgotada', 'realizada']).default('aberta'),
        }),
      )
      .nullish()
      .transform((v) => v ?? []),
    /** aviso exibido abaixo da lista de turmas (ex.: calendário do ano seguinte) */
    avisoTurmas: opcional(z.string()),
    cargaHoraria: z.string(),
    local: z.string(),
    conteudo: z.array(z.string()).min(1),
    paraQuem: z.array(z.string()).min(1),
    requisitos: z.array(z.string()).min(1),
    inclui: lista,
    naoInclui: lista,
    preco,
    /** Local em destaque na página (ex.: Haras Tuiuti) */
    sobreLocal: opcional(
      z.object({ nome: z.string().min(1), texto: z.string(), logo: opcional(imagem) }),
    ),
    programacao: z
      .array(z.object({ hora: z.string(), atividade: z.string() }))
      .nullish()
      .transform((v) => v ?? []),
    observacao: opcional(z.string()),
    planos: z
      .array(
        z.object({
          nome: z.string(),
          subtitulo: opcional(z.string()),
          valor: z.number(),
          descricao: z.string(),
          destaque: z.boolean().default(false),
        }),
      )
      .nullish()
      .transform((v) => v ?? []),
    extras: z
      .array(z.object({ nome: z.string(), valor: z.number(), descricao: z.string() }))
      .nullish()
      .transform((v) => v ?? []),
    pagamento: z
      .array(z.object({ titulo: z.string(), texto: z.string() }))
      .nullish()
      .transform((v) => v ?? []),
    instrutores: z
      .array(z.preprocess(idDoCaminho, reference('equipe')))
      .nullish()
      .transform((v) => v ?? []),
    capa: imagem,
    capaAlt: z.string(),
    galeria,
    faq,
    whatsapp: opcional(z.string()),
    seo,
  })),
});

/* Blog ------------------------------------------------------------------ */
const blog = defineCollection({
  // arquivos antigos que podem ter ficado no repositório: ignorados no build
  loader: glob({ pattern: ['**/*.md', '!primeira-viagem-off-road.md', '!reduzida-bloqueio-e-tracao.md'], base: './src/content/blog' }),
  schema: comPadroes(z.object({
    titulo: z.string(),
    publicado: z.coerce.date(),
    atualizado: opcional(z.coerce.date()),
    autor: z.preprocess(idDoCaminho, reference('equipe')),
    categoria: z.enum(['relatos', 'dicas', 'equipamentos', 'noticias']),
    tags: lista,
    resumo: textoAte(160),
    resposta: respostaDireta,
    capa: imagem,
    capaAlt: z.string(),
    relacionadosViagens: z
      .array(z.preprocess(idDoCaminho, reference('viagens')))
      .nullish()
      .transform((v) => v ?? []),
    /** painel "Expedições realizadas relacionadas"; somado a relacionadosViagens abaixo */
    relacionadosRealizadas: z
      .array(z.preprocess(idDoCaminho, reference('viagens')))
      .nullish()
      .transform((v) => v ?? []),
    relacionadosTreinamentos: z
      .array(z.preprocess(idDoCaminho, reference('treinamentos')))
      .nullish()
      .transform((v) => v ?? []),
    faq,
    seo,
    rascunho: z.boolean().default(false),
  }).transform(({ relacionadosRealizadas, ...d }) => ({
    // o site continua lendo só relacionadosViagens (agenda + realizadas)
    ...d,
    relacionadosViagens: [...d.relacionadosViagens, ...relacionadosRealizadas],
  }))),
});

/* Equipe ---------------------------------------------------------------- */
const equipe = defineCollection({
  // caio-ferraz.md era o perfil antigo do Caio Alves (mesma pessoa): ignorado no build
  loader: glob({ pattern: ['**/*.md', '!caio-ferraz.md'], base: './src/content/equipe' }),
  schema: z.object({
    nome: z.string(),
    cargo: z.string(),
    /** pessoa ou empresa parceira (ex.: produtora de vídeo) — muda o schema.org */
    tipo: z.enum(['pessoa', 'empresa']).default('pessoa'),
    /** sem foto, o site mostra as iniciais na cor da marca */
    foto: opcional(imagem),
    fotoAlt: opcional(z.string()),
    /** enquadramento da foto (CSS object-position), ex.: "95% center" para quem está na direita */
    fotoPosicao: z.string().default('center'),
    /** mini bio; separe parágrafos com uma linha em branco */
    bio: z.string(),
    credenciais: lista,
    ordem: z.number().default(10),
  }),
});

/* Arquivos únicos (configurações e páginas fixas) ----------------------- */
const config = defineCollection({
  loader: glob({ pattern: 'site.yml', base: './src/content/config' }),
  schema: z.object({
    nome: z.string(),
    whatsappPrincipal: z.string().regex(/^\d{12,13}$/, 'Use só números com DDI: 5514998028008'),
    whatsappSecundario: opcional(z.string().regex(/^\d{12,13}$/)),
    whatsappTexto: z.string(),
    email: z.string().email(),
    instagram: z.string().url(),
    facebook: z.string().url(),
    youtube: opcional(z.string().url()),
    parceiros: z
      .array(
        z.object({
          nome: z.string(),
          descricao: opcional(z.string()),
          logo: opcional(imagem),
          url: opcional(z.string().url()),
        }),
      )
      .nullish()
      .transform((v) => v ?? []),
    cidade: z.string(),
    uf: z.string().length(2),
    local: z.object({
      nome: z.string(),
      cidade: z.string(),
      endereco: z.string(),
      mapsUrl: z.string().url(),
      lat: z.number(),
      lng: z.number(),
    }),
    horario: z.string(),
    gtmId: z.string(),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: 'home.yml', base: './src/content/paginas' }),
  schema: z.object({
    heroEyebrow: z.string(),
    heroTitulo: z.string(),
    heroSubtitulo: z.string(),
    heroImagem: imagem,
    heroImagemAlt: z.string(),
    /** fotos extras do topo: a cada visita a home sorteia uma (heroImagem + estas) */
    heroFotos: z
      .array(z.object({ imagem, alt: z.string(), posicao: opcional(z.string()) }))
      .nullish()
      .transform((v) => v ?? []),
    numeros: z.array(z.object({ valor: z.string(), rotulo: z.string() })),
    pilares: z.array(z.object({ titulo: z.string(), texto: z.string() })),
    galeria,
    seo,
  }),
});

const sobre = defineCollection({
  loader: glob({ pattern: 'a-keeptrack.yml', base: './src/content/paginas' }),
  schema: z.object({
    titulo: z.string(),
    subtitulo: z.string(),
    capa: imagem,
    capaAlt: z.string(),
    historia: z.string(),
    servicos: z.array(z.object({ titulo: z.string(), texto: z.string() })),
    frota: z.array(z.string()),
    frotaImagem: imagem,
    frotaImagemAlt: z.string(),
    parceria: z.object({ titulo: z.string(), texto: z.string(), logo: imagem }),
    seo,
  }),
});

export const collections = { viagens, treinamentos, blog, equipe, config, home, sobre };
