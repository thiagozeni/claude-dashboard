/* ===================================================
   Claude Hub — app.js
   Sem frameworks. Sem build. Dados via fetch + fallback inline.
   =================================================== */

'use strict';

/* ─── Fallback data (usado quando fetch falha via file://) ─── */

const FALLBACK_SKILLS = [
  { id: "pdf", name: "pdf", origin: "document-skills", category: "Documentos", description: "Leitura, criação, mesclagem, divisão, rotação, watermark, OCR e manipulação de arquivos PDF.", trigger: "Mencione arquivo .pdf ou peça para criar/editar/unir PDFs" },
  { id: "docx", name: "docx", origin: "document-skills", category: "Documentos", description: "Cria, lê, edita e manipula documentos Word (.docx) com formatação rica, sumário, cabeçalhos, imagens e controle de alterações.", trigger: "Mencione 'Word doc', '.docx', 'relatório', 'memo' ou 'carta' como arquivo Word" },
  { id: "pptx", name: "pptx", origin: "document-skills", category: "Documentos", description: "Cria, lê, edita e manipula apresentações PowerPoint (.pptx) — slides, temas, notas, templates.", trigger: "Mencione 'deck', 'slides', 'apresentação' ou qualquer arquivo .pptx" },
  { id: "xlsx", name: "xlsx", origin: "document-skills", category: "Documentos", description: "Cria, lê, edita e corrige planilhas (.xlsx, .csv, .tsv) — fórmulas, gráficos, formatação, limpeza de dados.", trigger: "Mencione arquivo .xlsx/.csv ou peça para criar/manipular planilha" },
  { id: "doc-coauthoring", name: "doc-coauthoring", origin: "document-skills", category: "Documentos", description: "Workflow estruturado de co-autoria para documentação, propostas, specs técnicas e decisões.", trigger: "Mencione 'escrever documentação', 'criar proposta', 'redigir spec' ou similares" },
  { id: "frontend-design", name: "frontend-design", origin: "document-skills", category: "Design & Frontend", description: "Cria interfaces web de produção com alta qualidade visual — componentes, páginas, dashboards, React, HTML/CSS.", trigger: "Peça componente, página, landing page, dashboard ou qualquer interface web" },
  { id: "canvas-design", name: "canvas-design", origin: "document-skills", category: "Design & Frontend", description: "Cria arte visual em .png e .pdf usando princípios de design — posters, artes estáticas, peças gráficas.", trigger: "Peça um poster, arte, design ou peça gráfica estática" },
  { id: "algorithmic-art", name: "algorithmic-art", origin: "document-skills", category: "Design & Frontend", description: "Cria arte algorítmica com p5.js — randomness seeded, campos de fluxo, sistemas de partículas, generativo.", trigger: "Peça arte generativa, algorítmica, flow fields ou sistemas de partículas" },
  { id: "theme-factory", name: "theme-factory", origin: "document-skills", category: "Design & Frontend", description: "Aplica temas visuais (10 pré-definidos ou customizados) a artifacts — slides, docs, landing pages, HTML.", trigger: "Peça para aplicar tema ou estilizar um artifact existente" },
  { id: "web-artifacts-builder", name: "web-artifacts-builder", origin: "document-skills", category: "Design & Frontend", description: "Cria artifacts HTML multi-componentes com React, Tailwind CSS e shadcn/ui — para UIs complexas com estado e roteamento.", trigger: "Peça artifact web complexo com React, Tailwind ou shadcn/ui" },
  { id: "brand-guidelines", name: "brand-guidelines", origin: "document-skills", category: "Design & Frontend", description: "Aplica cores e tipografia oficiais da Anthropic a qualquer artifact.", trigger: "Peça algo no estilo visual da Anthropic ou com brand guidelines" },
  { id: "slack-gif-creator", name: "slack-gif-creator", origin: "document-skills", category: "Design & Frontend", description: "Cria GIFs animados otimizados para o Slack com constraints específicos de tamanho e formato.", trigger: "Peça 'GIF para Slack' ou GIF animado" },
  { id: "claude-api", name: "claude-api", origin: "document-skills", category: "Dev & Infra", description: "Constrói apps com a Claude API ou Anthropic SDK (Python/TypeScript) — inclui Agent SDK.", trigger: "Código importa 'anthropic' / '@anthropic-ai/sdk' / 'claude_agent_sdk'" },
  { id: "mcp-builder", name: "mcp-builder", origin: "document-skills", category: "Dev & Infra", description: "Cria servidores MCP de alta qualidade em Python (FastMCP) ou TypeScript para integrar APIs externas.", trigger: "Peça para criar um servidor MCP ou integrar API via MCP" },
  { id: "webapp-testing", name: "webapp-testing", origin: "document-skills", category: "Dev & Infra", description: "Testa e interage com apps web locais via Playwright — screenshots, logs de browser, debugging de UI.", trigger: "Peça para testar, verificar ou debugar uma web app local" },
  { id: "skill-creator", name: "skill-creator", origin: "document-skills", category: "Dev & Infra", description: "Cria, modifica, avalia e otimiza skills — inclui evals, benchmarks e análise de performance.", trigger: "Peça para criar, editar ou otimizar uma skill" },
  { id: "notebooklm", name: "notebooklm", origin: "built-in", category: "Automação", description: "API completa para Google NotebookLM — criar notebooks, adicionar fontes, gerar podcasts e artifacts, download em múltiplos formatos.", trigger: "Use /notebooklm ou diga 'criar podcast sobre X' ou qualquer tarefa NotebookLM" },
  { id: "yt-search", name: "yt-search", origin: "built-in", category: "Automação", description: "Busca no YouTube e retorna resultados estruturados com metadados dos vídeos.", trigger: "Peça para buscar vídeos no YouTube" },
  { id: "internal-comms", name: "internal-comms", origin: "document-skills", category: "Comunicação", description: "Redige comunicações internas em formatos corporativos — status reports, newsletters, FAQs, incident reports, updates de liderança.", trigger: "Peça comunicação interna, status report, newsletter ou update de projeto" },
  { id: "keybindings-help", name: "keybindings-help", origin: "built-in", category: "Utilitários", description: "Configura atalhos de teclado do Claude Code — rebind, chord shortcuts, ~/.claude/keybindings.json.", trigger: "Peça para customizar keybindings ou atalhos de teclado" },
  { id: "loop", name: "loop", origin: "built-in", category: "Utilitários", description: "Roda um prompt ou slash command em intervalo recorrente (ex: /loop 5m /foo, padrão 10m).", trigger: "Peça para repetir tarefa a cada N minutos ou verificar algo periodicamente" },
  { id: "simplify", name: "simplify", origin: "built-in", category: "Utilitários", description: "Revisa código alterado em busca de oportunidades de reuso, qualidade e eficiência, e corrige os problemas encontrados.", trigger: "Após implementar código, peça para simplificar ou revisar qualidade" }
];

