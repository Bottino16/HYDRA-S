# Sidebar Premium V2 — relatório final

Entrega: 17/11/2026. Somente navegação lateral do ambiente autenticado. SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.

## Auditoria e conflitos

A versão anterior tinha sidebar fixa de 292/272px ou drawer até 800px, sem botão ou estado compacto no computador. Toda a sidebar rolava, incluindo marca/status. Definições legadas de largura, padding e navegação coexistem no HTML, ui-foundation.css e ui-polish.css. A folha final isolada sidebar-premium.css foi consolidada com regras específicas para resolver as dimensões, sem remover estilos compartilhados necessários a outras telas.

O mecanismo de seções existente preserva nós, rascunhos, conversas e streaming; não foi substituído. A revisão visual identificou ainda um fechamento antigo de notificações procurando `.relative`, elemento inexistente, causando erro quando o painel estava aberto e se clicava fora. A referência foi corrigida para `.notification-wrapper`, sincronizando aria-expanded ao fechar.

## Composição e comportamento

### Expandida

276px, marca textual com slot do símbolo/ futura logo, botão de recolhimento no cabeçalho, ícones alinhados, superfícies azul profundo/ciano e destaque ativo discreto. Grupos: Navegação principal (quatro seções), Ferramentas (documentação/tema/notificações/tela cheia) e Conta e administração (senha/administração/sessão). Os IDs, destinos e verificações reais de autorização permanecem os mesmos.

### Compacta

80px, ícones centralizados, marca compacta, botão de expansão sempre acessível e conteúdo principal ocupando automaticamente o espaço liberado. Não se recriam as seções nem se recarrega a página. Rótulos continuam acessíveis; dicas em hover/foco são apresentadas fora da sidebar, evitando corte pelo scroll. Indicador ativo e contagem de notificações continuam visíveis. O painel de notificações abre como flyout ao lado do trilho compacto.

A preferência não sensível usa localStorage `hydra_sidebar_collapsed` com `compact` ou `expanded`. Falhas de acesso ao armazenamento são toleradas. Entre 801 e 1200px, o padrão é compacto quando não há preferência; acima de 1200px, expandido. Preferência explícita prevalece nas larguras desktop/tablet largo. Mudar de seção preserva essa escolha; recarregar também.

### Drawer e orientação

Até 800px, usa drawer de até 336px, independente do estado compacto salvo. Ao retornar à largura desktop, a escolha é restaurada. Menu, botão interno Fechar, overlay, Escape, ciclo de foco e fechamento ao selecionar seção foram preservados. O fundo fica inert enquanto aberto, e seu estado anterior é restaurado. Fechar pelo botão/overlay/Escape devolve foco ao Menu; ao navegar para uma seção, foco segue para o título como antes.

### Rolagem e animações

Marca/ações de cabeçalho e status ficam fora da região rolável. Somente a lista de navegação rola quando necessário, com scrollbar discreta e itens acessíveis por teclado. Nenhuma função é removida para caber na tela. Transições curtas de largura/flex-basis e de drawer respeitam prefers-reduced-motion. Não há biblioteca nova.

## Arquivos

- `public/arthur.html`: botão recolher/expandir, agrupamento dos itens e correção do fechamento de notificações.
- `public/sidebar-premium.css`: composição expandida/compacta/mobile, lista rolável, flyout e dicas.
- `public/ui-navigation.js`: preferência, estados responsivos e dicas acessíveis, preservando o drawer e foco existentes.
- `test/ui-navigation.test.js`: preferência/persistência, estado, streaming, dicas e fechamento seguro de notificações.
- `docs/RELATORIO-SIDEBAR-PREMIUM-V2.md`: auditoria e entrega.

Backend/APIs, autenticação/CSRF/permissões, banco, Ollama, comandos/ACK/fila/travas, firmware/protocolo e simulação não foram alterados. Water Experience, Análise Ambiental e login não foram redesenhados. A decoração do botão dinâmico do Assistente envolve apenas seu texto em um span, preservando o nó, listeners e funções originais. Há guarda contra inicialização duplicada.

## Testes

Execução final: **67 aprovados, 0 falhas, 0 ignorados**, aproximadamente **54,85 segundos**, incluindo subtestes:

```powershell
node --test --test-concurrency=1 test/ui-navigation.test.js test/ui-polish.test.js test/assistant-ui.test.js test/settings-ui.test.js test/history-ui.test.js test/access-ui.test.js test/login-experience.test.js test/water-experience.test.js test/environment-v5.test.js test/auth.test.js test/device-api.test.js
```

Cobertura: alternâncias repetidas; preferência persistida; tablet sem preferência e com escolha explícita; ida ao drawer/retorno; seção ativa; mesmos nós e valores de formulário; recolhimento durante streaming simulado sem abortar; tooltip com nome acessível no botão dinâmico e listener preservado; Escape/overlay/foco; notificações dentro/fora sem contêiner removido; permissões, autenticação, comandos únicos das bombas e V5.

