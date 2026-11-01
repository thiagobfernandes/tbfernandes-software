# Design: referências e linguagem visual

Regra do Thiago: **toda tela se baseia nas referências**. Antes de criar uma tela, procure a referência que mais se parece e uma tela existente que já a aplica; reutilize os componentes dela. Se nenhuma referência servir, peça uma ao Thiago (capturas de tela) em vez de inventar.

A linguagem visual atual foi aprovada em 2026-10-23 ("gostei dessa estilização, continue"). Mantenha-a em tudo que for novo.

## Referências

| Referência | O que pegar | Onde já está aplicado |
|---|---|---|
| **Luma** (SaaS no Behance) — grafo | Árvore com conectores ortogonais e pontos, nó raiz com brilho, canvas escuro pontilhado | "Como seu trabalho se conecta" na visão geral, árvore de metas, `RelationTree` |
| **Luma** — cards de métrica | Rótulo pequeno, número grande e leve + unidade, um visual pequeno (barras, pontos, anel, linha) | `MetricCard` + `metric-visuals` (visão geral) |
| **Obsidian** — grafo | Grafo de rede com nós coloridos por tipo, filtros por tipo, painel do nó selecionado | `/knowledge/graph` |
| **Cindr** (Dribbble) | Timeline escura por dia, pílula "hoje" com marcador vertical, barras com faixa colorida à esquerda e %, trilho direito com calendário do mês e to-do Hoje / Próximos 7 dias / Depois | Timeline de projetos, `agenda-panel` da visão geral, `/calendar` |
| **AturnDeck** (Dribbble) | Trilho de ícones + painel de projetos com Recentes/Categorias e contadores, cards kanban com prioridade, chip de data e progresso | Sidebar com contadores, quadro de tarefas |
| **Ronas IT** (Dribbble) | Alternância Lista/Quadro/Calendário, barra de filtros, kanban com tag e prazo, trilho de atividade | `/tasks` (Lista/Quadro com busca) |

Os sites Dribbble, Behance e obsidian.md não abrem a partir do ambiente do Claude na nuvem; use as capturas abaixo ou peça novas.

## Capturas das telas atuais

| Tela | Arquivo |
|---|---|
| Visão geral (pt-BR, escuro) | [img/pt-visao-geral.png](img/pt-visao-geral.png) |
| Tarefas, quadro | [img/pt-tarefas.png](img/pt-tarefas.png) |
| Assistente | [img/pt-assistente.png](img/pt-assistente.png) |
| Timeline de projetos | [img/v2-timeline.png](img/v2-timeline.png) |
| Grafo (versão anterior à tradução) | [img/v5-graph.png](img/v5-graph.png) |
| Calendário | [img/v8-calendar.png](img/v8-calendar.png) |
| Celular | [img/v6-mobile.png](img/v6-mobile.png) |
| Fluxo de caixa, tema claro | [img/v6-cash-light.png](img/v6-cash-light.png) |

## Linguagem visual

- **Tema escuro navy é o principal** (`--background: #0c1821`), com tema claro equivalente. Toda tela é conferida nos dois.
- **Cor de destaque teal** (`--primary`), usada com moderação: item ativo, progresso, nó raiz, foco.
- **Cards** com borda fina (`border-border`), cantos `--radius` (0.625rem), sem sombra pesada; título em semibold + subtítulo em `text-muted-foreground`.
- **Números grandes e leves** nos cards de métrica; unidade menor ao lado.
- **Chips** pequenos com borda para prazo ("Vence hoje", "Atrasada 2d"), ponto colorido para prioridade.
- **Barras de progresso** finas com trilho escuro.
- **Canvas pontilhado** para grafos e árvores.
- **Ícones** lucide-react, tamanho padrão do shadcn.
- **Cores só por tokens** de `tbfernandes-frontend/src/app/globals.css` (`--success`, `--warning`, `--destructive`, cores de projeto em `lib/project-colors.ts`). Nada de hex no componente.

## Marca

- **Logo:** notebook com "t" + palavra "tbfernandes", em dourado degradê. Arquivos em `tbfernandes-frontend/public/brand/`: `logo-tbfernandes.png` (completa) e `logo-symbol.png` (só o notebook). O dourado funciona nos dois temas, então não há versão clara e escura.
- **Onde aparece:** `components/layout/brand-mark.tsx` (barra lateral, menu do celular e tela de carregamento; com a barra recolhida, só o símbolo), splash do desktop (`public/desktop-splash.html`) e `src/app/favicon.ico`.
- **Ícone do Windows:** o símbolo dourado num quadrado navy arredondado. Para trocar, gere um PNG quadrado de 1024 px e rode `npx tauri icon <arquivo>.png` em `tbfernandes-desktop/`. Depois apague o que não usamos (`android/`, `ios/`, `Square*`, `StoreLogo.png`, `64x64.png`).

## Estrutura de navegação

- Sidebar com **grupos recolhíveis por área** (Trabalho, Conhecimento, Crescimento, Finanças, Rede), cada um com **subitens** e contadores quando fizer sentido. Visão geral, Calendário e Assistente no topo; Configurações no fim.
- Header com breadcrumbs, busca global (`Ctrl K`), alternância de tema e avatar.
- No celular a sidebar vira menu lateral (`mobile-nav`).

## Padrões de tela

- Cabeçalho da tela: título, subtítulo que diz para que a tela serve, ações à direita (botões "+ Empresa", "+ Tarefa"…) e selo "Dados de exemplo" no modo local.
- Listas com filtros no topo; recursos com status ganham Lista/Quadro (como `/tasks`); o que tem data aparece no `/calendar`.
- Estados vazio, carregando e não encontrado sempre tratados (`EmptyState`, skeletons, `MissingRecord`).
- Criar/editar em diálogo; detalhe de tarefa em painel lateral; excluir com confirmação; toast em pt-BR após cada ação.