const FALLBACK_AGENTS = [
  { id: "general-purpose", name: "general-purpose", description: "Agente de uso geral para pesquisa de questões complexas, busca em código e tarefas multi-etapa. Use quando precisar de busca ampla em codebase.", tools: ["*"], useCases: ["Pesquisa em codebase grande", "Busca de keywords em múltiplos arquivos", "Tarefas multi-etapa autônomas"], model: "inherit", modelNote: "Herda o modelo ativo na sessão" },
  { id: "explore", name: "Explore", description: "Agente rápido especializado em explorar codebases — busca por padrões de arquivo, palavras-chave ou perguntas sobre a estrutura do projeto.", tools: ["Glob", "Grep", "Read", "Bash", "WebSearch", "WebFetch"], useCases: ["Encontrar arquivos por padrão", "Buscar keyword em código", "Entender como funcionalidade foi implementada"], model: "inherit", modelNote: "Herda o modelo ativo na sessão" },
  { id: "plan", name: "Plan", description: "Arquiteto de software para desenhar planos de implementação — retorna planos passo-a-passo, arquivos críticos e trade-offs arquiteturais.", tools: ["Glob", "Grep", "Read", "Bash", "WebSearch", "WebFetch"], useCases: ["Planejar nova feature", "Definir arquitetura", "Avaliar abordagens antes de codar"], model: "inherit", modelNote: "Herda o modelo ativo na sessão" },
  { id: "claude-code-guide", name: "claude-code-guide", description: "Especialista em Claude Code CLI, Claude Agent SDK e Claude API — features, hooks, slash commands, MCP servers, settings, IDE integrations.", tools: ["Glob", "Grep", "Read", "WebFetch", "WebSearch"], useCases: ["Dúvidas sobre Claude Code CLI", "Como usar o Agent SDK", "Como usar a API Anthropic"], model: "inherit", modelNote: "Herda o modelo ativo na sessão" },
  { id: "code-reviewer", name: "code-reviewer", description: "Revisor de código e debugger — identifica bugs, investiga erros, analisa qualidade/segurança e sugere melhorias antes do commit.", tools: ["Read", "Grep", "Glob", "Bash"], useCases: ["Revisar código implementado", "Investigar testes falhando", "Análise de segurança", "Sugestões de melhoria"], model: "sonnet", modelNote: "claude-sonnet-4-6" },
  { id: "ux-designer", name: "ux-designer", description: "Especialista em design de interfaces, UX e acessibilidade — layouts, hierarquia visual, componentes, paletas, tipografia e fluxos de navegação.", tools: ["Read", "Grep", "Glob"], useCases: ["Revisar layout e hierarquia visual", "Propor melhorias de UX", "Acessibilidade", "Design system"], model: "sonnet", modelNote: "claude-sonnet-4-6" },
  { id: "git-assistant", name: "git-assistant", description: "Especialista em git — analisa diffs, prepara commits, organiza staging area, verifica histórico e prepara código para push.", tools: ["Bash", "Read", "Grep"], useCases: ["Redigir mensagens de commit", "Analisar diff antes do commit", "Organizar staging", "Verificar histórico"], model: "haiku", modelNote: "claude-haiku-4-5" },
  { id: "copywriter", name: "copywriter", description: "Redator especializado em conteúdo publicitário, jornalístico e digital — sites, produtos, posts, títulos, CTAs, descrições de vídeo, marketing.", tools: ["Read", "Write", "WebSearch"], useCases: ["Textos de site", "Descrições de produto", "Posts e títulos", "Descrições de vídeo YouTube"], model: "sonnet", modelNote: "claude-sonnet-4-6" },
  { id: "frontend-dev", name: "frontend-dev", description: "Desenvolvedor especializado em front-end — interfaces, componentes, CSS, JavaScript, integração com APIs no cliente, React e HTML semântico.", tools: ["Read", "Edit", "Write", "Grep", "Glob", "Bash"], useCases: ["Implementar interfaces e componentes", "Estilização CSS", "Integração de API no cliente", "React e HTML"], model: "sonnet", modelNote: "claude-sonnet-4-6" },
  { id: "planner", name: "planner", description: "Especialista em planejamento de apps, arquitetura e pesquisa web — planeja features, define arquitetura, escolhe tecnologias e levanta requisitos.", tools: ["Read", "Grep", "Glob", "WebSearch", "WebFetch"], useCases: ["Planejar nova funcionalidade", "Escolher tecnologia", "Pesquisar bibliotecas", "Levantar requisitos"], model: "opus", modelNote: "claude-opus-4-6" },
  { id: "backend-dev", name: "backend-dev", description: "Programador especializado em back-end, APIs, modelagem de banco de dados e arquitetura server-side.", tools: ["Read", "Edit", "Write", "Grep", "Glob", "Bash"], useCases: ["Implementar rotas e lógica de negócio", "Queries SQL", "Modelagem de dados", "Autenticação", "Integrações externas"], model: "sonnet", modelNote: "claude-sonnet-4-6" },
  { id: "statusline-setup", name: "statusline-setup", description: "Configura o status line do Claude Code — modifica ~/.claude/keybindings.json para personalizar a linha de status.", tools: ["Read", "Edit"], useCases: ["Configurar status line do Claude Code"], model: "inherit", modelNote: "Herda o modelo ativo na sessão" }
];

const FALLBACK_PROJECTS = [
  { id: "cachorradas-estudios", name: "Cachorradas Estudios", path: "/Users/pro15/Claude/cachorradas-estudios", url: "https://thiagozeni.github.io/cachorradas-estudios", repo: "https://github.com/thiagozeni/cachorradas-estudios", type: "Site Estático", status: "active", tech: ["HTML", "CSS", "JavaScript", "Python", "GitHub Actions", "YouTube Data API v3"], description: "Site do canal YouTube @CachorradasEstudios com atualização automática diária de stats e vídeos via GitHub Actions às 08h BRT.", highlights: ["GitHub Pages", "Auto-update diário 08h BRT", "Séries: GDV, Metallica Slayer, E SE???"], lastActivity: "2026-03-11" },
  { id: "eat-kitchen-concierge", name: "EAT Kitchen Concierge", path: "/Users/pro15/Claude/eat-kitchen-concierge", url: null, repo: null, type: "Fullstack", status: "active", tech: ["React 19", "Vite", "TypeScript", "Tailwind v4", "Express", "Gemini API", "lucide-react", "motion"], description: "Concierge gastronômico com IA para o restaurante EAT Kitchen — recomenda pratos com streaming de respostas e suporte a múltiplos idiomas.", highlights: ["SSE streaming", "8 idiomas", "Multi-step upselling flow"], lastActivity: "2026-03-11" },
  { id: "alugueis-bea", name: "Aluguéis Bea", path: "/Users/pro15/Claude/alugueis-bea", url: null, repo: null, type: "Scripts", status: "maintenance", tech: ["Python", "Google Sheets API", "Apps Script", "openpyxl"], description: "Controle de aluguéis com extração automática de PDFs protegidos por senha e preenchimento de planilha Google Sheets.", highlights: ["Extração de PDFs com senha", "Integração Google Sheets"], lastActivity: "2026-03-01" },
  { id: "claude-dashboard", name: "Claude Dashboard", path: "/Users/pro15/Claude/claude-dashboard", url: null, repo: null, type: "Site Estático", status: "active", tech: ["HTML", "CSS", "JavaScript"], description: "Central de informações sobre capacidades do Claude, sub-agents, projetos desenvolvidos juntos, MCPs conectados e backlog de ideias.", highlights: ["Uso interno", "Sem build pipeline", "Dados em JSON"], lastActivity: "2026-03-15" },
  { id: "magma", name: "Magma", path: "/Users/pro15/Claude/magma", url: null, repo: null, type: "Site Estático", status: "active", tech: ["HTML", "CSS", "JavaScript"], description: "Site histórico da banda Magma (Nova Hamburgo/RS, 2001–2025) — discografia, fotos, vídeos e memória da trajetória da banda.", highlights: ["Site comemorativo", "Sem dependências externas"], lastActivity: "2026-03-15" },
  { id: "thiago-zeni", name: "Thiago Zeni", path: "/Users/pro15/Claude/thiago-zeni", url: null, repo: null, type: "Site Estático", status: "active", tech: ["HTML", "CSS", "JavaScript"], description: "Site pessoal de Thiago Zeni — Marketing Digital & Liderança Executiva.", highlights: ["Site pessoal", "Sem dependências externas"], lastActivity: "2026-03-15" },
  { id: "werdum-fight", name: "Werdum Fight", path: "/Users/pro15/Claude/werdum-fight", url: null, repo: null, type: "Game", status: "active", tech: ["TypeScript", "Vite", "Phaser 3"], description: "Arena Beat'em Up inspirado em Streets of Rage e Final Fight, desenvolvido com Phaser 3.", highlights: ["Arena Beat'em Up", "Phaser 3", "Sprites e personagens customizados"], lastActivity: "2026-03-15" },
  { id: "ai-hub", name: "AI Hub Local", path: "/Users/pro15", url: null, repo: null, type: "Scripts", status: "active", tech: ["Python", "zsh", "MLX", "Gemini API", "HuggingFace"], description: "Hub de IAs locais rodando no Apple Silicon via MLX — roteador inteligente que classifica prompts e despacha para Qwen2.5-Coder (coding), DeepSeek-R1 14B (reasoning) ou Gemini 2.5 Pro (research).", highlights: ["Qwen2.5-Coder-7B-4bit", "DeepSeek-R1-Distill-Qwen-14B-4bit", "Gemini 2.5 Pro (web)"], lastActivity: "2026-03-15" }
];

