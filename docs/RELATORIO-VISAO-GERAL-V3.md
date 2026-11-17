# HYDRA-S Water Experience — auditoria V3

A captura e a inspeção de maquete.js/overview-v2.css confirmam quatro estruturas semelhantes com o mesmo corpo de reservatório, conectores pequenos e plantação reduzida a um ícone. Os estados já vêm da telemetria e os handlers de comando devem ser preservados. A V3 será restrita ao interior do circuito, suas bombas ilustradas e atalhos para os cartões existentes. Não redesenhar indicadores, login, gráfico ou outras seções.

Direção: cenário contínuo com Rio natural, Poço em corte subterrâneo, Caixa elevada e canteiros em perspectiva. Formas são ilustrações conceituais, não dimensões reais. Níveis/boias/saídas continuam dependendo dos dados recebidos; vegetação não indica saúde ou crescimento medido. Resultados e limitações serão acrescentados na entrega.

## Conceito e estrutura entregue

A cena contínua substitui quatro recipientes semelhantes por quatro ambientes distintos:

- Rio: margem natural e corpo de água irregular, com nível informado e a boia de presença preservados.
- Poço: seção ilustrativa do subsolo, estratos e armazenamento vertical em corte.
- Caixa: reservatório elevado com suporte estrutural ilustrativo e nível proporcional ao dado recebido.
- Plantação: canteiros em perspectiva, solo em camadas, doze plantas ilustradas e tubulação decorativa estática. Umidade em número e barra de escala relativa, separados do desenho agrícola. O desenho das plantas não muda conforme o valor do solo; não indica saúde ou crescimento reais.

Bombas deixam de ser etiquetas e recebem ilustração de motor, identificação, função, estado confirmado e link Ver controles. As conexões são estáticas e não indicam circulação medida. Em desktop, os ambientes têm proporções e alturas diferentes; no celular, a ordem é Rio, Bomba 1, Poço, Bomba 2, Caixa, Bomba 3 e Plantação.

## Contratos e apresentação de estados

A renderização continua em public/maquete.js, usando o evento estado_sistema e a consulta inicial existente /api/estado. Cinco IDs float-0 a float-4, circuit-level-0 a circuit-level-3 e pump-card-1 a pump-card-3 foram mantidos. Os valores visuais continuam derivados de números finitos de zero a cem e da validade da conexão. Zero é válido; ausência ou desconexão exibe Sem dados. Boias contraditórias e alertas existentes permanecem visíveis.

As novas saídas no percurso dependem da mesma telemetria dos cartões: Ligada · confirmada, Desligada · confirmada ou Sem dados. Um ACK aceito sem telemetria não altera o estado visual para ligada. Pedido pendente é apresentado separadamente por CSS ligado a aria-busy do cartão existente; erros oferecem Ver aviso nos controles, sem inventar o motivo. O motivo original continua no feedback do cartão. Essas mensagens representam o resultado/pedido local, não um novo diagnóstico do controlador.

Os atalhos são âncoras para cartões com tabindex=-1. Clique e Enter transferem foco para os controles sem executar POST, adicionar rota ou duplicar listeners de comando. CLIENTE continua sem autorização de acionamento, embora possa consultar os estados.

Comparação com a V2, normalizando somente CRLF/LF, confirmou que os trechos de handlers de ligar/desligar e de mudança AUTO/MANUAL são iguais. Backend, ACK, filas, limites, autenticação, banco e firmware não foram modificados. A única alteração em arthur.html é incluir water-experience.css. Indicadores superiores, gráfico, login, outras seções e seus estilos não foram redesenhados. A pendência L-2 permanece intacta.

## Arquivos

- public/maquete.js: cenários SVG locais, bombas ilustradas, estado no percurso, barra relativa do solo e destinos de foco.
- public/water-experience.css: estilos exclusivos do circuito, composição responsiva e movimento decorativo.
- public/arthur.html: inclusão do CSS.
- test/water-experience.test.js: três testes direcionados.
- docs/RELATORIO-VISAO-GERAL-V3.md: auditoria e relatório.

Sem dependências novas, vídeos, imagens pesadas ou requisições externas adicionais. Todo o cenário é SVG/CSS local; textos dinâmicos continuam com textContent, sem inserir telemetria como HTML.

## Animações

Ondas ambiente herdadas da V2 continuam dentro dos níveis recebidos, com transições de altura. Folhas oscilam decorativamente em aproximadamente 1,3 grau, sem depender da umidade. Plantas não crescem com a leitura nem mostram irrigação confirmada. Bombas têm transições suaves de cor/borda para estados confirmados, sem rotor girando ou partículas que sugiram vazão. Pedido pendente tem indicador separado e discreto.

prefers-reduced-motion desliga transições e animações do circuito; ao ocultar a seção, o movimento das folhas é pausado. Ausência de dados pausa o movimento decorativo das folhas e oculta o preenchimento de água. A geometria ilustrativa permanece para identificar os componentes, com rótulos explícitos de ausência. Não há novo timer ou loop de JavaScript para animar.

