# Histórico e Eventos Premium V2 — HYDRA-S Analytics

Entrega: 17/11/2026. Somente Histórico e Eventos. SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.

## Diagnóstico e limites existentes

A tela era gerada por monitoring.js/history-view.js, com estilos history.css. Repetia títulos/descrições do cabeçalho, mantinha filtros e feedback dispersos, indicadores grandes e três módulos longos empilhados. A tabela móvel tinha pouca hierarquia; detalhes em uma coluna aumentavam a altura da linha inteira e deixavam espaços vazios nas demais colunas.

Contratos confirmados: consultas em `/api/leituras`, `/api/acionamentos`, `/api/eventos`, período máximo de 31 dias e `limit=100` por categoria. O CSV `/api/leituras.csv` exporta **leituras do período**, sem o limite visual de 100; não exporta acionamentos ou eventos. O consumo já era calculado apenas sobre volumes estimados disponíveis dos acionamentos carregados. Eventos consultados têm filtros locais; o feed ao vivo guarda os últimos 100 recebidos desde a abertura e é independente do período/filtros.

## Conceito visual e organização

HYDRA-S Analytics / Central de Monitoramento: azul profundo, ciano, superfícies discretas, indicadores compactos, ícones técnicos e hierarquia sem títulos repetidos. O título principal fica único, com descrição objetiva e fonte SIMULAÇÃO/estado da telemetria preservados. Legendas repetidas das tabelas permanecem acessíveis sem ocupar espaço visual.

Filtros ficam numa faixa de consulta com data/hora inicial/final, botão Consultar período, CSV, feedback e período. No desktop amplo, uma linha; em larguras intermediárias, duas colunas; no celular, uma coluna. Formatos, validações, parâmetros e limites foram preservados. O rótulo “Exportar histórico completo CSV” foi corrigido para “Exportar leituras do período · CSV”. O texto distingue período solicitado durante carregamento, período carregado após sucesso e consulta não concluída em erro; não apresenta um período como carregado antes da resposta válida.

Indicadores mostram contagens dos registros carregados e ÁGUA · ESTIMATIVA, sem representar totais absolutos do banco. Zero continua zero; consulta ainda não concluída/erro usa travessão e feedback; volume sem valores disponíveis continua Indisponível. A fórmula de soma e os critérios de disponibilidade não foram alterados. Carregamento e erro têm diferenciação visual e texto no feedback.

### Leituras e acionamentos

Três abas locais: Leituras, Acionamentos e Eventos. Mantêm os mesmos nós e registros ao alternar, sem consultas ou alteração de filtros. Tablist/tabpanel, aria-selected/controls/labelledby, Tab, setas, Home e End dão navegação acessível. Somente um painel é visível por vez.

Tabelas preservam IDs, unidades e campos recebidos. Data/hora traz identificação da fonte por registro. Leituras incluem solo, temperatura, umidade do ar, níveis, saídas e detalhes das boias/modo. Acionamentos mantêm bomba, resultado, origem, conta registrada quando disponível, confirmação, motivo e volume ESTIMATIVA. Nenhum estado ou conta foi inventado.

Detalhes abrem em linha própria com largura completa, movendo o mesmo dl, sem duplicar dados. O summary mantém aria-controls e o estado nativo de abertura. Uma proteção evita processar eventos de toggle atrasados quando uma nova consulta remove os registros antigos. Em celulares, linhas se tornam cartões; dados secundários continuam disponíveis em detalhes, e campos principais têm rótulos próprios.

### Eventos históricos e ao vivo

Eventos consultados usam linha do tempo, com data/hora, categoria, severidade existente, mensagem e fonte. Filtros por categoria/severidade continuam exclusivamente locais sobre os registros carregados. O feed ao vivo permanece em disclosure separado, com seu limite e escopo explícitos. Um indicador de recebidos fica visível junto às abas, inclusive quando Eventos não está ativo. Não é indicador de conexão nem quantidade total de eventos no banco.

## Arquivos

- `public/arthur.html`: cabeçalho do Histórico e inclusão da folha isolada.
- `public/history-premium-v2.css`: composição Analytics, tabelas/cartões, timeline, abas e responsividade, com seletores limitados à seção.
- `public/history-view.js`: abas, detalhes em linha própria, identificação de fontes e estados visuais.
- `public/monitoring.js`: somente apresentação do cabeçalho/filtros/CSV/período/feedback do Histórico.
- `test/history-ui.test.js`: testes direcionados de integridade e navegação.
- `docs/RELATORIO-HISTORICO-PREMIUM-V2.md`: este relatório.

A função de validação/parâmetros sdaHistoryQuery e todo o trecho de Configurações em monitoring.js foram comparados textualmente com a versão anterior e estão preservados. Backend/APIs, banco/migrações, autenticação/CSRF/permissões, firmware/protocolo, bombas/ACK/fila/travas, simulação, Ollama, Visão Geral, login, sidebar e Administração não foram alterados. Nenhuma dependência adicionada.

## Testes automatizados

Regressão: **71 aprovados, 0 falhas, 0 ignorados**, aproximadamente **51,42 segundos**, incluindo subtestes:

```powershell
node --test --test-concurrency=1 test/history-ui.test.js test/ui-navigation.test.js test/ui-polish.test.js test/assistant-ui.test.js test/settings-ui.test.js test/access-ui.test.js test/login-experience.test.js test/water-experience.test.js test/environment-v5.test.js test/auth.test.js test/device-api.test.js
```