const FALLBACK_MCPS = {
  mcps: [
    { id: "canva", name: "Canva", icon: "🎨", status: "connected", description: "Criação e edição de designs no Canva — templates, brand kits, exportação, comentários e colaboração.", capabilities: ["Criar designs a partir de prompts", "Editar designs existentes", "Exportar em múltiplos formatos", "Gerenciar pastas e assets", "Brand kits", "Comentários e colaboração"], toolCount: 31 },
    { id: "gmail", name: "Gmail", icon: "✉️", status: "connected", description: "Acesso à caixa de entrada do Gmail — leitura, busca, criação de rascunhos e gerenciamento de labels.", capabilities: ["Buscar e ler emails", "Ler threads completas", "Criar rascunhos", "Listar e gerenciar labels", "Obter perfil da conta"], toolCount: 7 },
    { id: "google-calendar", name: "Google Calendar", icon: "📅", status: "connected", description: "Gerenciamento completo do Google Calendar — eventos, disponibilidade, agendamento inteligente.", capabilities: ["Listar e buscar eventos", "Criar e atualizar eventos", "Deletar eventos", "Verificar disponibilidade", "Encontrar horários livres", "Responder convites"], toolCount: 9 },
    { id: "supabase", name: "Supabase", icon: "🗄️", status: "connected", description: "Gerenciamento completo de projetos Supabase — banco de dados, edge functions, migrações, branches e logs.", capabilities: ["Executar SQL e gerenciar tabelas", "Criar e gerenciar projetos", "Aplicar e listar migrações", "Deploy de edge functions", "Gerenciar branches de banco", "Gerar tipos TypeScript", "Visualizar logs e advisors", "Pausar e restaurar projetos"], toolCount: 29 },
    { id: "figma", name: "Figma", icon: "✏️", status: "connected", description: "Leitura e geração de designs no Figma — contexto de design, screenshots, diagramas FigJam e Code Connect.", capabilities: ["Ler contexto e código de designs", "Capturar screenshots de frames", "Gerar diagramas no FigJam", "Criar designs via prompts", "Gerenciar Code Connect (mapeamento componentes)", "Obter variáveis e tokens de design", "Ler metadados de arquivos"], toolCount: 13 },
    { id: "vercel", name: "Vercel", icon: "▲", status: "connected", description: "Deploy e gerenciamento de projetos na Vercel — deployments, logs, domínios e toolbar de feedback.", capabilities: ["Deploy de projetos", "Listar deployments e projetos", "Ver logs de build e runtime", "Verificar disponibilidade de domínios", "Gerenciar threads de feedback (toolbar)", "Buscar documentação da Vercel", "Acessar URLs de preview"], toolCount: 18 },
    { id: "gemini-image", name: "Gemini Image", icon: "🖼️", status: "connected", description: "Geração e edição de imagens via Google Gemini — cria imagens a partir de prompts e edita imagens existentes.", capabilities: ["Gerar imagens a partir de descrições em linguagem natural", "Editar e modificar imagens existentes"], toolCount: 2 },
    { id: "zapier", name: "Zapier", icon: "⚡", status: "connected", description: "Integração com o ecossistema Zapier — acesso a automações e conexões com 7000+ apps via MCP.", capabilities: ["Configurar integração com Zapier", "Acionar automações (Zaps)", "Conectar com 7000+ apps externos"], toolCount: 1 }
  ],
  skills: [
    { id: "firecrawl", name: "firecrawl", icon: "🕷️", type: "Plugin (Claude Code)", description: "Web scraping e crawling via Firecrawl — extrai conteúdo de páginas web em formato limpo (Markdown/JSON), rastreia sites inteiros e realiza buscas estruturadas.", install: "claude plugin install firecrawl + npm install -g firecrawl-cli", useCases: ["Scraping de páginas web", "Crawling de sites inteiros", "Extração de conteúdo limpo (Markdown)", "Busca estruturada na web", "Mapeamento de URLs de um domínio"] }
  ],
  tools: [
    { id: "yt-dlp", name: "yt-dlp", version: "2026.03.03", icon: "⬇️", type: "CLI", description: "Downloader de vídeos e áudios de YouTube e outros sites (suporte a 1000+ sites).", install: "via Python 3.14", useCases: ["Download de vídeos", "Extração de áudio", "Download de playlists", "Formatos customizados"] },
    { id: "notebooklm-py", name: "notebooklm-py", version: "0.3.3", icon: "📓", type: "CLI + Python API", description: "CLI e API Python para automação do Google NotebookLM — criar notebooks, adicionar fontes, gerar podcasts programaticamente.", install: "pip install notebooklm-py", useCases: ["Criar notebooks via CLI", "Adicionar fontes automaticamente", "Gerar podcasts", "Download de artifacts"] }
  ]
};

/* ─── Cheatsheet data (hardcoded) ─── */
const CHEATSHEET = [
  {
    number: "1",
    title: "Slash Commands",
    rows: [
      ["/clear", "Limpar contexto da conversa"],
      ["/compact", "Compactar histórico"],
      ["/memory", "Gerenciar memórias"],
      ["/help", "Ajuda do Claude Code"],
      ["/fast", "Ativar/desativar modo fast"],
      ["/model", "Trocar modelo"],
      ["/review-pr", "Revisar PR"]
    ]
  },
  {
    number: "2",
    title: "Invocar Skills",
    rows: [
      ["Mencione .pdf", "→ skill pdf"],
      ['"Crie uma landing page"', "→ skill frontend-design"],
      ["importa anthropic", "→ skill claude-api"],
      ['"Deck de slides"', "→ skill pptx"],
      ['"Planilha Excel"', "→ skill xlsx"],
      ['"Documento Word"', "→ skill docx"],
      ["/notebooklm", "→ skill notebooklm"]
    ]
  },
  {
    number: "3",
    title: "Usar Sub-Agents",
    rows: [
      ['"Use o agente backend-dev"', "Implementar lógica de negócio"],
      ['"Use o agente Explore"', "Busca ampla em codebase"],
      ['"Use o agente code-reviewer"', "Revisar código implementado"],
      ['"Use o agente Plan"', "Planejar antes de codar"],
      ['"Execute em paralelo X e Y"', "Delegação paralela de subtarefas"]
    ]
  },
  {
    number: "4",
    title: "Atalhos Claude Code CLI",
    rows: [
      ["Ctrl+C", "Interromper resposta"],
      ["Ctrl+R", "Buscar histórico de comandos"],
      ["↑ / ↓", "Navegar histórico"],
      ["Tab", "Autocomplete de paths"],
      ["/ no início", "Invocar skill"]
    ]
  },
  {
    number: "5",
    title: "Comandos de Memória",
    rows: [
      ['"Lembre-se que..."', "Salva memória permanente"],
      ['"Esqueça que..."', "Remove memória"],
      ['"Sua memória sobre X?"', "Consulta memória específica"],
      ["~/.claude/projects/.../memory/", "Localização dos arquivos de memória"]
    ]
  }
];

/* ─── Backlog defaults ─── */
const BACKLOG_DEFAULTS = [
  { id: "b1", title: "Configurar GitHub Pages para o dashboard", status: "todo", color: "#1E1E2E" },
  { id: "b2", title: "Adicionar skill de análise de imagens", status: "todo", color: "#1E1A2E" },
  { id: "b3", title: "Criar agente especializado em dados", status: "progress", color: "#1E1A2E" },
  { id: "b4", title: "Integrar Google Drive via MCP", status: "progress", color: "#1A2E1A" },
  { id: "b5", title: "Dashboard inicial publicado", status: "done", color: "#1A2E1A" }
];

const CARD_COLORS = [
  { value: "#1E1E2E", label: "Padrão" },
  { value: "#1A2E1A", label: "Verde" },
  { value: "#1E1A2E", label: "Roxo" },
  { value: "#2E1A1A", label: "Vermelho" },
  { value: "#2E261A", label: "Amarelo" }
];

/* ─── Helpers ─── */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function categoryClass(cat) {
  const map = {
    'Documentos': 'cat-documentos',
    'Design & Frontend': 'cat-design',
    'Dev & Infra': 'cat-dev',
    'Automação': 'cat-automacao',
    'Comunicação': 'cat-comunicacao',
    'Utilitários': 'cat-utilitarios'
  };
  return map[cat] || 'cat-utilitarios';
}

function statusLabel(status) {
  const map = { active: 'Ativo', maintenance: 'Manutenção', archived: 'Arquivado' };
  return map[status] || status;
}

async function fetchJSON(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return fallback;
  }
}

function copyToClipboard(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const original = el.innerHTML;
    el.innerHTML = el.innerHTML.replace('Copiar', 'Copiado!');
    setTimeout(() => { el.innerHTML = original; }, 1500);
  }).catch(() => {});
}

/* ─── Navigation ─── */

const SECTIONS = ['skills', 'agents', 'projects', 'mcps', 'aihub', 'cheatsheet', 'backlog', 'evolucao'];
const SECTION_LABELS = {
  skills: 'Skills',
  agents: 'Sub-Agents',
  projects: 'Projetos',
  mcps: 'MCPs & Ferramentas',
  aihub: 'AI Hub',
  cheatsheet: 'Cheatsheet',
  backlog: 'Backlog',
  evolucao: 'Evolução'
};

let currentSection = 'skills';

function navigateTo(id) {
  if (!SECTIONS.includes(id)) return;

  SECTIONS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('hidden', s !== id);
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    const isActive = btn.dataset.target === id;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  const mobileTitle = document.getElementById('mobile-title');
  if (mobileTitle) mobileTitle.textContent = SECTION_LABELS[id] || id;

  currentSection = id;
  closeSidebar();
}

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btn = document.getElementById('hamburger-btn');
  sidebar.classList.add('open');
  overlay.classList.add('visible');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btn = document.getElementById('hamburger-btn');
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

/* ─── Skills ─── */

let allSkills = [];
let activeFilter = 'Todos';

