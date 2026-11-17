# Visão Geral Premium V2 — auditoria inicial

Inspecionados public/maquete.js, dashboard.css, arthur.html, monitoring.js, ui-sections.js, ui-navigation.js e contratos dos testes de protocolo.

Problemas confirmados: reservatórios retangulares planos; grande quantidade de textos pequenos concorrentes nas boias; cartões de bombas com hierarquia pouco distinta; eixo X do gráfico sem quantidade máxima explícita de rótulos; quatro cartões de telemetria sem ressalvas locais sobre escala relativa. O circuito já respeita dados nulos e zero e não assume partida no clique. Esses contratos serão preservados.

Rolagem: desktop utiliza conteúdo e sidebar como painéis independentes; o corpo permanece fixo. A barra própria do menu é necessária quando a navegação excede a altura. Ajustes serão restritos à Visão Geral e não removerão itens nem o acesso por teclado. Mobile mantém rolagem natural e drawer existente.

Plano: estilos isolados em overview-v2.css; acabamento dos elementos existentes; indicador de nível continua baseado no número recebido, sem inferir vazão. Animação ambiente não significa circulação. Sem alterar comandos, validações, permissões, ACK, segurança, perfis, backend ou L-2. Exclusivamente SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.

Resultados e roteiro serão acrescentados ao concluir a implementação.

## Conceito e melhorias entregues

Central hídrica conectada, com hierarquia em cinco níveis: origem/situação da simulação, telemetria, circuito, bombas e monitoramento complementar. Mantidos IDs e contratos existentes. Azul profundo, ciano, superfícies com profundidade discreta, verde para estados confirmados e texto explícito em todos os estados.

- Reservatórios com acabamento cilíndrico, borda superior elíptica, níveis proporcionais e ondas CSS discretas apenas na superfície informada. Zero mantém nível zero; ausente/inválido não recebe nível inventado. O SVG de ondas legado foi ocultado para não desenhar água acima da superfície real. A plantação usa escala relativa separada, sem ondas de água ou alegação volumétrica.
- Cinco boias preservadas, agrupadas por reservatório. Contradição mínima inativa/máxima ativa destaca o reservatório correspondente, sem criar nova decisão de controle.
- Conexões identificam B1/B2/B3 e só destacam saída ligada quando a telemetria confirma. Sem partículas ou circulação que presumam vazão medida.
- Cartões com função, percurso, estado confirmado, duração e feedback separado. Mantidas requisições, confirmações, limites, validações, desabilitação para CLIENTE, modo, fila e ACK. Nenhuma mudança no trecho de execução dos handlers de comando.
- Telemetria com notas locais de escala relativa, temperatura ambiente, umidade do ar e ultrassônico. Dados ausentes ficam distintos de zero válido. O destaque de solo do perfil atual já existente foi preservado.
- Gráfico: máximo de seis rótulos X, sem rotação e sem remover pontos; todos os 60 pontos da amostra determinística são preservados. Pontos decorativos reduzidos, tooltip mantido, cores de eixos acompanham o tema e estado vazio explícito. Exportação CSV e período não mudaram.
- Clima offline permanece sem dados. O ícone de condição não aparece enquanto não houver dado climático; respostas e flags climáticas existentes continuam iguais. As ações existentes foram mantidas.
- Desktop mantém conteúdo e menu com rolagens independentes quando necessário; compactação e contenção se aplicam somente enquanto a Visão Geral está visível. Mobile preserva drawer, Escape e rolagem natural. Nenhuma função do menu foi removida.

## Arquivos modificados

- public/overview-v2.css: estilos isolados, responsividade, ondas e microinterações.
- public/maquete.js: composição visual, funções das bombas e atributos de apresentação derivados da telemetria.
- public/arthur.html: inclusão do CSS e apresentação do gráfico/clima; sem alteração nas regras operacionais.
- test/overview-v2.test.js: quatro testes direcionados.
- docs/RELATORIO-VISAO-GERAL-V2.md: auditoria e entrega.

Comparação com o commit anterior confirma ausência de mudanças em src/, firmware/ e arquivos do login aprovado. Sem alterações em backend, banco, autenticação, CSRF, permissões, IA, agendamento ou protocolo. A duração inicial de dois minutos do controle legado, pendência L-2, foi deliberadamente preservada.

## Animações e acessibilidade

Ondas ambiente leves por transform, transição de altura do nível, realce discreto de saída confirmada e indicador de comando aguardando resposta. Nada bloqueia interação aguardando animação. CSS respeita prefers-reduced-motion; atualizações do gráfico usam update('none'), e sua animação inicial respeita a preferência. Animações das ondas são pausadas quando a seção está oculta. Não há biblioteca nova ou temporizador adicional.

Alvos de toque, labels, foco visível, mensagens em português, estados desconhecidos e todos os avisos existentes mantidos. Não foi realizada auditoria formal WCAG nem alteração da preferência de movimento do Windows.

## Testes executados

1. node --test --test-concurrency=1 test/overview-v2.test.js test/protocol.test.js test/ui-navigation.test.js test/settings-ui.test.js test/assistant-ui.test.js

