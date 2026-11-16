# HYDRA-S — IA-2C.1: conhecimento técnico verificado

## Entrega e limites de validação

Ampliada somente a base privada de conhecimento, com nove documentos curtos sobre o sistema. Nenhum algoritmo de recuperação, código de produção, configuração, banco, firmware, interface ou regra operacional foi alterado. Os sete documentos agronômicos anteriores e os fixtures históricos da IA-2B permanecem inalterados. O README recebeu apenas um índice dos novos documentos.

Operação exclusivamente em SIMULAÇÃO. Firmware NÃO VALIDADO fisicamente. Não foi carregado o Ollama, iniciado servidor real, executado ensaio físico, acessado MySQL nem medido desempenho do modelo. Recuperação determinística não valida correção das respostas reais do llama3.2:3b.

## Documentos criados

| Documento em knowledge/ | Conteúdo |
|---|---|
| hydra-percurso-bombas.md | Percurso completo e funções das bombas 1, 2 e 3; ausência de prova de fluxo físico. |
| hydra-cinco-boias.md | Ordem das boias, posições funcionais, polaridades, contradição e limites de diagnóstico elétrico. |
| hydra-caixa-solo.md | Independência de nível e solo, ausência de dados e impossibilidade de diagnosticar encharcamento pela caixa. |
| hydra-sensores-leituras.md | Capacitivo, DHT11, ultrassônico e boias; dados inválidos/vencidos e percentuais simulados extras. |
| hydra-modos-protecoes.md | Bomba desligada sem causa única, AUTO/MANUAL, heartbeat, histerese e limites de segurança. |
| hydra-comandos-confirmacao.md | Solicitação, pendência, ACK, bloqueio, estado incerto e confirmação de saída sem prova de água. |
| hydra-simulacao.md | Fonte artificial, cenários, pausa da recepção e diferença entre SIMULATE e DB_MODE=memory. |
| hydra-consumo-estimativa.md | Tempo × vazão configurada, ausência de medidor e risco de contar transferências como consumo final. |
| hydra-ia-sem-comandos.md | Modelo sem execução automática, sugestão determinística e confirmação humana na rota protegida. |

Todos têm título específico, seções curtas e fontes internas. O RAG exclui as seções de fontes da evidência explicativa. Nenhum documento passa de 4 KiB. Não foram acrescentadas recomendações agronômicas ou receitas de instalação como se já estivessem validadas.

## Informações confirmadas e origens inspecionadas