function renderSkills(skills) {
  const categories = ['Todos', ...new Set(skills.map(s => s.category))];
  const filterBar = document.getElementById('skills-filter');
  filterBar.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === activeFilter ? ' active' : '');
    btn.textContent = cat;
    btn.setAttribute('aria-pressed', cat === activeFilter ? 'true' : 'false');
    btn.addEventListener('click', () => {
      activeFilter = cat;
      renderSkills(allSkills);
    });
    filterBar.appendChild(btn);
  });

  const filtered = activeFilter === 'Todos' ? skills : skills.filter(s => s.category === activeFilter);
  const grid = document.getElementById('skills-grid');
  grid.innerHTML = '';

  filtered.forEach(skill => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('aria-label', `Skill: ${skill.name}`);
    card.innerHTML = `
      <div class="card-header">
        <span class="card-name">${escapeHtml(skill.name)}</span>
        <span class="category-badge ${categoryClass(skill.category)}">${escapeHtml(skill.category)}</span>
      </div>
      <p class="card-description">${escapeHtml(skill.description)}</p>
      <div class="card-trigger" title="Trigger de ativação">
        <span class="trigger-icon" aria-hidden="true">⚡</span>
        <span>${escapeHtml(skill.trigger)}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ─── Agents ─── */

function renderAgents(agents) {
  const grid = document.getElementById('agents-grid');
  grid.innerHTML = '';

  agents.forEach(agent => {
    const savedNotes = localStorage.getItem(`agent-notes-${agent.id}`) || '';
    const toolsAll = agent.tools[0] === '*' ? ['Todos os tools'] : agent.tools;

    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('aria-label', `Agente: ${agent.name}`);

    const useCasesHTML = agent.useCases.map(uc =>
      `<li class="use-case-item">${escapeHtml(uc)}</li>`
    ).join('');

    const toolChipsHTML = toolsAll.map(t =>
      `<span class="chip tool-chip">${escapeHtml(t)}</span>`
    ).join('');

    card.innerHTML = `
      <div class="card-header">
        <span class="card-name">${escapeHtml(agent.name)}</span>
        <span class="model-badge model-${escapeHtml(agent.model)}" title="${escapeHtml(agent.modelNote || agent.model)}">${escapeHtml(agent.model)}</span>
      </div>
      <p class="card-description">${escapeHtml(agent.description)}</p>
      <div class="chips-row" aria-label="Ferramentas disponíveis">${toolChipsHTML}</div>
      <ul class="use-cases-list" aria-label="Casos de uso">${useCasesHTML}</ul>
      <div>
        <div class="notes-label">Notas de uso</div>
        <textarea
          class="agent-notes"
          placeholder="Adicione suas notas de uso aqui..."
          aria-label="Notas para o agente ${escapeHtml(agent.name)}"
          data-agent-id="${escapeHtml(agent.id)}"
        >${escapeHtml(savedNotes)}</textarea>
      </div>
    `;

    const textarea = card.querySelector('.agent-notes');
    textarea.addEventListener('input', () => {
      localStorage.setItem(`agent-notes-${agent.id}`, textarea.value);
    });

    grid.appendChild(card);
  });
}

/* ─── Projects ─── */

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';

  projects.forEach(project => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('aria-label', `Projeto: ${project.name}`);

    const techChips = project.tech.map(t =>
      `<span class="chip">${escapeHtml(t)}</span>`
    ).join('');

    const highlightsHTML = project.highlights.map(h =>
      `<li class="project-highlight-item">${escapeHtml(h)}</li>`
    ).join('');

    const linksHTML = [];
    if (project.url) {
      linksHTML.push(`<a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="Abrir site de ${escapeHtml(project.name)}">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <path d="M1 6C1 3.239 3.239 1 6 1s5 2.239 5 5-2.239 5-5 5-5-2.239-5-5Z"/>
          <path d="M1 6h10M6 1c-1 1.5-1.667 3-1.667 5S5 9.5 6 11c1-1.5 1.667-3 1.667-5S7 2.5 6 1Z"/>
        </svg>
        Site
      </a>`);
    }
    if (project.repo) {
      linksHTML.push(`<a href="${escapeHtml(project.repo)}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="Ver repositório de ${escapeHtml(project.name)}">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <circle cx="3" cy="3" r="1.5"/>
          <circle cx="9" cy="3" r="1.5"/>
          <circle cx="6" cy="9" r="1.5"/>
          <path d="M3 4.5V6c0 .828.672 1.5 1.5 1.5h3c.828 0 1.5-.672 1.5-1.5V4.5M6 7.5v0"/>
        </svg>
        Repositório
      </a>`);
    }

    const lastDate = new Date(project.lastActivity + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    card.innerHTML = `
      <div class="project-card-meta">
        <span class="status-badge status-${project.status}">${statusLabel(project.status)}</span>
        <span class="project-type-badge">${escapeHtml(project.type)}</span>
      </div>
      <div class="card-header" style="margin-bottom:0">
        <span class="card-name" style="font-size:14px;font-family:var(--font-ui);font-weight:600">${escapeHtml(project.name)}</span>
      </div>
      <p class="card-description">${escapeHtml(project.description)}</p>
      <div class="chips-row" aria-label="Stack de tecnologias">${techChips}</div>
      <ul class="project-highlights" aria-label="Destaques do projeto">${highlightsHTML}</ul>
      ${linksHTML.length ? `<div class="project-links">${linksHTML.join('')}</div>` : ''}
      <div
        class="path-display"
        role="button"
        tabindex="0"
        title="Clique para copiar o caminho"
        data-path="${escapeHtml(project.path)}"
        aria-label="Caminho do projeto: ${escapeHtml(project.path)}"
      >${escapeHtml(project.path)}<span class="copy-hint">Copiar</span></div>
      <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">Última atividade: ${lastDate}</div>
    `;

    const pathEl = card.querySelector('.path-display');
    pathEl.addEventListener('click', () => copyToClipboard(project.path, pathEl));
    pathEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copyToClipboard(project.path, pathEl);
      }
    });

    grid.appendChild(card);
  });
}

/* ─── MCPs ─── */

function renderMCPs(data) {
  const container = document.getElementById('mcps-content');
  container.innerHTML = '';

  /* MCPs */
  const mcpTitle = document.createElement('div');
  mcpTitle.className = 'section-sub-title';
  mcpTitle.textContent = 'MCP Servers';
  container.appendChild(mcpTitle);

  const mcpGrid = document.createElement('div');
  mcpGrid.className = 'cards-grid';
  container.appendChild(mcpGrid);

  data.mcps.forEach(mcp => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('aria-label', `MCP: ${mcp.name}`);

    const capabilitiesHTML = mcp.capabilities.map(c =>
      `<li class="capability-item">${escapeHtml(c)}</li>`
    ).join('');

    card.innerHTML = `
      <div class="mcp-header">
        <div class="mcp-card-icon" aria-hidden="true">${mcp.icon}</div>
        <div class="mcp-title-group">
          <div class="mcp-name">${escapeHtml(mcp.name)}</div>
          <div class="tool-count">${mcp.toolCount} tools</div>
        </div>
        <span class="status-badge status-connected">Conectado</span>
      </div>
      <p class="card-description">${escapeHtml(mcp.description)}</p>
      <ul class="capabilities-list" aria-label="Capacidades">${capabilitiesHTML}</ul>
    `;

    mcpGrid.appendChild(card);
  });

  /* Plugins / Skills */
  if (data.skills && data.skills.length > 0) {
    const skillsTitle = document.createElement('div');
    skillsTitle.className = 'section-sub-title';
    skillsTitle.textContent = 'Plugins Instalados';
    container.appendChild(skillsTitle);

    const skillsGrid = document.createElement('div');
    skillsGrid.className = 'cards-grid';
    container.appendChild(skillsGrid);

    data.skills.forEach(skill => {
      const card = document.createElement('article');
      card.className = 'card tool-card';
      card.setAttribute('aria-label', `Plugin: ${skill.name}`);

      const useCasesHTML = skill.useCases.map(uc =>
        `<li class="use-case-item">${escapeHtml(uc)}</li>`
      ).join('');

      card.innerHTML = `
        <div class="tool-header">
          <div class="tool-icon" aria-hidden="true">${skill.icon}</div>
          <div class="tool-name-group">
            <div class="tool-name">${escapeHtml(skill.name)}</div>
            <div class="tool-version">${escapeHtml(skill.install)}</div>
          </div>
          <span class="tool-type-badge">${escapeHtml(skill.type)}</span>
        </div>
        <p class="card-description">${escapeHtml(skill.description)}</p>
        <ul class="use-cases-list" aria-label="Casos de uso">${useCasesHTML}</ul>
      `;

      skillsGrid.appendChild(card);
    });
  }

  /* Ferramentas */
  const toolsTitle = document.createElement('div');
  toolsTitle.className = 'section-sub-title';
  toolsTitle.textContent = 'Ferramentas Instaladas';
  container.appendChild(toolsTitle);

  const toolsGrid = document.createElement('div');
  toolsGrid.className = 'cards-grid';
  container.appendChild(toolsGrid);

  data.tools.forEach(tool => {
    const card = document.createElement('article');
    card.className = 'card tool-card';
    card.setAttribute('aria-label', `Ferramenta: ${tool.name}`);

    const useCasesHTML = tool.useCases.map(uc =>
      `<li class="use-case-item">${escapeHtml(uc)}</li>`
    ).join('');

    card.innerHTML = `
      <div class="tool-header">
        <div class="tool-icon" aria-hidden="true">${tool.icon}</div>
        <div class="tool-name-group">
          <div class="tool-name">${escapeHtml(tool.name)}</div>
          <div class="tool-version">v${escapeHtml(tool.version)}</div>
        </div>
        <span class="tool-type-badge">${escapeHtml(tool.type)}</span>
      </div>
      <p class="card-description">${escapeHtml(tool.description)}</p>
      <ul class="use-cases-list" aria-label="Casos de uso">${useCasesHTML}</ul>
    `;

    toolsGrid.appendChild(card);
  });
}

/* ─── Cheatsheet ─── */

function renderCheatsheet() {
  const accordion = document.getElementById('cheatsheet-accordion');
  accordion.innerHTML = '';

  CHEATSHEET.forEach((section, idx) => {
    const item = document.createElement('div');
    item.className = 'accordion-item' + (idx === 0 ? ' open' : '');

    const rowsHTML = section.rows.map(([cmd, desc]) =>
      `<tr>
        <td>${escapeHtml(cmd)}</td>
        <td>${escapeHtml(desc)}</td>
      </tr>`
    ).join('');

    item.innerHTML = `
      <button class="accordion-trigger" aria-expanded="${idx === 0 ? 'true' : 'false'}" aria-controls="accordion-body-${idx}">
        <div class="accordion-trigger-left">
          <span class="accordion-number">${escapeHtml(section.number)}</span>
          ${escapeHtml(section.title)}
        </div>
        <svg class="accordion-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4"/>
        </svg>
      </button>
      <div class="accordion-body" id="accordion-body-${idx}" role="region">
        <table class="cheatsheet-table" aria-label="${escapeHtml(section.title)}">
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
    `;

    const trigger = item.querySelector('.accordion-trigger');
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', (!isOpen).toString());
    });

    accordion.appendChild(item);
  });
}

/* ─── Backlog / Kanban ─── */

const COLUMNS = [
  { id: 'todo', label: 'To Do', dotClass: 'todo' },
  { id: 'progress', label: 'Em Progresso', dotClass: 'progress' },
  { id: 'done', label: 'Feito', dotClass: 'done' }
];

function loadBacklog() {
  try {
    const raw = localStorage.getItem('backlog-data');
    if (raw) return JSON.parse(raw);
  } catch {}
  return JSON.parse(JSON.stringify(BACKLOG_DEFAULTS));
}

function saveBacklog(data) {
  localStorage.setItem('backlog-data', JSON.stringify(data));
}

function generateId() {
  return 'bk-' + Math.random().toString(36).slice(2, 9);
}

function renderBacklog() {
  const board = document.getElementById('kanban-board');
  board.innerHTML = '';
  const backlogData = loadBacklog();

  COLUMNS.forEach(col => {
    const colItems = backlogData.filter(c => c.status === col.id);

    const column = document.createElement('div');
    column.className = 'kanban-column';
    column.setAttribute('data-col', col.id);
    column.setAttribute('aria-label', `Coluna ${col.label}`);

    column.innerHTML = `
      <div class="kanban-column-header">
        <div class="kanban-column-title">
          <span class="col-dot ${col.dotClass}" aria-hidden="true"></span>
          ${escapeHtml(col.label)}
          <span class="kanban-count" aria-label="${colItems.length} cards">${colItems.length}</span>
        </div>
        <button class="kanban-add-btn" data-col="${col.id}" aria-label="Adicionar card em ${col.label}" title="Adicionar card">+</button>
      </div>
      <div class="kanban-cards" data-col="${col.id}" aria-label="Cards de ${col.label}"></div>
    `;

    const cardsContainer = column.querySelector('.kanban-cards');
    colItems.forEach(item => {
      cardsContainer.appendChild(buildKanbanCard(item));
    });

    const addBtn = column.querySelector('.kanban-add-btn');
    addBtn.addEventListener('click', () => showNewCardForm(col.id, column));

    board.appendChild(column);
  });
}

function buildKanbanCard(item) {
  const colIndex = COLUMNS.findIndex(c => c.id === item.status);
  const isLast = colIndex === COLUMNS.length - 1;

  const card = document.createElement('div');
  card.className = 'kanban-card';
  card.style.background = item.color || '#1E1E2E';
  card.dataset.id = item.id;

  const colorDotsHTML = CARD_COLORS.map(c =>
    `<span
      class="color-dot${item.color === c.value ? ' active' : ''}"
      style="background:${c.value};border-color:${item.color === c.value ? '#F2F2F2' : 'transparent'}"
      data-color="${c.value}"
      title="${c.label}"
      role="radio"
      aria-checked="${item.color === c.value ? 'true' : 'false'}"
      tabindex="0"
      aria-label="Cor ${c.label}"
    ></span>`
  ).join('');

  card.innerHTML = `
    <div
      class="kanban-card-title"
      contenteditable="true"
      data-placeholder="Título do card"
      aria-label="Título editável"
    >${escapeHtml(item.title)}</div>
    <div class="color-picker-row" role="radiogroup" aria-label="Cor do card">${colorDotsHTML}</div>
    <div class="kanban-card-actions">
      ${!isLast ? `<button class="kanban-action-btn move-btn" title="Mover para próxima coluna" aria-label="Mover card para próxima coluna">→</button>` : ''}
      <button class="kanban-action-btn delete-btn" title="Deletar card" aria-label="Deletar card">×</button>
    </div>
  `;

  const titleEl = card.querySelector('.kanban-card-title');
  titleEl.addEventListener('blur', () => {
    const data = loadBacklog();
    const idx = data.findIndex(d => d.id === item.id);
    if (idx !== -1) {
      data[idx].title = titleEl.textContent.trim() || item.title;
      saveBacklog(data);
    }
  });

  card.querySelectorAll('.color-dot').forEach(dot => {
    const applyColor = () => {
      const color = dot.dataset.color;
      card.style.background = color;
      card.querySelectorAll('.color-dot').forEach(d => {
        const isActive = d.dataset.color === color;
        d.classList.toggle('active', isActive);
        d.style.borderColor = isActive ? '#F2F2F2' : 'transparent';
        d.setAttribute('aria-checked', isActive.toString());
      });
      const data = loadBacklog();
      const idx = data.findIndex(d => d.id === item.id);
      if (idx !== -1) { data[idx].color = color; saveBacklog(data); }
    };
    dot.addEventListener('click', applyColor);
    dot.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyColor(); }
    });
  });

  const moveBtn = card.querySelector('.move-btn');
  if (moveBtn) {
    moveBtn.addEventListener('click', () => {
      const data = loadBacklog();
      const idx = data.findIndex(d => d.id === item.id);
      if (idx !== -1) {
        const nextColIndex = colIndex + 1;
        if (nextColIndex < COLUMNS.length) {
          data[idx].status = COLUMNS[nextColIndex].id;
          saveBacklog(data);
          renderBacklog();
        }
      }
    });
  }

  card.querySelector('.delete-btn').addEventListener('click', () => {
    const data = loadBacklog();
    const updated = data.filter(d => d.id !== item.id);
    saveBacklog(updated);
    renderBacklog();
  });

  return card;
}

function showNewCardForm(colId, columnEl) {
  const existing = columnEl.querySelector('.kanban-new-card');
  if (existing) { existing.remove(); return; }

  const form = document.createElement('div');
  form.className = 'kanban-new-card';
  form.setAttribute('role', 'form');
  form.setAttribute('aria-label', 'Novo card');
  form.innerHTML = `
    <textarea class="kanban-new-input" placeholder="Título do card..." rows="2" aria-label="Título do novo card"></textarea>
    <div class="kanban-new-actions">
      <button class="btn-primary" aria-label="Adicionar card">Adicionar</button>
      <button class="btn-ghost" aria-label="Cancelar">Cancelar</button>
    </div>
  `;

  const textarea = form.querySelector('.kanban-new-input');
  const addBtn = form.querySelector('.btn-primary');
  const cancelBtn = form.querySelector('.btn-ghost');

  addBtn.addEventListener('click', () => {
    const title = textarea.value.trim();
    if (!title) { textarea.focus(); return; }
    const data = loadBacklog();
    data.push({ id: generateId(), title, status: colId, color: '#1E1E2E' });
    saveBacklog(data);
    renderBacklog();
  });

  cancelBtn.addEventListener('click', () => { form.remove(); });

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addBtn.click(); }
    if (e.key === 'Escape') form.remove();
  });

  columnEl.appendChild(form);
  textarea.focus();
}

/* ─── Evolução — Fallbacks ─── */

const FALLBACK_EVOLUTION_LOG = [
  { id: "log-001", date: "2026-03-17", project: "claude-dashboard", title: "Seção Evolução implementada", learned: ["Sub-navegação por tabs em JS vanilla", "Estrutura de dados para tracking de habilidades 1–5", "Padrão de sugestão de depreciação baseado em uso real", "Cron job para reflexão diária com git logs"], toolsUsed: ["Read", "Edit", "Write", "Bash"], skillsUsed: [], agentsUsed: [], highlight: "Bootstrap do sistema de auto-aprimoramento." }
];

const FALLBACK_SKILL_LEVELS = [];
const FALLBACK_IMPROVEMENT_PLAN = [];
const FALLBACK_PENDING = { date: null, status: "completed", note: "" };

/* ─── Evolução — State ─── */

let allSkillLevels = [];
let activeSkillFilter = 'Todos';

/* ─── Evolução — Helpers ─── */

function renderLevelDots(level) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="level-dot${i <= level ? ' filled' : ''}"></span>`;
  }
  return `<span class="level-dots" title="Nível ${level}/5" aria-label="Nível ${level} de 5">${html}</span>`;
}

