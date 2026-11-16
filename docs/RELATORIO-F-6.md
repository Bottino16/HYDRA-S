# F-6 — Revisão global e acabamento do frontend

Data: 16/11/2026. Somente frontend e experiência visual. **Implementado não significa visualmente aprovado**: a aprovação final continua dependendo da avaliação do responsável pelo HYDRA-S.

## 1. Escopo e preservação

Revisados os arquivos de Login, Visão Geral/UI-3, maquete, controles das três bombas, telemetria/gráfico, Histórico e Eventos, Configurações, Assistente, Administração, navegação, notificações e diálogos.

Continuamos exclusivamente em SIMULAÇÃO e com firmware NÃO VALIDADO fisicamente. Nenhuma mudança em backend/APIs, banco, autenticação/sessões/CSRF, permissões, automação/agendamento, firmware/serial, bombas/travas/fila/ACK, provedor/modelo/contexto/limite de 256 tokens do Ollama ou conteúdo das respostas. Nenhum segredo ou `.env` foi modificado. Não houve instalação de pacotes, mudança de dependências, abertura de portas ou implementação da Fase 4.5.

## 2. Problemas encontrados na inspeção do código

| Área | Evidência na implementação anterior | Correção |
| --- | --- | --- |
| Chat móvel | Altura da área principal usava toda a viewport, além do cabeçalho móvel; desconto existia somente em uma regra de baixa altura | Medição do cabeçalho com resize/ResizeObserver e desconto da altura real até 800 px, preservando o cálculo de visualViewport do Assistente |
| Configurações | Seleção múltipla de tipos de elementos para foco não assegurava a ordem esperada nos testes; mutações repetidas de estilo podiam substituir o acionador registrado | Ordem do DOM e mudança de estado aberto/fechado, com foco inicial, ciclo Tab e retorno ao acionador |
| Documentação | Diálogo sem papel/nome acessível e sem retorno de foco | Semântica de diálogo e gestão de foco sem alterar ações |
| Troca de senha | Formulário dinâmico com cores fixas escuras, sem ciclo Tab/retorno de foco | Estilos com tokens nos dois temas e foco por camada de apresentação; autenticação e envio existentes intactos |
| Bombas e modo | Alguns controles definidos com altura de 38–40 px e textos de 10–11 px | Controles com pelo menos 44 px e textos de estado/caminho/retorno maiores em telas menores |
| Telemetria/estados | Títulos móveis chegavam a 9 px; rótulos longos sem ajustes específicos | Títulos maiores, quebra de linhas e cartões com largura mínima zero |
| Gráfico/ações legadas | Canvas e campo manual sem nomes acessíveis; cabeçalho do gráfico com ação sem quebra garantida | Nomes acessíveis, quebra do cabeçalho e preservação do CSV e das ações |
| Erro/sucesso | Botões legados e notificações com cores fixas pouco consistentes no tema claro | Tokens de texto/superfície e cores de estado, mantendo rótulos textuais |
| Modais/notificações | Larguras/espaçamentos e conteúdos flexíveis podiam exceder telas pequenas | Limites de viewport, rolagem interna do diálogo, quebra de ações/conteúdo e notificações sem largura além da tela |
| Documentação antiga | Descrições de “planos” e “override manual” não refletiam a organização atual | Nomenclatura MASTER/CLIENTE e descrição de autorização pelo servidor, sem inventar funcionalidades |

Esses problemas foram identificados por leitura do código e testes direcionados. Não são observações certificadas por screenshots de navegador.

## 3. Arquivos e commits

- `public/ui-polish.css`: camada final compartilhada de responsividade, legibilidade, temas, controles, mensagens e modais.
- `public/ui-polish.js`: medição do cabeçalho e foco da documentação/troca de senha; sem requisições ou comandos.
- `public/settings-view.js`: ordem e preservação do foco nos dois modais de Configurações.
- `public/arthur.html`: carregamento da camada final, semântica acessível e textos da documentação.
- `public/login.html` e `public/painel-adm.html`: carregamento da camada final compartilhada.
- `test/ui-polish.test.js`: quatro testes direcionados.
- Este relatório.

Commits:

1. `7bfd1a9` — acabamento transversal e altura móvel.
2. `fc6683e` — correção/testes de foco, rascunhos e contraste.
3. `5674147` — nomes acessíveis e acabamento do cabeçalho/estados.
4. Commit de documentação desta entrega — relatório final e proposta offline.

## 4. Testes e evidências

```powershell
node --test test/ui-polish.test.js
node --test --test-concurrency=1
```

Os quatro testes novos passaram: cabeçalho móvel acompanha resize sem modificar a viewport do Assistente; modais de perfil/calendário preservam ordem Tab, retorno de foco e rascunho; documentação e diálogo dinâmico de senha devolvem foco; pares de tokens de texto/estado e superfícies principais atingem contraste calculado de pelo menos 4,5:1.