| Informação | Origem confirmada no repositório |
|---|---|
| B1 Rio → Poço; B2 Poço → Caixa; B3 Caixa → Plantação | src/simulated-board.js, tick; firmware/sda/Control.h, Control::step; docs/PINOS-E-LIGACOES.md. |
| Cinco boias: Rio, Poço mínimo/máximo, Caixa mínimo/máximo; D2/D3/D8/D9/D10; LOW/LOW/HIGH/LOW/HIGH ativos | firmware/sda/Config.h, FLOAT_PINS/FLOAT_ACTIVE_LEVEL; sda.ino, updateFloats; docs/MATRIZ-BOIAS.md. |
| Máximo ativo com mínimo inativo é contraditório; fio aberto não é sempre distinguível do estado lógico normal | firmware/sda/Control.h; docs/PINOS-E-LIGACOES.md, limites de diagnóstico. |
| Solo A0, DHT D11, TRIG A2/ECHO A1; mediana/timeout do ultrassônico; falhas sem valor plausível inventado | firmware/sda/Config.h, Sensors.h e sda.ino, updateSoil/updateDht/updateUltrasonic/telemetry. |
| Rio/Poço têm percentuais no simulador; firmware transmite boias, sem percentuais contínuos desses dois reservatórios | Comparação de telemetry em src/simulated-board.js e firmware/sda/sda.ino. |
| AUTO com memória de enchimento e histerese; MANUAL continua com travas; perda de heartbeat retorna a AUTO | firmware/sda/Control.h e src/pump-control.js; src/services/device-service.js, prepareManual/heartbeat/tick. |
| Padrões locais: retenção 5 s, heartbeat 10 s, uma bomba simultânea, partidas 2 s, descanso 30 s, máximos 120/120/60 s | firmware/sda/Config.h; não são validação elétrica nem limiares agronômicos universais. |
| Limiares secos/úmidos podem ser atualizados pelo backend/perfil; agendamento reserva ocorrência e respeita travas | src/services/device-service.js e src/services/scheduler.js. |
| ACK pode aceitar pedido em fila com pumps false; timeout não comprova estado físico | src/simulated-board.js, write; firmware/sda/sda.ino, commandLine; src/device-link.js, receive/flush/reset. |
| Saída confirmada gera registro; perda de comunicação/reinício pode deixar ação incerta | src/services/device-service.js, transitions; src/db/operational-store.js, startAction/finishAction/recoverActions. |
| Consumo permanece ESTIMATIVA: duração × vazão; sem vazão ou conclusão confiável, volume null | src/services/settings.js; src/db/operational-store.js, finishAction; src/controllers/monitoring-controller.js. |
| Pausa interrompe recepção, não o relógio/física do simulador; cenários normal/rio_seco/caixa_baixa/solo_seco/erro_dht | src/services/device-service.js, receive/simulationControl; src/simulated-board.js, tick. |
| Modo memória não elimina arquivos próprios de ajustes/reservas | src/config.js; src/services/settings.js; src/db/operational-store.js e src/services/occurrence-journal.js. |
| IA não executa texto como comando; Aplicar sugestão requer MASTER e confirmação, usa rota segura | src/assistant/prompt.js; service.js, suggestion; public/assistant.js, applyButton; src/routes/monitoring-routes.js. |

As declarações descrevem o comportamento implementado, não comprovam instalação física. Fontes por documento permitem conferir os arquivos sem depender de links externos.

## Recuperação no corpus completo

Resultados ordenados pelo algoritmo IA-2B inalterado. Só o primeiro documento é aproveitado pelo contexto local atual; demais candidatos podem ter pertinência parcial. Os tamanhos abaixo usam contexto sintético recente em SIMULAÇÃO, perfil Alface/45, leituras 35/28/60 e níveis 80/35/100; não são leituras reais do notebook nem medições da maquete.

| Pergunta | Documentos recuperados, em ordem | Caracteres do primeiro trecho após orçamento |
|---|---|---|
| Para que serve a bomba de irrigação? | `hydra-percurso-bombas.md`, `hydra-modos-protecoes.md`, `hydra-comandos-confirmacao.md` | 240 |
| Qual é a diferença entre o nível da caixa e a umidade do solo? | `hydra-caixa-solo.md`, `hydra-cinco-boias.md`, `hydra-percurso-bombas.md` | 240 |
| Como funcionam as cinco boias? | `hydra-cinco-boias.md`, `hydra-sensores-leituras.md`, `hydra-caixa-solo.md` | 312 |
| O HYDRA-S está medindo água de verdade? | `hydra-simulacao.md`, `hydra-consumo-estimativa.md`, `hydra-caixa-solo.md` | 293 |
| Uma bomba desligada significa necessariamente falta de água? | `hydra-modos-protecoes.md`, `hydra-ia-sem-comandos.md`, `hydra-consumo-estimativa.md` | 264 |
| A IA pode ligar a bomba automaticamente? | `hydra-ia-sem-comandos.md`, `hydra-comandos-confirmacao.md`, `hydra-consumo-estimativa.md` | 288 |
| Como funciona o HYDRA-S? | `hydra-percurso-bombas.md`, `hydra-caixa-solo.md`, `hydra-cinco-boias.md` | 264 |
| Qual é a umidade ideal para alface? | `irrigacao-culturas.md` | 288 |
| Por que calibrar um sensor capacitivo de umidade? | `sensor-capacitivo-calibracao.md` | 288 |
| Qual o pH do meu solo? | `ph-nutrientes.md` | 320 |

