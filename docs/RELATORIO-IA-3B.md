# IA-3B — Continuação automática controlada

## Escopo e limites

Implementação exclusivamente do backend do Assistente do Solo, configuração de exemplo, instrução de continuação e testes. SIMULAÇÃO mantida; firmware NÃO VALIDADO fisicamente. Sem alterações em .env real, banco/esquema/migrações, bombas, permissões, autenticação, firmware, protocolo ou telas. Sem instalação, download de modelo ou provedor pago.

## Diagnóstico e escolha do orçamento

O Ollama recebe 256 tokens por geração (mínimo entre ASSISTANT_MAX_TOKENS=700 e OLLAMA_NUM_PREDICT=256 na instalação auditada). A rota possui adicionalmente min(maxTokens efetivo * 12, 12000) caracteres: 3072 nesta configuração. Caracteres não são tokens.

O teto de 3072 NÃO foi aumentado. Ele agora é explicitamente compartilhado por toda a cadeia, incluindo prefixos da aplicação e partes automáticas, e continua consumido em eventual pedido manual posterior. Não se geram três partes para depois descartar toda a resposta: cada trecho é aceito progressivamente até o teto. O trecho excedente é interrompido com output_cap, sem nova geração e sem habilitar continuação manual. Esse teto ainda pode impedir uma resposta longa de terminar; eliminá-lo não está autorizado. Uma proposta futura possível é um teto agregado de até 9216 caracteres para três gerações, preservando 3072 por geração e os 60 segundos totais; NÃO aplicada e dependente de autorização específica.

## Funcionamento

- Somente Ollama: stop encerra; length permite avaliar outra geração. output_cap, erro, timeout, cancelamento, memória crítica e desconexão não acionam retry.
- Até duas continuações adicionais, sequenciais. Uma única reserva global permanece ativa durante toda a cadeia; limpeza do iterador é aguardada antes de liberar concorrência.
- ASSISTANT_AUTO_CONTINUATIONS: padrão 2, valores 0–2. ASSISTANT_MAX_CONTINUATIONS: teto compartilhado automático/manual, padrão 2, valores 0–2. Prevalece o menor orçamento disponível. Zero permite manter o caminho manual para testes ou desativar continuações conforme o limite escolhido. Nenhuma variável foi escrita no .env real.
- Usa a pergunta original, regras obrigatórias, contexto da pergunta e evidências originais. Não realiza nova busca livre por fontes a cada parte. A montagem local preserva a margem de contexto e pode abreviar o trecho anterior de 512 até 96 caracteres; se o contexto obrigatório não couber, interrompe com motivo context.
- Instruções pedem continuação da frase, sem nova introdução/aviso de simulação. Uma sobreposição EXATA de até 512 caracteres, com no mínimo 24, é removida na junção. Não há promessa de detectar repetição semântica, paráfrase ou contradição do modelo 3B.
- O início da continuação pode ser brevemente retido para verificar a sobreposição. Após desambiguar, transmite deltas; a guarda de referências continua ativa. Referência pendente/incompleta não é publicada quando a cadeia falha.

## Timeout e memória

O relógio da rota não reinicia entre gerações: 60 segundos totais na configuração atual. O AbortController é compartilhado; o botão de interrupção/desconexão aborta toda a cadeia. O timeout interno de cada chamada ao Ollama não estende o prazo global.

A proteção crítica de 180 MiB dos scripts foi aplicada ao caminho do painel: verificação antes das gerações e a cada 200 ms, com interrupção por memória crítica. Não é uma exigência de 1536 MiB para usar o painel. Esse limite é uma proteção emergencial, não uma garantia contra paginação ou esgotamento de VRAM; quedas rápidas entre amostras continuam possíveis. Os critérios mais conservadores dos ensaios existentes não foram alterados.

## Cotas, histórico e SSE

Cada geração adicional insere um marcador de usuário no mecanismo existente, por isso consome uma mensagem nas cotas de hora/dia. A cota é verificada antes de cada continuação. Não há reinício de contagem ao alternar entre ação automática e manual.

Uma resposta lógica da cadeia automática é salva agregada em uma única mensagem de assistente, com parts (índice e motivo de cada geração), outputChars e continuationIndex nos metadados existentes. Falhas preservam o texto recebido como partial=true e canContinue=false. Sem migração ou modificação de código do banco. Persistência em MySQL real não foi exercitada; testes usam banco em memória.

Eventos: meta inicial único; generation com phase, continuationIndex e automatic; delta progressivo; done com parts, limited, stopReason, continuationLimitReached e reviewedText; review/error nos caminhos de interrupção. O frontend atual consome os deltas no mesmo cartão e ignora generation. Não foi implementado indicador visual novo nesta etapa.