O contraste calculado cobre `text-primary`, `text-secondary`, `accent`, `success`, `warning`, `danger` sobre `bg-base`, `bg-panel`, `bg-card` em ambos os temas. Não é certificação WCAG da página inteira: transparências, estados de hover, canvas, foco e conteúdo composto exigem inspeção real.

Uma execução inicial do teste de contraste precisou corrigir seu leitor de cores para aceitar hexadecimal de três dígitos; também foi ajustada a referência ao documento no observador para o encerramento do DOM. Não houve redução do requisito de contraste ou das expectativas antigas.

Suíte completa: **101 testes, 98 aprovados, zero falhas e três integrações SQL opcionais ignoradas**, em aproximadamente 117 segundos. Saída local em `.data/tests-f6-all.txt`, ignorada pelo Git. Inclui regressões das etapas anteriores, autenticação/permissões, comandos simulados, configurações, histórico/CSV, UI-3 e Assistente/streaming com mocks. As falhas temporárias de tempo real documentadas na F-4 não se repetiram nesta execução; isso não esclarece sua causa histórica.

Após os últimos ajustes de rótulos e CSS, também passaram **6/6 testes** de acabamento/navegação com `node --test --test-concurrency=1 test/ui-polish.test.js test/frontend-sections.test.js`, incluindo preservação de rascunhos e streaming ao alternar seções. Saída em `.data/tests-f6-final-focused.txt`. Não foram usados MySQL real, Arduino, serviços pagos ou geração real do Ollama.

## 5. Avaliação mobile e desktop

**Não houve teste visual real no navegador nesta F-6.** O acesso local havia sido bloqueado pela ferramenta em etapas anteriores; a restrição não foi contornada. Não foram usadas ferramentas alternativas de captura/automação para contorná-la.

| Largura | Categoria | Claro e escuro | Situação |
| --- | --- | --- | --- |
| 360 px | Celular | Preparados em CSS | Avaliação visual pendente |
| 390 px | Celular | Preparados em CSS | Avaliação visual pendente |
| 768 px | Tablet | Preparados em CSS | Avaliação visual pendente |
| 1024 px | Notebook | Preparados em CSS | Avaliação visual pendente |
| 1440 px | Desktop | Preparados em CSS | Avaliação visual pendente |
| 1920 px | Desktop | Preparados em CSS | Avaliação visual pendente |

Permanecem não verificados visualmente: ausência de sobreposição/rolagem horizontal, dimensionamento final do gráfico, contraste percebido, conforto de toque, menu em aparelho real, teclado virtual, rolagem das mensagens com teclado aberto, fontes/referências extensas e leitor de tela. Os testes DOM não aprovam esses itens.

## 6. Dependências externas e proposta offline

Somente a página principal ainda declara as três dependências visuais externas abaixo; login/administração usam componentes locais e fallback de fonte. Socket.io é servido pelo próprio backend. Clima é um serviço informativo externo via backend, separado desta avaliação visual. Ollama permanece local e não foi alterado.

| Dependência atual em `arthur.html` | Risco offline | Proposta, ainda não executada |
| --- | --- | --- |
| `cdn.jsdelivr.net/npm/chart.js` sem versão explícita | Gráfico depende de carregamento remoto, sem versão reprodutível | Identificar versão efetivamente usada e testar bundle UMD equivalente local, fixo, em `/public/vendor`, mantendo a licença |
| `unpkg.com/@phosphor-icons/web` sem versão explícita | Ícones e fontes de ícones podem faltar | Inventariar os pesos/classes realmente usados e servir somente CSS/fontes correspondentes localmente, com caminhos relativos e licença |
| Google Fonts / Inter | Fonte remota pode não carregar; métricas podem mudar | Preferir inicialmente o fallback de sistema já existente, ou WOFF2 local da Inter com `font-display: swap`, preservando licença e nome reservado |