function getFrequencyBadge(freq) {
  const map = { 'alta': ['freq-alta', 'Alta'], 'média': ['freq-media', 'Média'], 'baixa': ['freq-baixa', 'Baixa'] };
  const [cls, label] = map[freq] || ['freq-baixa', freq];
  return `<span class="freq-badge ${cls}">${escapeHtml(label)}</span>`;
}

function getTypeBadge(type) {
  const map = { 'native': ['type-native', 'Nativa'], 'skill': ['type-skill', 'Skill'], 'agent': ['type-agent', 'Agent'], 'mcp': ['type-mcp', 'MCP'], 'cli': ['type-cli', 'CLI'] };
  const [cls, label] = map[type] || ['type-skill', type];
  return `<span class="type-badge ${cls}">${escapeHtml(label)}</span>`;
}

function getPlanTypeBadge(type) {
  const map = { 'nova-skill': ['pt-nova-skill', 'Nova Skill'], 'novo-mcp': ['pt-novo-mcp', 'Novo MCP'], 'desenvolvimento': ['pt-dev', 'Desenvolvimento'], 'aprimoramento': ['pt-melhoria', 'Aprimoramento'], 'deprecacao': ['pt-dep', 'Depreciação'] };
  const [cls, label] = map[type] || ['pt-melhoria', type];
  return `<span class="plan-type-badge ${cls}">${escapeHtml(label)}</span>`;
}