Os marcadores automáticos ficam no histórico existente e podem aparecer na recuperação como mensagens Continuar resposta. Seu agrupamento/apresentação, a cópia conjunta de cadeias manuais antigas, refinamento dos avisos e progresso visual ficam para IA-3C, sem redesign.

## Testes e evidências

Comando da suíte final:

    node --test --test-concurrency=1 test/assistant-auto.test.js test/assistant-continuation.test.js test/assistant-references.test.js test/assistant-context.test.js test/assistant-ui.test.js test/assistant-continuation-ui.test.js test/assistant.test.js test/ollama.test.js

Resultado final: 60 testes aprovados, zero falhas, zero ignorados, em 64,83 segundos. Log local não versionado: .data/tests-ia3b-final.txt. Os 10 testes novos verificam stop, uma/duas continuações, limite compartilhado, teto de caracteres também entre pedidos manuais, sobreposição exata, timeout total, memória crítica inicial/durante geração, cancelamento HTTP real com provedor mock, exclusão de concorrência, cotas, isolamento, referências e prompt injection. A suíte anterior preserva streaming fragmentado, SSE, contexto, segurança e controles da interface com mocks.

A primeira execução ampliada encontrou uma falha no teste novo de cancelamento: a guarda de referências retinha a última palavra do fragmento, e o teste aguardava essa palavra antes de abortar. O caso foi corrigido para emitir uma fronteira completa de texto; cancelamento foi reexecutado com sucesso. Não se ocultou falha real do modelo.

Testes IA-1 e IA-2D.2 receberam somente autoContinuations:0 em suas fixtures. Justificativa: continuam verificando o contrato manual e a proveniência separadamente, sem consumir o orçamento no novo caminho automático. Não foram removidas asserções de segurança; testes novos exercitam o padrão automático.

Ensaio com Ollama real NÃO executado: aproximadamente 597 MiB de RAM livre durante as verificações, abaixo dos 1536 MiB de entrada do script IA-1. Não há validação de precisão agronômica, contradições, latência real, RAM/VRAM sob geração ou qualidade das continuações. Sem capturas ou validação visual de chat nesta etapa; nenhum arquivo frontend mudou.

## Arquivos

- src/assistant/routes.js: cadeia SSE, orçamento, deadline, RAM e motivos.
- src/assistant/service.js: contexto da continuação, cotas, contagem compartilhada e metadados.
- src/assistant/prompt.js: instrução de continuação sem reinício/repetições.
- src/config.js e .env.example: configuração opcional da quantidade automática, teto compartilhado até 2.
- test/assistant-auto.test.js: testes novos.
- test/assistant-continuation.test.js e test/assistant-references.test.js: fixtures manuais explícitas.
- Este relatório.

## Roteiro manual

1. Feche programas desnecessários e confira recursos; não contorne os limites do ensaio real. Reinicie normalmente o HYDRA-S com sua configuração local já existente, SIMULATE=true e Ollama local. Não é necessário editar o .env para ativar o padrão de duas continuações.
2. Entre no Assistente e confirme Ollama local / llama3.2:3b / SIMULAÇÃO.
3. Faça uma pergunta curta: uma resposta stop deve finalizar sem outra geração.
4. Pergunte por que calibrar o sensor capacitivo; para inspecionar o mecanismo, acompanhe generation no SSE da requisição /api/chat nas ferramentas do navegador. Uma resposta só continua se a geração realmente retornar length.
5. Confira que o texto aparece progressivamente. Interrompa uma geração e confirme que não reinicia; recupere o histórico e confira a parte preservada.
6. Caso apareça limite, diferencie length de output_cap em done. Ao esgotar duas continuações, não deve ser possível disparar outra pelo mesmo encadeamento. output_cap não permite continuação manual posterior.
7. Não force falta de RAM, desligue proteções ou acione bombas para testar o chat. Casos críticos já são simulados deterministicamente.

## Pendências

IA-3C: apresentação dos eventos de progresso, agrupamento dos marcadores/partes antigas, mensagens distintas para motivos e verificação visual de texto longo/cópia em desktop/tablet/celular. IA-3D: ensaio real supervisionado com memória suficiente, avaliando completude, agronomia, repetições, desempenho e responsividade. Qualquer ampliação do teto de caracteres requer aprovação separada. Nenhuma dessas etapas foi iniciada.

## Commits

Implementação e testes: 91774d4 — feat(assistant): adiciona continuação automática com orçamento compartilhado. Este relatório é registrado em commit separado de documentação.