Referências oficiais consultadas: [Chart.js — MIT](https://github.com/chartjs/Chart.js), [Phosphor Web — MIT](https://github.com/phosphor-icons/web/blob/master/LICENSE), [Phosphor — integração por versão/peso](https://github.com/phosphor-icons/web), [Inter — SIL OFL 1.1](https://github.com/rsms/inter/blob/master/LICENSE.txt). A distribuição local exige conservar os avisos aplicáveis; não se deve modificar/renomear fontes sem verificar as condições da OFL e o nome reservado.

Não foram baixados bundles/fontes, acrescentados pacotes ou substituídos CDNs. Portanto, tamanhos finais, RAM, carregamento frio e compatibilidade da versão local ainda não foram medidos. Não é correto afirmar funcionamento offline integral nesta entrega.

Próximo passo proposto, sujeito a aprovação separada: identificar/pinar versões equivalentes às que funcionam hoje, copiar apenas os arquivos necessários e avisos de licença, validar o gráfico e todas as classes de ícones, executar regressões, depois testar cache vazio com a internet desligada. Não atualizar para a versão mais recente indiscriminadamente. Essa troca pode afetar renderização de gráficos, métricas de fonte e ícones; por isso permanece proposta, sem implementação automática. Não exige expor serviços na rede nem implementar a Fase 4.5.

## 7. Roteiro de validação manual

1. Use o ambiente local já preparado (`SIMULATE=true`, `DB_MODE=memory`, loopback), sem alterar `.env` ou banco para avaliar o layout. Execute `npm start` com suas credenciais existentes; não execute setup/reset/migrações. Abra `http://localhost:3000/login.html`, Ctrl+F5.
2. Faça uma passagem em cada uma das seis larguras e nos dois temas. Anote área, largura, tema e problema; não aprove o frontend apenas com os números dos testes.
3. Login: rótulos, entrada por teclado/Enter, mensagem incorreta sem tentativas repetidas que provoquem bloqueio, carregamento e login válido. Sem cadastro público ou credenciais padrão.
4. Visão Geral: quatro pontos da maquete, cinco boias, estado confirmado das três bombas, alertas e identificação SIMULAÇÃO. Confira unidades, valores nulos/sem dados e textos longos. Não é necessário acionar bombas para aprovar o visual.
5. Confira cartões de telemetria, gráfico, seu cabeçalho/CSV e controles adicionais da bomba 3. Todas as ações devem continuar legíveis; não use esta avaliação para investigar a pendência operacional da irrigação.
6. Menu: abrir/fechar por toque e teclado, Tab/Shift+Tab/Escape, seção ativa, notificações e status. Sem conteúdo crítico escondido por sobreposição. Cabeçalho deve permanecer confortável quando o menu está fechado.
7. Histórico: períodos, tabelas/detalhes, eventos locais versus ao vivo, ESTIMATIVA e CSV. Filtros e rascunhos devem permanecer ao alternar seções.
8. Configurações: campos em uma coluna no celular; cartões, horários, dias, vazões e cenários com rótulos/unidades. Abra perfil e calendário por teclado, faça o ciclo Tab e feche pelo controle existente; foco deve voltar ao acionador sem gravação adicional.
9. Assistente: confira Ollama/modelo e SIMULAÇÃO; faça uma pergunta curta, role para cima durante a geração, volte ao fim, copie e interrompa uma resposta. Alterne seções durante SSE. Não mude o limite de 256 tokens/modelo. Confira listas, código e fontes longas.
10. Em celular real, abra o teclado na pergunta, digite e faça rolagem. Enviar/Interromper e o campo devem continuar alcançáveis; feche/reabra o teclado, abra Conversas, feche com controle/backdrop/Escape quando disponível. Compare orientação retrato e paisagem. Emulação desktop não substitui essa verificação.
11. Administração: CLIENTE continua sem acesso; MASTER deve ter todas as ações nos cartões móveis, campos/modal de edição e confirmação de exclusão. Use somente contas temporárias em memória. Não exclua o último MASTER para testar layout.
12. Troca de senha/documentação: abrir, navegar por Tab, conferir claro/escuro, rolar se necessário e cancelar/fechar. Foco retorna ao acionador; não precisa mudar senha para avaliar. Ative movimento reduzido no sistema e confira que efeitos não continuam animando.
13. Confira zoom de 200%, nomes extensos, erros, listas vazias e notificações. Para avaliar offline, registre as dependências ausentes como pendência; o suporte integral ainda não foi implementado.
14. Saia pela ação existente e encerre com Ctrl+C. Dados em memória são temporários. Não abra rede/firewall nem conecte Arduino nesta avaliação.

## 8. Estado final da modernização e pendências

F-1 a F-5 e UI-3 receberam suas implementações anteriores; a F-6 consolida acabamento, controles, foco, legibilidade e comportamento de layout. A aprovação visual das etapas anteriores pelo usuário não certifica automaticamente as alterações transversais desta F-6.

Pendências: avaliação visual global nas seis larguras/dois temas; teclado virtual/dispositivos reais; gráfico e contraste composto; eventual distribuição local das dependências visuais; estabilidade de testes de tempo real já registrada na F-4; firmware ainda NÃO VALIDADO fisicamente.

A falha de acionamento da bomba responsável pela irrigação continua **pendência operacional não investigada/não corrigida**. Nenhuma alteração de lógica está autorizada por esta entrega.

Aguardar aprovação antes de qualquer nova fase, troca de dependências de maior risco ou alteração operacional. O frontend não está declarado definitivamente aprovado.
