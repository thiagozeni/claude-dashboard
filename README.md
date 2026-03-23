# Claude Dashboard

Central de informações sobre capacidades do Claude Code: skills, sub-agents, projetos, MCPs, cheatsheet e backlog pessoal.

## Como usar

```bash
cd /Users/pro15/Claude/claude-dashboard
python3 -m http.server 8080
```

Abrir: http://localhost:8080

> **Nota:** O dashboard requer um servidor HTTP local porque usa `fetch()` para carregar os arquivos JSON em `data/`. Abrir o `index.html` diretamente via `file://` aciona o fallback com dados embutidos no `app.js` — tudo funciona, mas edições nos JSONs não serão refletidas sem o servidor.

## Estrutura

```
claude-dashboard/
├── index.html        — Estrutura HTML e layout
├── style.css         — Design system completo (dark theme)
├── app.js            — Lógica de navegação e renderização
└── data/
    ├── skills.json   — Skills disponíveis
    ├── agents.json   — Sub-agents configurados
    ├── projects.json — Projetos desenvolvidos
    └── mcps.json     — MCP servers e ferramentas instaladas
```

## Seções

- **Skills** — Capacidades especializadas com filtro por categoria
- **Sub-Agents** — Agentes com notas de uso salvas no localStorage
- **Projetos** — Projetos com status, stack e links
- **MCPs & Ferramentas** — Servidores MCP conectados e ferramentas CLI
- **Cheatsheet** — Referência rápida em accordion
- **Backlog** — Kanban pessoal salvo no localStorage