28 aprovados, zero falhas, 14,85 segundos. Verificam zero/ausentes/inválidos, cinco boias, contradição, desconexão, limites recebidos, payload de bomba, ausência de partida presumida pelo clique ou resposta HTTP, confirmação por telemetria, erro seguro, CLIENTE somente leitura, preservação dos 60 pontos, rótulos e gráfico vazio. Incluem protocolo/ACK/travas, navegação, rascunhos e Assistente com streaming simulado.

2. node --test --test-concurrency=1 test/auth.test.js test/device-api.test.js test/history-ui.test.js test/ui-polish.test.js test/access-ui.test.js test/login-experience.test.js

40 aprovados (incluindo subtestes), zero falhas, 33,13 segundos. Cobrem autenticação, 401/403, sessões, CSRF, sockets, API de bombas com ACK do simulador, histórico/CSV, acessibilidade existente, login e animações aprovadas. O teste de fallback MySQL usa deliberadamente a porta 1 e retorna à memória; sem migração ou gravação no MySQL da instalação.

Total nas duas baterias: 68 aprovados. Não executei npm test completo, ensaios físicos ou Ollama real. O primeiro ensaio de protocolo isolado (11 aprovados) está contido na primeira bateria e não foi somado novamente. git diff --check sem erros na versão final.

## Verificação visual real

Prévia autenticada em servidor efêmero na porta 3101, exclusivamente loopback, memória, SIMULAÇÃO e clima offline, com credenciais aleatórias temporárias. A instalação da porta 3000 e suas contas/configurações não foram utilizadas para esses ensaios. Capturas recebem atualizações reais do SimulatedBoard via backend e Socket.io, sem valores fictícios inseridos na tela. A prévia e seu arquivo temporário de credenciais foram encerrados/removidos após a conferência.

Conferidas larguras 360, 390, 768, 1024, 1440 e 1920px. Circuito vertical no celular, horizontal no tablet/desktop; sem overflow horizontal nos pontos medidos. Temas claro e escuro conferidos em diferentes tamanhos, não em todas as combinações possíveis. Menu móvel abriu e fechou com Escape. Gráfico real exibiu horários espaçados, clima permaneceu offline e dados do simulador mudaram durante a sessão. Console sem erros registrados nas conferências realizadas.

Uma tentativa de comando pelo navegador encontrou timeout da ferramenta ao interagir com o diálogo nativo de confirmação. Não foi possível conferir de forma confiável o ACK imediato por esse ensaio; ele permanece pendente manualmente. A aba foi recuperada por uma nova aba documentada para seguir a inspeção visual. Nenhuma proteção ou diálogo foi removido para contornar a limitação. Testes automatizados de comando/interface e ACK do simulador passaram conforme descrito acima.

Capturas locais ignoradas pelo Git: .data/overview-v2-desktop.jpg e .data/overview-v2-mobile.jpg. A captura mobile é ilustrativa de uma etapa intermediária da conferência; a desktop registra o acabamento final dos níveis.

## Commits

- e0fc569: auditoria e estrutura visual isolada.
- dd4b33e: circuito, reservatórios e boias.
- b1868c8: cartões de bombas e telemetria.
- 8e166b4: gráfico e monitoramento/clima.
- Commit final de acabamento/testes/relatório: consultar git log -1.

## Limitações e avaliação manual

Não há benchmark de FPS/RAM/VRAM, teste com teclado virtual de aparelho físico ou validação agronômica do modelo. Chart.js, fontes e ícones externos preexistentes continuam dependências da interface; o trabalho de servir tudo offline não foi executado nesta etapa. Não foi acrescentada dependência externa. A IA-2E continua parcialmente validada e a L-2 continua pendente.

1. Na instalação local já configurada em SIMULAÇÃO, executar npm start se necessário.
2. Entrar em http://localhost:3000/login.html, abrir Visão Geral e usar Ctrl+F5 para atualizar estilos.
3. Conferir os quatro valores, escala relativa, níveis e cinco boias em ambos os temas. Dado ausente deve aparecer sem dados, não zero.
4. Com MASTER, testar um comando curto no cenário apropriado e observar confirmação, espera ou mensagem de trava; a bomba não deve aparecer ligada antes do controlador. Permanecem válidos os bloqueios por solo úmido, ausência de água, tempo e cooldown. Não usar o valor inicial do controle legado como evidência de defeito novo: essa pendência pertence à L-2.
5. Conferir gráfico e tooltip com todos os dados, poucos rótulos e CSV existente; sem internet, clima deve permanecer offline.
6. Alternar entre Visão Geral, Histórico, Configurações e Assistente para conferir preservação do estado; não é necessário iniciar o Ollama para avaliar esta tela.
7. No celular físico, avaliar menu, rolagem, toque e teclado numérico; com movimento reduzido, ondas e transições devem parar.

Exclusivamente SIMULAÇÃO. Firmware NÃO VALIDADO fisicamente. Aguardar aprovação antes de modificar outra tela.