As seis perguntas obrigatórias priorizam o documento previsto, com conteúdo explicativo. Alface, calibração e pH continuam em primeiro lugar nas fontes anteriores. Posso regar?, irrigação específica de tomate e milho e consulta fora do tema sem correspondência continuam sem documentos nos testes.

### Para que serve a bomba de irrigação?

Documento prioritário: `hydra-percurso-bombas.md`. Evidência recuperada:

> O HYDRA-S funciona no percurso Rio → Poço → Caixa → Plantação. A bomba 1 transfere água do Rio para o Poço; a bomba 2 transfere do Poço para a Caixa; a bomba 3 é a bomba de irrigação, da Caixa para a Plantação. Isso é confirmado no controlador e na simulação, sem medição de fluxo que prove transferência física.

Trecho efetivamente retido no contexto sintético (240 caracteres; orçamento 3561/3584 na estimativa conservadora existente):

> O HYDRA-S funciona no percurso Rio → Poço → Caixa → Plantação. A bomba 1 transfere água do Rio para o Poço; a bomba 2 transfere do Poço para a Caixa; a bomba 3 é a bomba de irrigação, da Caixa para a Plantação. Isso é confirmado no controla

### Qual é a diferença entre o nível da caixa e a umidade do solo?

Documento prioritário: `hydra-caixa-solo.md`. Evidência recuperada:

> Caixa cheia não significa solo encharcado. Nível da Caixa é água no reservatório; umidade do solo vem de outra leitura. Solo seco não significa falta de água na Caixa: pode haver água armazenada sem irrigação. No HYDRA-S, dados simulados descrevem grandezas distintas, não medições físicas nem diagnóstico definitivo da plantação.

Trecho efetivamente retido no contexto sintético (240 caracteres; orçamento 3566/3584 na estimativa conservadora existente):

> Caixa cheia não significa solo encharcado. Nível da Caixa é água no reservatório; umidade do solo vem de outra leitura. Solo seco não significa falta de água na Caixa: pode haver água armazenada sem irrigação. No HYDRA-S, dados simulados de

### Como funcionam as cinco boias?

Documento prioritário: `hydra-cinco-boias.md`. Evidência recuperada:

> As cinco boias são, nesta ordem: Rio com água, Poço mínimo, Poço máximo, Caixa mínimo e Caixa máximo. A boia do Rio indica disponibilidade; as duas do Poço e as duas da Caixa indicam limiares de enchimento e disponibilidade. Não medem umidade do solo nem volume contínuo em litros.

Trecho efetivamente retido no contexto sintético (312 caracteres; orçamento 3571/3584 na estimativa conservadora existente):

> As cinco boias são, nesta ordem: Rio com água, Poço mínimo, Poço máximo, Caixa mínimo e Caixa máximo. A boia do Rio indica disponibilidade; as duas do Poço e as duas da Caixa indicam limiares de enchimento e disponibilidade. Não medem umidade do solo nem volume contínuo em litros.

No mapa do HYDRA-S, Rio usa D

### O HYDRA-S está medindo água de verdade?

Documento prioritário: `hydra-simulacao.md`. Evidência recuperada:

> O HYDRA-S não está medindo água de verdade nesta etapa: opera exclusivamente em SIMULAÇÃO, sem Arduino. Leituras e estados das bombas vêm de um modelo de software. SIMULAÇÃO conectada significa dados simulados recentes, não hardware conectado. O firmware permanece NÃO VALIDADO fisicamente; valores simulados não validam uma instalação real.

Trecho efetivamente retido no contexto sintético (293 caracteres; orçamento 3562/3584 na estimativa conservadora existente):

