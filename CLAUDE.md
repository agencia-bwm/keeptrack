# KeepTrack 4x4 — regras do projeto

Site estático em **Astro 5**, conteúdo em `src/content/`, editado pelo cliente no **Pages CMS** (`.pages.yml`) e pela BWM via GitHub/Claude. Build no GitHub Actions, deploy por rsync para a Hostinger (`public_html`). Nada compila no servidor.

## Estrutura
- `src/content.config.ts` — schemas Zod de todas as coleções. **Fonte da verdade dos campos.**
- `src/content/` — `viagens/`, `treinamentos/`, `blog/`, `equipe/` (Markdown + frontmatter), `config/site.yml`, `paginas/home.yml`, `paginas/a-keeptrack.yml`.
- `src/components/` — um componente por bloco do Figma. `Foto.astro` é o único jeito de renderizar imagem.
- `src/layouts/BaseLayout.astro` — SEO (title, description, canonical, OG), JSON-LD global, Consent Mode v2, eventos `data-track`.
- `src/lib/utils.ts` (datas, WhatsApp, coleções), `src/lib/schema.ts` (JSON-LD), `src/lib/imagens.ts` (resolve caminho do painel → imagem otimizada).
- `public/.htaccess` — redirecionamentos 301, headers de segurança, cache.

## Criar um campo novo
1. Adicionar ao schema em `src/content.config.ts`.
2. Adicionar o mesmo `name` ao formulário em `.pages.yml` (mesmo tipo, mesma obrigatoriedade).
3. Usar no template/componente.
4. `npm run build` precisa passar. Campo obrigatório faltando = build falha = site no ar não quebra.

## Regras
- Uma turma **não** é uma página: datas vivem na lista `turmas` do treinamento. Turmas e viagens vencidas saem das listas no build diário (cron do Actions).
- URLs curtas, em português, sem data no slug. `trailingSlash: 'always'`.
- Um H1 por página. Meta title ≤ 60, description ≤ 155. Bloco "Resposta direta" (40–60 palavras) no topo de produtos e posts.
- Todo JSON-LD sai de `src/lib/schema.ts`. Toda página interna tem BreadcrumbList.
- Botões de conversão têm `data-track` (`click_whatsapp`, `click_instagram`, `click_email`...) + `data-local`. Nunca depender de classes CSS para tracking.
- Nenhuma tag de marketing antes do consentimento. GTM só carrega após consentimento ou primeira interação.
- Sem slider, jQuery ou biblioteca de animação. JS só em ilhas pequenas (galeria, banner de cookies). Respeitar `prefers-reduced-motion`.
- Imagens: sempre `<Foto>`; hero com `prioridade`. Fotos novas vão em `src/assets/uploads/`.

## Design tokens (`src/styles/global.css`)
Azul `#3F68B9` · Azul escuro `#1B2A54` · Bege `#F2EDE3` · Branco. Títulos: Barlow Condensed 600/700 em caixa alta. Texto: Barlow 400/500/600. Fontes auto-hospedadas via @fontsource (subset latino).

## Metas
Lighthouse mobile ≥ 95 nas 4 categorias (CI bloqueia abaixo de 90). LCP < 2,0 s, INP < 150 ms, CLS < 0,05. JS antes do consentimento < 30 KB.

## Fluxo
- `main` → produção (keeptrack.com.br). `staging` → homologação (senha + noindex).
- Mudança de layout/funcionalidade: branch → PR para `staging` → revisão → `main`.
- Conteúdo pelo painel vai direto para `main`.

## Fotos provisórias
O conteúdo inicial aponta para fotos do site antigo (URLs `www.keeptrack.com.br/wp/...`). `npm run imagens` baixa todas para `src/assets/uploads/legado/` e o site passa a otimizá-las sem mudar o conteúdo. Substituir pelas fotos profissionais do cliente antes do lançamento.