Um teste anterior assumia que o primeiro link de Conta era logout. Como Administração foi agrupada ali por decisão aprovada, a busca foi especificada pelo onclick de logout; a expectativa do destino não mudou. O teste de streaming existente foi ampliado para incluir recolhimento sem perder suas verificações. Nenhuma expectativa de segurança foi afrouxada. A primeira execução de regressão aprovou 66 testes; a execução final inclui o novo teste de notificações, totalizando 67. Não somar execuções repetidas. `git diff --check` passou; apenas avisos de normalização LF/CRLF.

## Inspeção visual real

Prévia isolada: banco em memória, SIMULAÇÃO, loopback 127.0.0.1:3101 e conta efêmera, sem carregar Ollama ou acessar MySQL.

- 1440×1000: expandida 276px e compacta 80px; conteúdo iniciou em x=80 no modo compacto. Preferência compacta confirmada após recarga; expansão/recolhimento preservou Histórico como seção ativa. Dicas ao foco e flyout de notificações inspecionados.
- 1024×700: compacto no tema claro, somente lista rolável, sem overflow horizontal.
- 768×1000: drawer independente da preferência, sem overflow; fechamento pelo overlay confirmado e foco no Menu.
- 390×840: troca de seção fecha o drawer; tema alterado sem perder estado.
- 360×640: lista rolável, marca/Fechar e conexão fixos; Tab após logout voltou ao botão Fechar. Escape funcionou a partir do botão focado; sem overflow horizontal.
- 1920×1000: sidebar expandida 276px e composição ampla preservada, sem overflow horizontal.

A revisão detectou o erro antigo das notificações, corrigido nesta entrega. Uma nova aba após a correção confirmou abertura/fechamento e alternância sem erros de console capturados. Uma tentativa da ferramenta de enviar Escape ao próprio aside não focável falhou; o comportamento foi verificado usando o botão Fechar focado, sem mudar as regras da aplicação.

Capturas locais não versionadas: `.data/sidebar-v2-expanded.jpg`, `.data/sidebar-v2-compact.jpg`, `.data/sidebar-v2-mobile.jpg`. A inspeção não cobre a combinação exaustiva de todos os temas em todas as larguras nem leitores de tela/dispositivos físicos.

## Commits

- `9b25722` — auditoria prévia e conflitos.
- `5840b0d` — estrutura expandida/compacta e composição visual.
- `699c631` — preferência, dicas e integração com drawer.
- `ed7afe4` — testes de estado/streaming e correção de notificações.
- Relatório final em commit documental separado, identificável no histórico Git.

## Encerramento e limitações

A prévia Node PID 15576 foi encerrada após conferir a propriedade da porta 3101; ausência de listener confirmada e credencial efêmera removida. Outros serviços, .env e dados persistentes não foram modificados. `docs/RELATORIO-IA-2E.md` permanece não rastreado e fora dos commits.

Zoom real do navegador ficou pendente de teste manual: a capacidade de automação disponibiliza redimensionamento do viewport, sem comando de zoom. As alturas reduzidas e mudanças de largura foram verificadas, mas não são apresentadas como equivalentes a zoom. Também ficam para avaliação manual contraste percebido, dispositivo físico, orientação e leitor de tela. Não houve teste real do Ollama nem hardware. Nenhuma etapa seguinte foi iniciada.

## Roteiro manual

1. Inicie normalmente em SIMULAÇÃO (`npm start`), autentique e use Ctrl+F5.
2. Em desktop, use o botão do cabeçalho: 276px ↔ 80px. Verifique aumento do conteúdo, rótulo do botão e destaque ativo. Alterne várias vezes e recarregue para conferir preferência.
3. No compacto, passe o mouse ou use Tab nos ícones; confira dicas e nomes. Abra notificações, feche por clique fora/Escape e confira que não há erros.
4. Navegue entre Visão Geral, Histórico, Configurações e Assistente. Rascunhos/conversas devem permanecer. Recolha durante uma geração apenas se houver memória suficiente; não desative proteções de memória para testar.
5. Em 1024px, avalie o compacto; em 768px, 390px e 360px, abra Menu e teste Fechar, overlay, Escape e seleção de seção. Ao retornar ao desktop, a preferência deve ser restaurada.
6. Use altura curta e Tab/Shift+Tab até os últimos itens: só a lista deve rolar, mantendo cabeçalho e conexão disponíveis.
7. Alterne temas. Teste zoom real em 125%, 150% e 200%, paisagem/retrato e as seis larguras previstas, verificando ausência de cortes e acesso a todos os itens. Restaure o zoom depois.
8. Em conta CLIENTE, confira os acessos atuais e que Administração continua sujeita à autorização existente. Nenhuma permissão nova deve aparecer.

Aguardando avaliação e aprovação do usuário antes de outras alterações.