function getImpactBadge(impact) {
  const map = { 'alta': ['ib-alta', '↑ impacto alto'], 'média': ['ib-media', '→ impacto médio'], 'baixa': ['ib-baixa', '↓ impacto baixo'] };
  const [cls, label] = map[impact] || ['ib-baixa', impact];
  return `<span class="impact-badge ${cls}">${escapeHtml(label)}</span>`;
}

function getEffortBadge(effort) {
  const map = { 'alta': ['ef-alta', 'esforço alto'], 'média': ['ef-media', 'esforço médio'], 'baixa': ['ef-baixa', 'esforço baixo'] };
  const [cls, label] = map[effort] || ['ef-baixa', effort];
  return `<span class="effort-badge ${cls}">${escapeHtml(label)}</span>`;
}

function formatDateBR(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Evolução — Renderização do Diário ─── */

function renderLearningLog(data, pending) {
  const container = document.getElementById('subtab-diario');
  container.innerHTML = '';

  // Banner de reflexão pendente
  if (pending && pending.status === 'pending') {
    const projects = (pending.projectsModified || []).join(', ');
    const banner = document.createElement('div');
    banner.className = 'pending-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = `
      <div class="pending-banner-icon" aria-hidden="true">⏳</div>
      <div class="pending-banner-text">
        <strong>Reflexão pendente — ${escapeHtml(pending.date || '')}</strong>
        <span>Projetos com atividade: ${escapeHtml(projects || 'nenhum identificado')}</span>
      </div>
      <span class="pending-banner-hint">Complete no próximo <code>/evolucao</code></span>
    `;
    container.appendChild(banner);
  }

  if (!data || data.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma entrada no diário ainda.';
    container.appendChild(empty);
    return;
  }

  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach(entry => {
    const el = document.createElement('article');
    el.className = 'log-entry';

    const learnedHTML = (entry.learned || []).map(l =>
      `<li class="log-learned-item">${escapeHtml(l)}</li>`
    ).join('');

    const toolsHTML = [...(entry.toolsUsed || []), ...(entry.skillsUsed || []).map(s => `skill:${s}`), ...(entry.agentsUsed || []).map(a => `agent:${a}`)].map(t =>
      `<span class="chip log-tool-chip">${escapeHtml(t)}</span>`
    ).join('');

    const refParts = [];
    if (entry.commit) refParts.push(`<code class="log-commit">${escapeHtml(entry.commit)}</code>`);
    if (entry.version) refParts.push(`<span class="log-version">${escapeHtml(entry.version)}</span>`);
    const refHTML = refParts.length > 0 ? `<div class="log-ref-row">${refParts.join('')}</div>` : '';

    el.innerHTML = `
      <div class="log-entry-header">
        <span class="log-date">${escapeHtml(formatDateBR(entry.date))}</span>
        ${entry.project ? `<span class="log-project-tag">${escapeHtml(entry.project)}</span>` : ''}
      </div>
      <div class="log-entry-title">${escapeHtml(entry.title)}</div>
      ${refHTML}
      ${learnedHTML ? `<ul class="log-learned-list">${learnedHTML}</ul>` : ''}
      ${entry.highlight ? `<div class="log-highlight">${escapeHtml(entry.highlight)}</div>` : ''}
      ${toolsHTML ? `<div class="log-tools-row chips-row">${toolsHTML}</div>` : ''}
    `;

    container.appendChild(el);
  });
}

/* ─── Evolução — Mapa de Habilidades ─── */

function renderSkillMap(data) {
  allSkillLevels = data;
  const container = document.getElementById('subtab-habilidades');
  container.innerHTML = '';

  // Alerta de candidatos a depreciação
  const deprecated = data.filter(s => s.status === 'deprecation-candidate');
  if (deprecated.length > 0) {
    const alertSection = document.createElement('div');
    alertSection.className = 'deprecation-alert';
    alertSection.setAttribute('role', 'alert');

    const itemsHTML = deprecated.map(s => `
      <div class="dep-alert-item">
        <span class="dep-alert-name">${escapeHtml(s.name)}</span>
        ${getTypeBadge(s.type)}
        <span class="dep-alert-reason">${escapeHtml(s.deprecationReason || s.notes || '')}</span>
      </div>
    `).join('');

    alertSection.innerHTML = `
      <div class="dep-alert-header">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M8 2L14 13H2L8 2Z"/><path d="M8 6v4M8 11.5v.5"/></svg>
        <strong>${deprecated.length} candidato${deprecated.length > 1 ? 's' : ''} a desativação</strong>
      </div>
      <div class="dep-alert-items">${itemsHTML}</div>
    `;
    container.appendChild(alertSection);
  }

  // Barra de filtro
  const filterLabels = ['Todos', 'Nativas', 'Skills', 'Sub-Agents', 'MCPs', 'CLI'];
  const typeMap = { 'Nativas': 'native', 'Skills': 'skill', 'Sub-Agents': 'agent', 'MCPs': 'mcp', 'CLI': 'cli' };

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.setAttribute('role', 'group');
  filterBar.setAttribute('aria-label', 'Filtrar por tipo');

  filterLabels.forEach(label => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (label === activeSkillFilter ? ' active' : '');
    btn.textContent = label;
    btn.setAttribute('aria-pressed', label === activeSkillFilter ? 'true' : 'false');
    btn.addEventListener('click', () => {
      activeSkillFilter = label;
      renderSkillMap(allSkillLevels);
    });
    filterBar.appendChild(btn);
  });
  container.appendChild(filterBar);

  // Grid de cards
  const filtered = activeSkillFilter === 'Todos'
    ? data
    : data.filter(s => s.type === typeMap[activeSkillFilter]);

  const grid = document.createElement('div');
  grid.className = 'cards-grid skill-map-grid';
  grid.setAttribute('aria-live', 'polite');

  filtered.forEach(item => {
    const card = document.createElement('article');
    card.className = `card skill-level-card${item.status === 'deprecation-candidate' ? ' card-dep' : item.status === 'watch' ? ' card-watch' : ''}`;
    card.setAttribute('aria-label', `Habilidade: ${item.name}`);

    const lastUsedText = item.lastUsed ? formatDateBR(item.lastUsed) : 'Nunca';
    const statusBadge = item.status === 'deprecation-candidate'
      ? `<span class="skill-status-badge badge-dep" title="${escapeHtml(item.deprecationReason || '')}">Depreciação sugerida</span>`
      : item.status === 'watch'
      ? `<span class="skill-status-badge badge-watch">Em observação</span>`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <span class="card-name">${escapeHtml(item.name)}</span>
        ${getTypeBadge(item.type)}
      </div>
      <div class="skill-level-row">
        ${renderLevelDots(item.level)}
        <span class="skill-level-num">${item.level}/5</span>
        ${getFrequencyBadge(item.usageFrequency)}
      </div>
      <p class="card-description">${escapeHtml(item.notes || '')}</p>
      <div class="skill-meta-row">
        <span class="skill-last-used">Último uso: ${escapeHtml(lastUsedText)}</span>
        ${statusBadge}
      </div>
    `;

    grid.appendChild(card);
  });

  container.appendChild(grid);

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma habilidade nesta categoria.';
    grid.appendChild(empty);
  }
}

/* ─── Evolução — Plano de Aprimoramento ─── */

