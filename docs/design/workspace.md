# Workspace: auditoria, direção e infraestrutura de layout

Versão 1 · 2026-11-21. Complementa [referencias.md](referencias.md): a paleta preto e dourado e os tokens não mudam. O que muda é a organização da tela.

## 1. Auditoria (estado antes da refatoração)

| Área | Problema | Efeito |
|---|---|---|
| Shell | Header com `backdrop-blur` translúcido; avatar com gradiente | Vidro e gradiente decorativos, fora da linguagem |
| Shell | Sidebar só tem dois estados (larga 224px ou trilho 56px), largura fixa, sem esconder | Usuário se adapta à sidebar |
| Sidebar | Trilho vertical com bolinhas e brilho (`shadow-[0_0_8px]`) nos subitens; ícone do grupo fica dourado junto com o item ativo | Ruído; dois itens parecem selecionados |
| Sidebar | Grupos abertos/fechados à mão se perdem ao recarregar; sem favoritos, sem ordem própria, sem ocultar | Preferência não persiste |
| Sidebar | "Projetos ativos" sem limite nem colapso, com `#` colorido | Lista longa empurra o resto |
| Páginas | `PageContainer` + `PageHeading` grande (título 24px + descrição) em todas as telas, inclusive ferramentas | Altura gasta antes do conteúdo |
| Notas | Lista e documento são dois cards `rounded-2xl` lado a lado; tags expostas no topo da lista e no documento; documento dentro de card com cabeçalho separado por borda | Cartão gigante, pouca área de leitura |
| Notas | Lista com largura fixa (22rem), sem recolher; sem ordenar ou agrupar; sem modo leitura/foco | Pouca flexibilidade |
| Markdown | Corpo em 14–15px, títulos pequenos, sem âncoras nem sumário | Leitura cansativa em notas longas |
| Tarefas | Filtros como chips sempre visíveis (um por projeto + quatro prioridades em inglês); abas, busca e chips em linhas que quebram | Toolbar pesada, idioma misturado |
| Kanban | Colunas com fundo `bg-muted/40` e `rounded-2xl`; card com tag, prazo, título, descrição, checklist, divisória, projeto e prioridade sempre | Denso de ruído, pouco de informação |
| Kanban | Sem recolher/ocultar/redimensionar colunas; cabeçalho rola junto | Quadro rígido |
| Grafo | Página com título, abas, 12 chips de tipo e painel fixo de instruções; canvas com altura fixa (36rem) | O grafo é a menor parte da tela |
| Grafo | Forças fixas no código; sem modos (projeto, clusters, caminho); sem menu de contexto, fixar nó ou painel redimensionável | Pouca investigação possível |
| Geral | `PriorityBadge` mostra `urgent`/`high` em inglês | Viola a regra de idioma |
| Geral | Atalhos documentados só em tooltips com `<kbd>` montado à mão em cada lugar | Duplicação |

## 2. Direção

**Workspace pessoal profissional**, não painel administrativo:

- **Três camadas visíveis:** navegação (sidebar, superfície `--sidebar`), conteúdo (fundo `--background`, sem cartão em volta) e ações (toolbars de 44px coladas ao conteúdo, ícones fantasmas, uma única ação primária dourada por tela).
- **Menos caixas:** no máximo dois níveis de borda. Painéis são separados por uma linha de 1px, não por cartões com raio grande.
- **Dourado com intenção:** item ativo, ação primária, foco e seleção. Nunca decoração.
- **Densidade configurável:** listas e quadros respeitam `compact | comfortable | detailed`.
- **O usuário manda no layout:** painéis recolhem, redimensionam, maximizam; tudo persiste e há "Restaurar layout".
- Referências de comportamento: Linear (hierarquia e densidade), Notion (leitura), Obsidian (painéis e grafo), Raycast (consistência e atalhos). Nada de copiar visual.

## 3. Infraestrutura compartilhada

