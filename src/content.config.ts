import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Campos compartilhados ------------------------------------------------- */

// Caminho de imagem: "/src/assets/uploads/arquivo.jpg" (painel) ou URL https (provisório)
const imagem = z.string().min(1);

const seo = z.object({
  titulo: z.string().max(60, 'Meta title: máximo 60 caracteres'),
  descricao: z.string().max(155, 'Meta description: máximo 155 caracteres'),
});

const faq = z
  .array(z.object({ pergunta: z.string(), resposta: z.string() }))
  .default([]);

const galeria = z.array(z.object({ src: imagem, alt: z.string() })).default([]);

const contarPalavras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const respostaDireta = z
  .string()
  .refine((t) => contarPalavras(t) >= 35 && contarPalavras(t) <= 70, {
    message: 'Resposta direta deve ter entre 40 e 60 palavras (tolerância 35–70)',
  });

const preco = z
  .object({ valor: z.number().optional(), texto: z.string().optional() })
  .optional();

/* Viagens & Expedições -------------------------------------------------- */
const viagens = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/viagens' }),
  schema: z.object({
    titulo: z.string(),
    status: z.enum(['proxima', 'esgotada', 'realizada']),
    inicio: z.coerce.date(),
    fim: z.coerce.date(),
    /** quando as datas exatas ainda não saíram: o site mostra só o mês (ex.: janeiro de 2027) */
    dataAConfirmar: z.boolean().default(false),
    destinos: z.array(z.string()).min(1),
    encontro: z.string().optional(),
    dificuldade: z.enum(['leve', 'moderado', 'avancado']),
    veiculo: z.string(),
    resumo: z.string().max(160),
    resposta: respostaDireta,
    roteiro: z
      .array(
        z.object({
          dia: z.number(),
          titulo: z.string(),
          descricao: z.string(),
          km: z.number().optional(),
        }),
      )
      .default([]),
    inclui: z.array(z.string()).default([]),
    naoInclui: z.array(z.string()).default([]),
    preco,
    vagas: z.number().optional(),
    capa: imagem,
    capaAlt: z.string(),
    galeria,
    faq,
    whatsapp: z.string().optional(),
    seo,
  }),
});

/* Treinamentos ---------------------------------------------------------- */
const treinamentos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/treinamentos' }),
  schema: z.object({
    titulo: z.string(),
    ordem: z.number().default(10),
    modalidade: z.enum(['grupo', 'personalizado', 'corporativo']),
    nivel: z.enum(['iniciante', 'intermediario', 'avancado', 'todos']),
    resumo: z.string().max(160),
    resposta: respostaDireta,
    turmas: z
      .array(
        z.object({
          data: z.coerce.date(),
          horario: z.string().optional(),
          local: z.string().optional(),
          vagas: z.number().optional(),
          status: z.enum(['aberta', 'esgotada', 'realizada']).default('aberta'),
        }),
      )
      .default([]),
    /** aviso exibido abaixo da lista de turmas (ex.: calendário do ano seguinte) */
    avisoTurmas: z.string().optional(),
    cargaHoraria: z.string(),
    local: z.string(),
    conteudo: z.array(z.string()).min(1),
    paraQuem: z.array(z.string()).min(1),
    requisitos: z.array(z.string()).min(1),
    inclui: z.array(z.string()).default([]),
    naoInclui: z.array(z.string()).default([]),
    preco,
    /** Local em destaque na página (ex.: Haras Tuiuti) */
    sobreLocal: z.object({ nome: z.string(), texto: z.string(), logo: imagem.optional() }).optional(),
    programacao: z.array(z.object({ hora: z.string(), atividade: z.string() })).default([]),
    observacao: z.string().optional(),
    planos: z
      .array(z.object({ nome: z.string(), subtitulo: z.string().optional(), valor: z.number(), descricao: z.string(), destaque: z.boolean().default(false) }))
      .default([]),
    extras: z.array(z.object({ nome: z.string(), valor: z.number(), descricao: z.string() })).default([]),
    pagamento: z.array(z.object({ titulo: z.string(), texto: z.string() })).default([]),
    instrutores: z.array(reference('equipe')).default([]),
    capa: imagem,
    capaAlt: z.string(),
    galeria,
    faq,
    whatsapp: z.string().optional(),
    seo,
  }),
});

/* Blog ------------------------------------------------------------------ */
const blog = defineCollection({
  // arquivos antigos que podem ter ficado no repositório: ignorados no build
  loader: glob({ pattern: ['**/*.md', '!primeira-viagem-off-road.md', '!reduzida-bloqueio-e-tracao.md'], base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    publicado: z.coerce.date(),
    atualizado: z.coerce.date().optional(),
    autor: reference('equipe'),
    categoria: z.enum(['relatos', 'dicas', 'equipamentos', 'noticias']),
    tags: z.array(z.string()).default([]),
    resumo: z.string().max(160),
    resposta: respostaDireta,
    capa: imagem,
    capaAlt: z.string(),
    relacionadosViagens: z.array(reference('viagens')).default([]),
    relacionadosTreinamentos: z.array(reference('treinamentos')).default([]),
    faq,
    seo,
    rascunho: z.boolean().default(false),
  }),
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
    foto: imagem.optional(),
    fotoAlt: z.string().optional(),
    /** enquadramento da foto (CSS object-position), ex.: "95% center" para quem está na direita */
    fotoPosicao: z.string().default('center'),
    /** mini bio; separe parágrafos com uma linha em branco */
    bio: z.string(),
    credenciais: z.array(z.string()).default([]),
    ordem: z.number().default(10),
  }),
});

/* Arquivos únicos (configurações e páginas fixas) ----------------------- */
const config = defineCollection({
  loader: glob({ pattern: 'site.yml', base: './src/content/config' }),
  schema: z.object({
    nome: z.string(),
    whatsappPrincipal: z.string().regex(/^\d{12,13}$/, 'Use só números com DDI: 5514998028008'),
    whatsappSecundario: z.string().regex(/^\d{12,13}$/).optional(),
    whatsappTexto: z.string(),
    email: z.string().email(),
    instagram: z.string().url(),
    facebook: z.string().url(),
    youtube: z.string().url().optional(),
    parceiros: z
      .array(z.object({ nome: z.string(), descricao: z.string().optional(), logo: imagem.optional(), url: z.string().url().optional() }))
      .default([]),
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
    heroFotos: z.array(z.object({ imagem, alt: z.string(), posicao: z.string().optional() })).default([]),
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