> O HYDRA-S não está medindo água de verdade nesta etapa: opera exclusivamente em SIMULAÇÃO, sem Arduino. Leituras e estados das bombas vêm de um modelo de software. SIMULAÇÃO conectada significa dados simulados recentes, não hardware conectado. O firmware permanece NÃO VALIDADO fisicamente; va

### Uma bomba desligada significa necessariamente falta de água?

Documento prioritário: `hydra-modos-protecoes.md`. Evidência recuperada:

> Uma bomba desligada não significa necessariamente falta de água. Sem estado recente e motivo confirmado, a causa é informação insuficiente. No HYDRA-S, pode não existir pedido, o solo pode estar úmido, o destino cheio, haver sensor inválido, retenção de partida, intervalo entre ciclos ou limite de tempo. Não diagnosticar pelo desligamento isolado.

Trecho efetivamente retido no contexto sintético (264 caracteres; orçamento 3572/3584 na estimativa conservadora existente):

> Uma bomba desligada não significa necessariamente falta de água. Sem estado recente e motivo confirmado, a causa é informação insuficiente. No HYDRA-S, pode não existir pedido, o solo pode estar úmido, o destino cheio, haver sensor inválido, retenção de partida, i

### A IA pode ligar a bomba automaticamente?

Documento prioritário: `hydra-ia-sem-comandos.md`. Evidência recuperada:

> A IA não pode ligar a bomba automaticamente no HYDRA-S. O Assistente explica e sugere; o texto gerado não é executado como comando. Não possui ferramenta de acionamento e não pode alterar travas. Cada pedido continua exigindo usuário autorizado, sessão, CSRF e confirmação pelo caminho operacional existente. A conversa não concede permissão.

Trecho efetivamente retido no contexto sintético (288 caracteres; orçamento 3566/3584 na estimativa conservadora existente):

> A IA não pode ligar a bomba automaticamente no HYDRA-S. O Assistente explica e sugere; o texto gerado não é executado como comando. Não possui ferramenta de acionamento e não pode alterar travas. Cada pedido continua exigindo usuário autorizado, sessão, CSRF e confirmação pelo caminho op

## Testes executados

- node --test test/knowledge.test.js test/knowledge-system.test.js: nove testes aprovados, zero falhas. Reexecutado após o refinamento documental final, que antecipa o reconhecimento de informação insuficiente sobre bomba desligada.
- npm test: 120 testes, 117 aprovados, zero falhas e três testes opcionais MySQL ignorados; duração 132,5 segundos. Nenhum acesso MySQL executado.
- A suíte completa verificou autenticação/CSRF/permissões, privacidade, prompt injection, streaming, timeout, cancelamento, continuação, isolamento, simulador, ACK/travas e regressões visuais automatizadas das etapas anteriores. Nenhuma validação visual ou física foi afirmada.
- git diff --check: sem erros. Diff desde o início restrito a knowledge/, test/ e este relatório; src/, firmware/, public/, configuração e banco sem alterações.

Os cinco testes novos também verificam tópicos ACK/AUTO/MANUAL/ESTIMATIVA/sensores, consistência com constantes e código, existência das fontes internas e compatibilidade com contexto recente e vencido. Para ambos os estados, a fonte continua SIMULAÇÃO; quando vencido, solo/níveis/bombas continuam sem dados. O orçamento permanece 4.096 de contexto, 256 de saída e reserva existente, sem alterar o timeout ou concorrência.

### Ajuste dos testes históricos da IA-2B

Somente os dois primeiros testes de test/knowledge.test.js agora usam uma cópia temporária dos sete documentos originais, identificados no baseline já existente. As mesmas 12 perguntas, todas as expectativas de IDs, ausências e variantes foram mantidas. O motivo é que o corpus ampliado passa legitimamente a responder HYDRA-S, caixa e bombas, antes sem fonte. A remoção temporária é limitada a diretório criado para o teste, com verificação de caminho.