| Peça | Onde | Para quê |
|---|---|---|
| `usePreference(key, default)` | `lib/preferences.ts` | Estado persistido em `localStorage` (JSON, prefixo `tbf:`), sincronizado entre abas; `resetPreferences(prefix)` |
| Shell do workspace | `components/workspace/workspace-state.ts` | Modo imersivo (esconde sidebar e header), variável `--header-h` |
| `ResizablePanel` + `ResizeHandle` | `components/workspace/resizable-panel.tsx` | Painel lateral com largura mín./máx., arrastar, teclado (setas), duplo clique restaura, recolher |
| `useFullscreen` | `components/workspace/use-fullscreen.ts` | Tela cheia real quando o navegador permite |
| `WorkspaceToolbar` | `components/workspace/workspace-toolbar.tsx` | Barra de 44px padrão das ferramentas |
| `DisplayMenu` | `components/shared/display-menu.tsx` | Popover "Exibição": densidade, campos visíveis, ordenação, agrupamento |
| `FilterMenu` + `ActiveFilters` | `components/shared/filter-menu.tsx` | Filtros em popover, filtros ativos como pílulas compactas |
| `SegmentedControl`, `Kbd` | `components/shared/` | Alternâncias de visão e atalhos com um só visual |
| `Popover`, `Switch`, `Slider`, `ContextMenu` | `components/ui/` | Primitivos Radix no padrão shadcn |

### Chaves de preferência

`tbf:sidebar` (modo, largura, grupos, ordem, favoritos, ocultos) · `tbf:panel:<id>` (largura, recolhido) · `tbf:notes:view` · `tbf:tasks:view` · `tbf:graph:settings`. "Restaurar layout" apaga as chaves da tela atual; `Ctrl .` restaura a sidebar.

### Atalhos

| Atalho | Ação |
|---|---|
| `Ctrl B` | Sidebar expandida ↔ compacta |
| `Ctrl \` | Mostrar/ocultar a sidebar |
| `Ctrl .` | Restaurar layout da sidebar |
| `Ctrl K` | Busca global |
| `Esc` | Sair de maximizado/foco |

## 4. Plano incremental

1. Design system: preferências, primitivos (popover, switch, slider, context menu), `DisplayMenu`, `FilterMenu`, `SegmentedControl`, `Kbd`; header sólido; `PriorityBadge` em pt-BR.
2. Shell e sidebar: três modos, redimensionar, grupos persistidos, favoritos, ordem, itens ocultos.
3. Painéis: `ResizablePanel`, modo imersivo, tela cheia.
4. Notas: três painéis, filtros em popover, agrupamento, leitura editorial, sumário, maximizar e foco.
5. Tarefas: toolbar única, quadro configurável (agrupar por status/projeto/prioridade, recolher/ocultar/redimensionar colunas), menu de exibição.
6. Grafo: explorador de tela cheia (ver seção 5).
7. Rotinas: execução do dia separada do cadastro; visões hoje, semana (matriz rotinas × dias), mês, todas, histórico e análise de consistência (estilo contribution graph).
8. Projetos: portfólio (cards, lista, quadro por status, timeline), agrupamento por empresa/status/prioridade/meta, saúde calculada de dados reais (bloqueios, atrasos, inatividade, marcos, falta de próxima ação) separada do status; workspace interno reutilizando tarefas, notas, apontamentos e grafo local filtrados pelo projeto.
9. Visão geral: central de comando com registro de widgets (tipo, tamanho mín./máx., visibilidade, posição), "Precisa de atenção" com o motivo de cada item, agenda como widget, ação global "Criar" ligada à busca, perfis de layout.
10. Demais telas: `PageHeading` compacto e padrões aplicados.

## 5. Grafo: análise da biblioteca

Hoje: **d3-force** (simulação) + **SVG** desenhado pelo React, com a simulação escrevendo atributos direto no DOM (sem render por quadro).

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| d3-force + SVG (atual) | Forças configuráveis (repulsão, distância, atração, gravidade, colisão); nós focáveis por teclado; cores pelos tokens via CSS; já integrado | SVG pesa acima de ~3–5 mil elementos | **Mantido** |
| Sigma.js + Graphology | WebGL, aguenta dezenas de milhares de nós; algoritmos prontos | Estilo fora do CSS/tokens; acessibilidade por teclado a construir; nova dependência grande | Só se o volume passar de milhares de nós |
| Cytoscape.js | Layouts hierárquicos e compostos prontos | Sistema de estilo próprio; ~400 kB; integração React indireta | Não justifica |
| D3 completo | — | Já usamos o módulo que importa (`d3-force`) | — |

Um workspace pessoal tem dezenas a poucas centenas de registros, bem dentro do que o SVG renderiza. A mudança é de **arquitetura**: separar modelo (`graph.ts`), transformações por modo (`graph-views.ts`: global, local, projeto, assunto, clusters, caminho), algoritmos (`graph-algorithms.ts`: comunidades por propagação de rótulos, menor caminho, grau), layout (`force-layout.ts` com forças vindas das configurações, pré-aquecimento em Web Worker acima de 300 nós), seleção/filtros/configurações (`use-graph-explorer.ts`) e renderização (`graph-canvas.tsx`).
