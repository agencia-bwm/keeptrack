# Site KeepTrack 4x4

Astro estático + Pages CMS, hospedado na Hostinger. Regras completas do projeto em [CLAUDE.md](CLAUDE.md).

## Rodar localmente
```bash
npm install
npm run imagens   # baixa as fotos provisórias do site antigo (uma vez)
npm run dev       # http://localhost:4321
npm run build     # gera dist/
```

## Publicação
Push em `main` → GitHub Actions valida, faz o build, roda o Lighthouse e envia `dist/` por rsync para a Hostinger. Há também um build diário às 03h.

### Secrets do repositório (Settings → Secrets → Actions)
| Secret | Exemplo |
|---|---|
| `SSH_HOST` | IP do servidor Hostinger |
| `SSH_PORT` | `65002` |
| `SSH_USER` | usuário SSH da Hostinger |
| `SSH_PRIVATE_KEY` | chave privada exclusiva para deploy |
| `DEPLOY_PATH` | `domains/keeptrack.com.br/public_html/` |
| `HTPASSWD_PATH` | caminho absoluto do `.htpasswd` da homologação |

Crie dois *environments* no GitHub: `producao` (proteção na branch `main`) e `homologacao`.

## Painel do cliente
1. Instalar o GitHub App do Pages CMS (https://app.pagescms.org) no repositório.
2. Convidar o cliente por e-mail como colaborador. Ele edita conteúdo e mídia, sem acesso ao código.

## Pendências de conteúdo
- [ ] Fotos profissionais em alta (substituir as do site antigo)
- [ ] Números de autoridade da home (confirmar com o Caio)
- [ ] Conteúdo programático, o que inclui e política de cancelamento do treinamento
- [ ] Datas exatas das viagens de 2025 (hoje só o mês aparece no site)
- [ ] Próximas viagens 2026/2027
- [ ] Bio e foto do Caio
- [ ] CNPJ e razão social (Política de Privacidade)
- [ ] Coordenadas exatas do Raceville
- [ ] ID real do GTM em `src/content/config/site.yml`
- [ ] Qual WhatsApp recebe os leads