function loadIgnoredPlans() {
  try {
    const raw = localStorage.getItem('plan-ignored');
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveIgnoredPlans(set) {
  localStorage.setItem('plan-ignored', JSON.stringify([...set]));
}

function renderImprovementPlan(data) {
  const container = document.getElementById('subtab-plano');
  container.innerHTML = '';

  const ignored = loadIgnoredPlans();
  const IMPACT_ORDER = { alta: 0, média: 1, baixa: 2 };

  function buildCard(item, isIgnored) {
    const card = document.createElement('article');
    card.className = `card plan-card${item.type === 'deprecacao' ? ' plan-card-dep' : ''}${isIgnored ? ' plan-card-ignored' : ''}`;
    card.setAttribute('aria-label', `Plano: ${item.title}`);

    const actionBtn = isIgnored
      ? `<button class="plan-restore-btn" data-id="${escapeHtml(item.id)}" title="Restaurar sugestão" aria-label="Restaurar">↩ restaurar</button>`
      : `<button class="plan-ignore-btn" data-id="${escapeHtml(item.id)}" title="Ignorar sugestão" aria-label="Ignorar">ignorar</button>`;

    card.innerHTML = `
      <div class="plan-card-header">
        ${getPlanTypeBadge(item.type)}
        <span class="plan-date">${escapeHtml(formatDateBR(item.date))}</span>
        ${actionBtn}
      </div>
      <div class="plan-card-title">${escapeHtml(item.title)}</div>
      <p class="card-description">${escapeHtml(item.description)}</p>
      <div class="plan-card-badges">
        ${getImpactBadge(item.impact)}
        ${getEffortBadge(item.effort)}
        <span class="plan-suggested-by">por ${escapeHtml(item.suggestedBy)}</span>
      </div>
    `;

    const btn = card.querySelector('[data-id]');
    btn.addEventListener('click', () => {
      const set = loadIgnoredPlans();
      if (isIgnored) set.delete(item.id); else set.add(item.id);
      saveIgnoredPlans(set);
      renderImprovementPlan(data);
    });

    return card;
  }

  const groups = [
    { key: 'em-andamento', label: 'Em Andamento', dot: 'progress' },
    { key: 'sugestao',     label: 'Sugestões de Claude', dot: 'todo' },
    { key: 'backlog',      label: 'Backlog', dot: 'todo' },
    { key: 'concluido',    label: 'Concluído / Descartado', dot: 'done' }
  ];

  groups.forEach(group => {
    let items = data
      .filter(i => i.status === group.key || (group.key === 'concluido' && i.status === 'descartado'))
      .sort((a, b) => (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9));

    if (group.key === 'sugestao') items = items.filter(i => !ignored.has(i.id));
    if (items.length === 0) return;

    const section = document.createElement('div');
    section.className = 'plan-group';

    const titleEl = document.createElement('div');
    titleEl.className = 'plan-group-title';
    titleEl.innerHTML = `<span class="col-dot ${group.dot}" aria-hidden="true"></span>${escapeHtml(group.label)}<span class="kanban-count">${items.length}</span>`;
    section.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.className = 'plan-cards-grid';

    const canIgnore = group.key === 'sugestao';
    items.forEach(item => grid.appendChild(buildCard(item, false, canIgnore)));

    section.appendChild(grid);
    container.appendChild(section);
  });

  // Grupo de ignoradas
  const ignoredItems = data
    .filter(i => i.status === 'sugestao' && ignored.has(i.id))
    .sort((a, b) => (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9));

  if (ignoredItems.length > 0) {
    const section = document.createElement('div');
    section.className = 'plan-group plan-group-ignored';

    const titleEl = document.createElement('div');
    titleEl.className = 'plan-group-title';
    titleEl.innerHTML = `<span class="col-dot done" aria-hidden="true"></span>Ignoradas<span class="kanban-count">${ignoredItems.length}</span>`;
    section.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.className = 'plan-cards-grid';
    ignoredItems.forEach(item => grid.appendChild(buildCard(item, true)));

    section.appendChild(grid);
    container.appendChild(section);
  }

  if (data.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhum item no plano ainda.';
    container.appendChild(empty);
  }
}

/* ─── Evolução — Orquestração ─── */

function renderEvolution(evolutionLog, skillLevels, improvementPlan, pending) {
  // Listeners dos sub-tabs
  document.querySelectorAll('#evolucao-tabs .subtab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.subtab;
      document.querySelectorAll('#evolucao-tabs .subtab').forEach(b => {
        b.classList.toggle('active', b.dataset.subtab === tab);
        b.setAttribute('aria-selected', b.dataset.subtab === tab ? 'true' : 'false');
      });
      document.querySelectorAll('.subtab-content').forEach(el => {
        el.classList.toggle('hidden', el.id !== `subtab-${tab}`);
      });
    });
  });

  renderLearningLog(evolutionLog, pending);
  renderSkillMap(skillLevels);
  renderImprovementPlan(improvementPlan);
}

/* ─── AI Hub ─── */

const FALLBACK_AIHUB = {
  stats: { totalCalls: 0, byRoute: { coding: 0, reasoning: 0, research: 0, general: 0 }, lastUsed: null },
  incidents: []
};

