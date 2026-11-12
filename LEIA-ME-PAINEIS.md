# Painéis de conteúdo — KeepTrack 4x4 (Pages CMS)

| Painel | Pasta | Para quê |
|---|---|---|
| **Treinamentos** | `src/content/treinamentos/` | Lançar e fechar turmas, valores, conteúdo, FAQ, fotos |
| **Expedições** | `src/content/viagens/proximas/` | Viagens da agenda: inscrições abertas ou esgotada, roteiro, preço |
| **Expedições realizadas** | `src/content/viagens/realizadas/` | Fotos de "Como foi" e relato depois da viagem |
| **Dicas** | `src/content/blog/` | Artigos, com rascunho |
| Equipe, Configurações, Página inicial, A KeepTrack | (sem mudança) | |

Todo campo do `.pages.yml` tem o mesmo `name` do `src/content.config.ts`. A URL de cada página vem do campo **slug** (não da pasta).

## O que mudou nesta versão
- **`.pages.yml`**: painel de viagens dividido em dois; descrições e exemplos em cada campo; validação no formulário de resposta direta (35–70 palavras), meta title (≤ 60) e description (≤ 155); listas recolhíveis com resumo (ex.: turmas mostram a data).
- **`src/content.config.ts`**:
  - viagens em `proximas/` e `realizadas/` com a mesma URL (`generateId` usa o `slug`);
  - campos opcionais aceitam `""`/`null` que o painel grava quando ficam em branco (antes derrubavam o build);
  - Dicas ganhou "Expedições realizadas relacionadas" (`relacionadosRealizadas`), que o schema soma a `relacionadosViagens` — os templates não mudaram.
- **`scripts/organizar-viagens.mjs`** + **`deploy.yml`**: antes do build, viagem `proxima`/`esgotada` com data de fim passada vira `realizada` e o arquivo vai para `realizadas/`. Na `main`, o workflow salva essa mudança no repositório (commit do bot). Teste: `node scripts/organizar-viagens.mjs --simular`.
- As 7 viagens já foram separadas (2 em `proximas/`, 5 em `realizadas/`) e os 2 posts que citavam viagens realizadas passaram a usar `relacionadosRealizadas`.

Verificado: `astro check` sem erros e `astro build` ok. As 22 páginas geradas têm o mesmo texto e os mesmos links da versão anterior.

## Para colocar no ar
1. Subir o projeto para o GitHub (branch → PR para `staging` → `main`, por ser mudança de estrutura).
2. Se a `main` tiver proteção de branch, liberar o `github-actions[bot]` para o commit automático das viagens. Se não liberar, o site publica certo do mesmo jeito; só o arquivo não muda de painel.
3. Instalar o GitHub App do Pages CMS (https://app.pagescms.org) no repositório e convidar o cliente por e-mail em **Collaborators**.
4. Abrir cada painel uma vez e conferir que as entradas carregam.

## Pontos de atenção
- Pessoa nova na equipe → cadastrar no painel **Equipe** (com slug); ela aparece sozinha em "Quem conduz" e "Autor".
- Campo novo em viagens → adicionar nos **dois** formulários (`expedicoes` e `expedicoes_realizadas`).
- Não mudar o **slug** de uma página já publicada (muda a URL e quebra links/SEO). Se precisar, criar redirecionamento 301 no `public/.htaccess`.

---

## Guia rápido para o cliente

**Abrir uma turma** → Treinamentos → Técnicas de Condução 4x4 → *Próximas turmas* → Adicionar → data e situação → Salvar.
O dia da semana, o botão "Garantir vaga" e a mensagem de WhatsApp com a data saem prontos. A turma some do site sozinha depois que passa.

**Turma lotou** → mesma tela → Situação: *Esgotada* → Salvar.

**Nova expedição** → Expedições → Novo → nome, endereço da página (ex.: `expedicao-lencois-maranhenses`), datas (sem dia definido: use o dia 1º e ligue *Datas ainda a confirmar*), destinos, dificuldade, resumo, resposta direta e foto de capa → Salvar. Roteiro, preço e o que inclui podem vir depois.

**Vagas acabaram** → Expedições → a viagem → Inscrições: *Esgotada (lista de espera)*.

**Depois da viagem** → no dia seguinte ela aparece em **Expedições realizadas** → subir pelo menos 3 fotos em *Fotos de "Como foi"*, reescrever a resposta direta no passado ("foi uma viagem…") e, se quiser, escrever o relato → Salvar.

**Nova dica** → Dicas → Novo → ligar *Rascunho* enquanto escreve → título, endereço da página, categoria, resumo, resposta direta, foto e texto (dividido com "Título 2") → quando estiver pronto, desligar *Rascunho* → Salvar.

Cada "Salvar" publica no site em poucos minutos (o GitHub Actions faz o build e envia para a Hostinger).