Após o último ajuste defensivo de toggle, histórico repetido: **9 aprovados, 0 falhas**, aproximadamente 2,48 segundos. Não somar execuções repetidas ao total único.

Cinco testes anteriores mantidos: unidades/zero/nulos/XSS/conta/estimativa parcial; filtros locais e separação do tempo real; parâmetros/período/limites/CSV; consulta sem duplicação durante carregamento; indisponibilidade de telemetria sem impedir histórico. Quatro novos testes verificam:

1. Abas acessíveis, setas/Home/End, mesmos nós, detalhes/filtros preservados e eventos ao vivo recebidos em aba inativa, sem rede.
2. Zero, fontes SIMULAÇÃO/HARDWARE/desconhecida, rótulos móveis e estados loading/error/ready.
3. CSV corretamente identificado e período marcado carregado somente após sucesso; erro não mantém indicação falsa de período carregado.
4. Detalhes em linha própria com colspan correto, mesmo dl e recolhimento sem duplicação.

As demais suítes cobrem navegação/streaming simulado, sidebar V2, formulários, permissões, autenticação/CSRF/sockets, comandos confirmados e Análise Ambiental. Nenhum teste físico ou carregamento real do Ollama foi realizado. `git diff --check` passou, com apenas avisos de normalização LF/CRLF.

## Revisão visual e testes no navegador

Prévia isolada com banco em memória, SIMULAÇÃO e loopback 127.0.0.1:3101. Não houve acesso ao MySQL, alteração de .env ou carga de modelo. A simulação local existente gerou leituras, eventos e posteriormente acionamentos AUTO, exibidos sem inventar registros; nenhum comando manual de bomba foi enviado pela revisão.

Inspeções em **360, 390, 768, 1024, 1440 e 1920px**, com amostras dos temas claro/escuro. Sem overflow horizontal observado nas larguras medidas. Verificados:

- Tabelas amplas, cartões móveis e detalhes completos sem esticar uma única coluna.
- Tab/Home e alternância de abas, preservando detalhe aberto.
- Eventos históricos reais da simulação e chegada de eventos ao vivo separados.
- Acionamentos AUTO do simulador, origem/conta não registrada/volume indisponível coerentes com os dados.
- Download CSV pelo link existente.
- Consulta de período sem registros e recusa do período acima de 31 dias.
- Rótulo do período carregado, estados vazios e ausência de erros de console capturados.

Capturas locais não versionadas: `.data/history-v2-desktop.jpg`, `.data/history-v2-mobile.jpg`, `.data/history-v2-events.jpg`. Testes automatizados não substituem avaliação visual. Não foi feita matriz exaustiva de temas, dispositivos físicos, zoom ou leitores de tela. A validação dos estados de erro de API, consumo zero/parcial e conta registrada foi determinística, não um ensaio real de hardware.

Prévia Node PID 17340 encerrada após conferir a propriedade da porta. Ausência de listener confirmada e credencial efêmera removida. Outros serviços não foram encerrados.

## Commits

- `fd50bf5` — auditoria de contratos e composição.
- `44a3c69` — cabeçalho, consulta, indicadores e base visual.
- `9c0ac67` — organização dos registros em abas locais e fontes.
- `5450906` — detalhes responsivos, acabamento e testes.
- Relatório final em commit documental separado, identificável no histórico Git.

## Roteiro de avaliação manual

1. Inicie normalmente com SIMULATE=true (`npm start`), autentique, use Ctrl+F5 e abra Histórico e Eventos.
2. Confira título único, indicação de SIMULAÇÃO, filtros, indicadores compactos e limite de 100 por categoria. Registros carregados não devem ser interpretados como total do banco.
3. Consulte um período válido, depois um período sem dados. Teste início maior que fim e intervalo superior a 31 dias: as validações existentes devem recusar. Após erro, nenhum período deve ser apresentado como carregado.
4. Altere filtros: exportação deve exigir nova consulta conforme o comportamento existente. Use Exportar leituras do período · CSV e confira que o arquivo contém leituras, não eventos/acionamentos.
5. Alterne Leituras/Acionamentos/Eventos por clique e teclado (setas, Home, End). Abra detalhes, troque de aba e retorne: abertura e dados devem permanecer enquanto não houver nova consulta.
6. Em Eventos, altere categoria/severidade: somente a lista consultada deve ser filtrada. Confira o disclosure ao vivo e a identificação da fonte. Recebidos ao vivo não devem substituir o período consultado.
7. Confira consumo sempre ESTIMATIVA e disponibilidade parcial. Sem calibração/volume recebido, Indisponível é esperado; não configure vazões apenas para embelezar a tela.
8. Avalie os seis tamanhos e ambos os temas, especialmente campos/botões de 360px e detalhes dos cartões. Faça avaliação adicional em dispositivo físico, zoom e leitor de tela se disponível.
9. Navegue às outras seções para confirmar preservação dos rascunhos/conversas e do menu aprovado.

## Limitações e pendências

Aguardando aprovação visual. Não foram criados paginação, novos gráficos, filtros de backend ou novas exportações; limites existentes permanecem. Não há medições físicas de consumo nesta entrega. A validação física do firmware, a pendência L-2 e a validação real do Ollama continuam separadas. Nenhuma outra tela ou etapa foi iniciada. `docs/RELATORIO-IA-2E.md` permanece não rastreado e fora dos commits.