## Testes

Primeira bateria:
node --test --test-concurrency=1 test/water-experience.test.js test/overview-v2.test.js test/protocol.test.js test/ui-navigation.test.js test/settings-ui.test.js test/assistant-ui.test.js

31 aprovados, zero falhas, 17,86 segundos. Novos casos verificam quatro cenários, doze plantas independentes da leitura, cinco boias, zero/nulos, barra relativa, atalhos sem requisição operacional, cartões focáveis, estados mistos de bombas, desconexão, pedido pendente separado, ausência de partida presumida por resposta HTTP, erro seguro e CLIENTE somente leitura. A suíte anterior continua verificando protocolo, travas, ACK, gráfico e preservação de navegação/Assistente/Configurações.

Segunda bateria:
node --test --test-concurrency=1 test/auth.test.js test/device-api.test.js test/history-ui.test.js test/ui-polish.test.js test/access-ui.test.js test/login-experience.test.js

40 aprovados, incluindo subtestes, zero falhas, 34,79 segundos. Cobrem segurança, autenticação, autorização, comandos com ACK do simulador, histórico/CSV, acessibilidade existente e login aprovado. Casos usam memória/contas de teste; o fallback MySQL aponta deliberadamente à porta 1 e não grava no banco operacional.

Total: 71 aprovados, nenhuma falha. O ensaio inicial de 15 testes de protocolo/V2 está contido na primeira bateria e não foi somado novamente. Não foi executado npm test completo. git diff --check sem erros.

## Navegador e capturas

Prévia com backend real em instância efêmera loopback 127.0.0.1:3101, DB_MODE=memory, SIMULATE=true, clima offline e credenciais aleatórias de teste. Nenhuma conta da instalação foi alterada, nenhuma conexão física usada e nenhuma geração Ollama iniciada. A prévia e o arquivo de credenciais foram encerrados/removidos após a conferência.

Conferidas larguras 360, 390, 768, 1024, 1440 e 1920px, sem overflow horizontal nos pontos medidos. Temas claro e escuro avaliados em diferentes larguras, não em todas as combinações possíveis. A telemetria do simulador atualizou níveis e confirmou saídas no percurso. Em 390px, por exemplo, a Bomba 3 apareceu Ligada · confirmada durante um ciclo AUTO da simulação. Não foi enviado novo comando manual pelo navegador nesta etapa.

Atalho da Bomba 2 clicado: hash #pump-card-2 e foco pump-card-2. Atalho da Bomba 1 por Enter: hash #pump-card-1 e foco pump-card-1. Menu móvel e Escape permaneceram funcionais. Console sem erros registrados nas conferências.

Capturas locais não versionadas:
- .data/overview-v3-circuit.jpg: circuito final no desktop, tema escuro.
- .data/overview-v3-mobile.jpg: jornada vertical durante a conferência em 360px.

## Commits

- e46c5f6: diagnóstico e estrutura CSS isolada.
- b60c086: cena com ambientes distintos e bombas integradas.
- 160e1e1: estados/atalhos e testes determinísticos.
- Commit final: acabamento e este relatório; consultar git log -1.

## Limitações e avaliação manual

Sem benchmark de FPS/RAM/VRAM, avaliação formal WCAG, teclado virtual em aparelho físico ou ensaio com hardware. Movimento reduzido foi conferido nas regras CSS e testes, sem alterar preferências do Windows. Em navegadores antigos sem :has(), mensagens adicionais de pendência/aviso no percurso podem não aparecer; o feedback original nos cartões continua disponível. Dependências externas preexistentes do restante do painel permanecem fora desta entrega.

1. Com a instalação local em SIMULAÇÃO, iniciar npm start se necessário e entrar por http://localhost:3000/login.html.
2. Abrir Visão Geral e usar Ctrl+F5. Conferir Rio natural, Poço em corte, Caixa elevada e canteiros, sem mudança nos indicadores superiores.
3. Acompanhar valores e boias. Sem dados não deve ser confundido com desligada ou zero.
4. Usar Ver controles por clique e teclado. O atalho deve apenas navegar/focar, sem ligar bomba.
5. Nos controles existentes, em cenário seguro de simulação, observar pedido pendente, confirmação ou motivo de bloqueio. Nenhuma trava foi removida para facilitar o acionamento.
6. Alternar temas e avaliar celular/tablet. Confirmar que plantas e ondas são decorativas, não prova de vazão, saúde ou economia.
7. Com preferência de movimento reduzido no dispositivo, conferir cenário estático e controles disponíveis.

Exclusivamente SIMULAÇÃO; firmware NÃO VALIDADO fisicamente. L-2 e validação real da IA seguem pendentes. Nenhuma outra tela foi iniciada. Aguardar aprovação.