function renderAIHub(data) {
  const container = document.getElementById('aihub-content');
  if (!container) return;
  container.innerHTML = '';

  // ── Diagrama ──
  const diagramSection = document.createElement('div');
  diagramSection.className = 'aihub-diagram-section';
  diagramSection.setAttribute('aria-label', 'Diagrama de arquitetura do AI Hub');

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 760 390');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Fluxo: Prompt → ai-router.sh → ai-classifier.py → 4 rotas → modelos');
  svg.style.width = '100%';
  svg.style.maxWidth = '760px';
  svg.style.display = 'block';
  svg.style.margin = '0 auto';

  function svgEl(tag, attrs, text) {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
  }

  // defs: arrowhead marker
  const defs = svgEl('defs', {});
  const marker = svgEl('marker', { id: 'arrow', markerWidth: '8', markerHeight: '8', refX: '6', refY: '3', orient: 'auto' });
  marker.appendChild(svgEl('path', { d: 'M0,0 L0,6 L8,3 z', fill: '#4B5563' }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  // helpers
  function node(x, y, w, h, label, sublabel, accent) {
    const g = svgEl('g', {});
    g.appendChild(svgEl('rect', {
      x: x - w / 2, y: y - h / 2, width: w, height: h, rx: '8',
      fill: accent ? 'rgba(124,58,237,0.12)' : '#111111',
      stroke: accent ? '#7C3AED' : '#242424',
      'stroke-width': accent ? '1.5' : '1'
    }));
    const textY = sublabel ? y - 5 : y + 4;
    g.appendChild(svgEl('text', { x, y: textY, 'text-anchor': 'middle', fill: accent ? '#C4B5FD' : '#F2F2F2', 'font-family': 'JetBrains Mono, monospace', 'font-size': '11', 'font-weight': '500' }, label));
    if (sublabel) {
      g.appendChild(svgEl('text', { x, y: y + 11, 'text-anchor': 'middle', fill: '#4B5563', 'font-family': 'Inter, sans-serif', 'font-size': '9' }, sublabel));
    }
    return g;
  }

  function pill(x, y, label, color, textColor) {
    const g = svgEl('g', {});
    const w = 76, h = 22;
    g.appendChild(svgEl('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: '11', fill: color }));
    g.appendChild(svgEl('text', { x, y: y + 4, 'text-anchor': 'middle', fill: textColor || '#F2F2F2', 'font-family': 'Inter, sans-serif', 'font-size': '9', 'font-weight': '600' }, label));
    return g;
  }

  function line(x1, y1, x2, y2) {
    return svgEl('line', { x1, y1, x2, y2, stroke: '#2A2A2A', 'stroke-width': '1.5', 'marker-end': 'url(#arrow)' });
  }

  function vline(x, y1, y2) {
    return svgEl('line', { x1: x, y1, x2: x, y2, stroke: '#2A2A2A', 'stroke-width': '1.5', 'marker-end': 'url(#arrow)' });
  }

  // branch x positions
  const branches = [
    { x: 95,  route: 'coding',    label: 'coding',    color: '#1A2E1A', badge: '#10B981' },
    { x: 275, route: 'reasoning', label: 'reasoning', color: '#1A1A2E', badge: '#7C3AED' },
    { x: 465, route: 'research',  label: 'research',  color: '#1E1A2A', badge: '#9D5CFF' },
    { x: 645, route: 'general',   label: 'general',   color: '#2E1E1A', badge: '#F59E0B' }
  ];

  const models = [
    { x: 95,  label: 'Qwen2.5-Coder-7B', sub: 'MLX · local' },
    { x: 275, label: 'DeepSeek-R1 14B',  sub: 'MLX · local' },
    { x: 465, label: 'Gemini 2.5 Pro',   sub: 'Google API' },
    { x: 645, label: 'qwen2.5-coder',    sub: 'Ollama · local' }
  ];

  // vertical spine
  svg.appendChild(vline(380, 32, 62));
  svg.appendChild(vline(380, 82, 112));
  svg.appendChild(vline(380, 132, 170));

  // horizontal splitter line from classifier bottom to branches
  svg.appendChild(svgEl('line', { x1: '95', y1: '190', x2: '645', y2: '190', stroke: '#2A2A2A', 'stroke-width': '1.5' }));

  // vertical drops to branch boxes
  branches.forEach(b => {
    svg.appendChild(vline(b.x, 190, 228));
  });

  // branch to model lines
  branches.forEach((b, i) => {
    svg.appendChild(vline(b.x, 258, 298));
  });

  // input node
  svg.appendChild(svgEl('rect', { x: '340', y: '5', width: '80', height: '24', rx: '12', fill: '#1A1A1A', stroke: '#333', 'stroke-width': '1' }));
  svg.appendChild(svgEl('text', { x: '380', y: '21', 'text-anchor': 'middle', fill: '#9CA3AF', 'font-family': 'Inter, sans-serif', 'font-size': '10', 'font-weight': '500' }, 'PROMPT'));

  // router node
  svg.appendChild(node(380, 77, 160, 36, 'ai-router.sh', null, true));

  // classifier node
  svg.appendChild(node(380, 152, 180, 36, 'ai-classifier.py', 'keyword matching', false));

  // branch boxes
  branches.forEach(b => {
    const g = svgEl('g', {});
    g.appendChild(svgEl('rect', { x: b.x - 70, y: 232, width: 140, height: 34, rx: '6', fill: b.color, stroke: '#333', 'stroke-width': '1' }));
    g.appendChild(svgEl('text', { x: b.x, y: 253, 'text-anchor': 'middle', fill: '#D1D5DB', 'font-family': 'JetBrains Mono, monospace', 'font-size': '10.5', 'font-weight': '500' }, b.label));
    svg.appendChild(g);
  });

  // model nodes
  models.forEach(m => {
    svg.appendChild(node(m.x, 320, 150, 38, m.label, m.sub, false));
  });

  // usage count overlays on branch boxes
  const stats = data.stats || {};
  const byRoute = stats.byRoute || {};
  branches.forEach(b => {
    const count = byRoute[b.route] || 0;
    if (count > 0) {
      svg.appendChild(svgEl('circle', { cx: b.x + 60, cy: 232, r: '9', fill: b.badge }));
      svg.appendChild(svgEl('text', { x: b.x + 60, y: 236, 'text-anchor': 'middle', fill: '#fff', 'font-family': 'Inter, sans-serif', 'font-size': '9', 'font-weight': '700' }, count));
    }
  });

  diagramSection.appendChild(svg);
  container.appendChild(diagramSection);

  // ── Stats ──
  const bottomRow = document.createElement('div');
  bottomRow.className = 'aihub-bottom-row';

  const statsPanel = document.createElement('div');
  statsPanel.className = 'aihub-panel';

  const totalCalls = stats.totalCalls || 0;
  const lastUsed = stats.lastUsed ? formatDateBR(stats.lastUsed) : 'Nunca';

  const routeRows = [
    { key: 'coding',    label: 'coding →',    model: 'Qwen2.5-Coder-7B',   bar: '#10B981' },
    { key: 'reasoning', label: 'reasoning →', model: 'DeepSeek-R1 14B',    bar: '#7C3AED' },
    { key: 'research',  label: 'research →',  model: 'Gemini 2.5 Pro',     bar: '#9D5CFF' },
    { key: 'general',   label: 'general →',   model: 'Ollama qwen2.5',     bar: '#F59E0B' }
  ];

  const maxVal = Math.max(1, ...routeRows.map(r => byRoute[r.key] || 0));

  const routeBarsHTML = routeRows.map(r => {
    const val = byRoute[r.key] || 0;
    const pct = Math.round((val / maxVal) * 100);
    return `
      <div class="aihub-route-row">
        <span class="aihub-route-label">${escapeHtml(r.label)}</span>
        <span class="aihub-route-model">${escapeHtml(r.model)}</span>
        <div class="aihub-bar-wrap">
          <div class="aihub-bar" style="width:${pct}%;background:${r.bar}"></div>
        </div>
        <span class="aihub-route-count">${val}</span>
      </div>
    `;
  }).join('');

  statsPanel.innerHTML = `
    <div class="aihub-panel-header">
      <span class="aihub-panel-title">Uso por rota</span>
      <span class="aihub-total-badge">${totalCalls} total</span>
    </div>
    <div class="aihub-stats-meta">Último uso: <strong>${escapeHtml(lastUsed)}</strong></div>
    <div class="aihub-route-list">${routeBarsHTML}</div>
  `;

  // ── Incidents ──
  const incidentsPanel = document.createElement('div');
  incidentsPanel.className = 'aihub-panel';

  const incidents = data.incidents || [];
  const openCount = incidents.filter(i => !i.resolved).length;

  const severityConfig = {
    low:    { cls: 'sev-low',    label: 'baixa' },
    medium: { cls: 'sev-medium', label: 'média' },
    high:   { cls: 'sev-high',   label: 'alta' }
  };
  const typeLabels = {
    'model-load':        'Carregamento',
    'misclassification': 'Classificação',
    'api-error':         'API Error',
    'no-output':         'Saída truncada'
  };

  const incHTML = incidents.length === 0
    ? '<div class="empty-state" style="padding:1.5rem 0">Nenhum contratempo registrado.</div>'
    : incidents.map(inc => {
        const sev = severityConfig[inc.severity] || { cls: 'sev-low', label: inc.severity };
        const typeLabel = typeLabels[inc.type] || inc.type;
        const statusIcon = inc.resolved
          ? `<span class="inc-resolved" title="Resolvido">✓</span>`
          : `<span class="inc-open" title="Aberto">●</span>`;
        return `
          <div class="inc-item${inc.resolved ? '' : ' inc-open-item'}">
            <div class="inc-item-header">
              ${statusIcon}
              <span class="inc-type-badge">${escapeHtml(typeLabel)}</span>
              <span class="inc-route-tag">${escapeHtml(inc.route)}</span>
              <span class="sev-badge ${sev.cls}">${sev.label}</span>
              <span class="inc-date">${escapeHtml(formatDateBR(inc.date))}</span>
            </div>
            <p class="inc-description">${escapeHtml(inc.description)}</p>
            ${inc.resolution ? `<p class="inc-resolution"><span class="inc-res-label">→</span> ${escapeHtml(inc.resolution)}</p>` : ''}
          </div>
        `;
      }).join('');

  incidentsPanel.innerHTML = `
    <div class="aihub-panel-header">
      <span class="aihub-panel-title">Contratempos</span>
      ${openCount > 0 ? `<span class="aihub-open-badge">${openCount} aberto${openCount > 1 ? 's' : ''}</span>` : '<span class="aihub-all-clear">tudo ok</span>'}
    </div>
    <div class="inc-list">${incHTML}</div>
  `;

  bottomRow.appendChild(statsPanel);
  bottomRow.appendChild(incidentsPanel);
  container.appendChild(bottomRow);
}

/* ─── Sidebar date ─── */

function renderDate() {
  const el = document.getElementById('sidebar-date');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
}

/* ─── Init ─── */

async function init() {
  renderDate();

  /* Nav listeners */
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.target));
  });

  /* Mobile sidebar */
  const hamburger = document.getElementById('hamburger-btn');
  const overlay = document.getElementById('sidebar-overlay');
  if (hamburger) hamburger.addEventListener('click', openSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  /* Load data in parallel */
  const [skills, agents, projects, mcps, evolutionLog, skillLevels, improvementPlan, pending, aiHub] = await Promise.all([
    fetchJSON('./data/skills.json', FALLBACK_SKILLS),
    fetchJSON('./data/agents.json', FALLBACK_AGENTS),
    fetchJSON('./data/projects.json', FALLBACK_PROJECTS),
    fetchJSON('./data/mcps.json', FALLBACK_MCPS),
    fetchJSON('./data/evolution-log.json', FALLBACK_EVOLUTION_LOG),
    fetchJSON('./data/skill-levels.json', FALLBACK_SKILL_LEVELS),
    fetchJSON('./data/improvement-plan.json', FALLBACK_IMPROVEMENT_PLAN),
    fetchJSON('./data/pending-reflection.json', FALLBACK_PENDING),
    fetchJSON('./data/ai-hub.json', FALLBACK_AIHUB)
  ]);

  allSkills = skills;

  renderSkills(allSkills);
  renderAgents(agents);
  renderProjects(projects);
  renderMCPs(mcps);
  renderCheatsheet();
  renderBacklog();
  renderEvolution(evolutionLog, skillLevels, improvementPlan, pending);
  renderAIHub(aiHub);

  /* Badge de notificação no nav de Evolução */
  if (pending && pending.status === 'pending') {
    const evolucaoBtn = document.querySelector('[data-target="evolucao"]');
    if (evolucaoBtn) evolucaoBtn.classList.add('has-notification');
  }

  /* Ensure skills is active on load */
  navigateTo('skills');
}

document.addEventListener('DOMContentLoaded', init);