O diff é conferível em git show 46c0c91 -- test/knowledge.test.js. Testes novos em test/knowledge-system.test.js usam todo o corpus e mantêm as regressões de alface/calibração/pH; portanto, não se usa apenas a coleção antiga para afirmar compatibilidade da base ampliada. O teste existente de orçamento também continua usando o corpus completo.

## Questões sem confirmação e limitações

- Modelo exato das bombas, corrente de partida/travamento, vazão física, pressões, capacidade em litros, alturas reais das boias e geometria aferida não foram confirmados nesta etapa. Valores provisórios/configurados não viram características físicas.
- A escala de solo não comprova umidade volumétrica; percentuais não são ideais universais nem prova de encharcamento.
- Saída/ACK não prova relé, motor ou fluxo reais; não há medidor de vazão implementado.
- Simulação não cobre toda falha de fiação, contato preso, ruído, comportamento hidráulico ou resposta do solo. O diagnóstico virtual de falhas não é supervisão elétrica comprovada.
- O primeiro trecho curto pode perder ressalvas posteriores. A tabela e os trechos acima mostram exatamente o que sobrevive no cenário sintético. Não houve alteração do corte em blocos de 24 caracteres nem do teto inicial de 360. Outros contextos/perguntas maiores podem reter menos evidência ou nenhuma.
- O RAG continua lexical: a pergunta exploratória Qual a capacidade física em litros do tanque? ainda priorizou umidade-capacidade-campo.md, uma correspondência inadequada por capacidade. Registrado, sem ajustar algoritmo não autorizado ou inventar capacidade. Os testes aprovados não significam cobertura de toda formulação possível.
- Documentação estática não informa estado atual. A montagem de contexto ainda não envia todos os detalhes de modo, boias e motivos individuais das travas; não se atribui causa concreta sem evidência recente.

## Pendências separadas

**IA-2C.2 — proposta para aprovação:** revisão/ampliação agronômica e referências correspondentes, perguntas adicionais/paráfrases e validação qualitativa real quando houver memória segura. Reavaliar lacunas de linguagem, sem confundir quantidade de documentos com precisão. A correspondência inadequada capacidade física/capacidade de campo exige avaliação e autorização própria se demandar mudança no recuperador.

**IA-2D:** corrigir conversão de null para zero em Number(profile.limite_umidade); melhorar preservação de evidência no contexto curto e citações, avaliar campos operacionais ausentes no contexto e truncamento em frases. Nada disso foi implementado.

Continuam pendentes os testes reais da IA-1 em memória suficiente e a validação física supervisionada do firmware. A falha de acionamento de irrigação anteriormente relatada permanece pendência operacional fora desta entrega.

## Arquivos alterados e commits

Nove novos knowledge/hydra-*.md; índice knowledge/README.md; adaptação histórica test/knowledge.test.js; novos test/knowledge-system.test.js e test/fixtures/rag-ia2c1-cases.json; este relatório. Nenhum arquivo de produção ou documento agronômico foi modificado.

- 46c0c91 — documentos técnicos, índice e isolamento do corpus histórico dos dois testes IA-2B.
- 7292c08 — testes do corpus completo e casos determinísticos.
- 2c2a49f — reconhecimento de informação insuficiente antecipado no trecho de bomba desligada e teste correspondente.
- Commit de relatório: consultar git log -1 após esta entrega.

## Como conferir sem carregar o Ollama

1. Na raiz do projeto, execute node --test test/knowledge.test.js test/knowledge-system.test.js.
2. Abra os nove documentos do índice em knowledge/README.md e confira as fontes internas.
3. Consulta isolada: node -e "console.log(new (require('./src/assistant/knowledge').Knowledge)('knowledge').search('A IA pode ligar a bomba automaticamente?'))".
4. Avalie os resultados e lacunas antes de autorizar qualquer próxima etapa. Nenhum servidor, modelo ou banco precisa ser iniciado para essa conferência.

Aguardando aprovação; IA-2C.2 e IA-2D não iniciadas.
