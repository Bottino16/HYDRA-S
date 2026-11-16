# IA-1 — Respostas, continuação manual e estabilidade

Data: 16/11/2026. Somente IA-1. SIMULAÇÃO; firmware NÃO VALIDADO fisicamente. F-6 preservada. IA-2 e Fase 4.5 não iniciadas.

## 1. Auditoria anterior às alterações

Configuração local inspecionada por lista permitida, sem exibir segredos: Ollama `llama3.2:3b`, contexto 4096, saída 256, timeout 60 s, teto geral 700, histórico até 6000 caracteres, banco em memória e SIMULATE=true. O endpoint confirmou o modelo já instalado; nada foi baixado.

### Causa confirmada e seus limites

O limite efetivo enviado ao modelo era `min(ASSISTANT_MAX_TOKENS, OLLAMA_NUM_PREDICT)`: **256**, não 700. O adaptador convertia `done_reason=length` em `limited=true`. A rota também interrompia após `min(maxTokens × 12, 12000)` caracteres, atualmente **3072**, incluindo o aviso inicial. Ambos os caminhos geravam a mesma mensagem visual. Não existia continuação.

Isso confirma no código/configuração por que uma geração podia terminar limitada e ficar sem caminho para completar. Sem registro do término das respostas antigas, não é possível atribuir retrospectivamente cada corte relatado ao limite de tokens ou à proteção de caracteres. Não há evidência para atribuí-los ao timeout. O ensaio real desta etapa foi abortado por memória antes de obter um término do modelo; não o classificamos como corte de tokens.

### Fluxos existentes preservados

- Ollama NDJSON validado e convertido em SSE `meta/delta/done/error`; nenhum redirecionamento, ferramenta ou endpoint escolhido pelo navegador.
- Timeout da rota e do transporte, abort por cancelamento/desconexão e verificação periódica da sessão.
- Uma geração Ollama por vez, sem fila. Cotas por usuário e histórico isolado.
- Conversas em linhas `user/assistant`, texto e **metadados JSON existentes**. Partes interrompidas eram salvas com `partial=true`; respostas limitadas eram salvas com `limited=true`, sem distinguir a razão.
- Orçamento local conservador por bytes UTF-8, não tokenizador exato: 4096 menos 256 de saída menos 256 de reserva = **3584** para entrada estimada. Contexto/pergunta/regras obrigatórias preservados; até uma fonte curta e histórico recente somente quando cabem. Histórico limitado a quatro mensagens no adaptador local, além do limite geral de caracteres.

Referência técnica oficial consultada: [API do Ollama](https://github.com/ollama/ollama/blob/main/docs/api.md), com `/api/chat`, streaming, opções do modelo e término. Não houve atualização de SDK, servidor ou modelo.

## 2. Implementação

### Respostas mais diretas

Instruções pedem objetividade, ausência de saudações/repetições e conclusão sem omitir ressalvas. Mantidas regras de privacidade, RAG, referências, dados não confiáveis, português, simulação e ausência de acionamento automático. Acrescentado lembrete explícito: caixa cheia não implica solo encharcado.

Nenhum documento do RAG foi modificado. A IA-2 não foi antecipada.

### Continuação manual

O botão **Continuar resposta** aparece em uma resposta Ollama encerrada por limite, quando ainda elegível. Cada clique usa o mesmo POST `/api/chat`, com corpo alternativo:

```json
{"conversaId":"UUID da própria conversa","continuarRespostaId":123}
```

O cliente não informa modelo, endpoint, instruções, limite de tokens, contador ou texto anterior. O backend recupera e valida os dados da própria conta. Somente a **última resposta** limitada, sem erro/timeout/cancelamento posterior ou nova pergunta, pode continuar. Pedidos repetidos de uma resposta já ultrapassada são recusados.

- Cada continuação é uma geração independente, explicitamente solicitada. Não há loop automático.
- Padrão: **duas continuações por resposta original**. `ASSISTANT_MAX_CONTINUATIONS` admite 0–3; zero desativa. Cotas de mensagens também são consumidas por cada tentativa aceita, inclusive se o provedor falhar depois.
- Contexto inclui pergunta original sanitizada, sensores/clima atuais e trecho final das partes anteriores como dados não confiáveis. O trecho começa com no máximo 512 caracteres e pode ser reduzido até 96 para caber. Histórico anterior fica explicitamente identificado como abreviado. Se as informações obrigatórias ainda não couberem, a requisição é recusada antes da geração; não se removem regras de segurança para forçar o encaixe.
- Uma nova linha de ação do usuário e outra de resposta conservam `continuationOf` e `continuationIndex` nos metadados existentes. A interface identifica a parte e liga à resposta original quando carregada.
- Não há migração, tabela/coluna nova, alteração de `chat-store.js` ou atualização destrutiva da resposta original. As partes são preservadas separadamente; copiar uma parte copia aquela parte, sem concatenar silenciosamente outras.
- Rascunho no campo não é apagado ao clicar Continuar. Streaming, cancelar, nova conversa e navegação continuam usando a arquitetura existente.
- Reabrir o histórico preserva texto, avisos e vínculos. Mensagens mais antigas continuam sujeitas à paginação existente; o vínculo textual permanece mesmo quando a parte original não estiver carregada.
- Não há execução de comandos por IA. Continuação não recebe uma nova sugestão acionável; o caminho de comandos e a lógica das bombas não foram modificados.

Erros/timeout/cancelamentos preservam o texto já recebido, mas não habilitam esse botão como se fossem limite de tokens. Nesse caso, o usuário pode revisar o parcial e fazer uma nova pergunta. Não há promessa de terminar todo assunto dentro das duas continuações: o limite é deliberadamente finito.

### Motivos de término

| `stopReason` persistido/enviado | Significado | Continuação elegível |
| --- | --- | --- |
| `stop` | Provedor concluiu normalmente | Não |
| `length` | Provedor informou limite de geração | Sim, dentro das demais condições |
| `output_cap` | Proteção de caracteres do backend | Sim, dentro das demais condições |
| `timeout` | Tempo esgotado | Não |
| `cancelled` | Cancelamento/desconexão/abort | Não |
| `error` | Falha, conteúdo inválido ou resposta vazia | Não |

Motivo terminal desconhecido do Ollama é rejeitado como resposta inválida; não vira sucesso. Um término legado sem campo de razão continua compatível com o contrato anterior. `done` agora inclui ID da mensagem, elegibilidade e vínculo. Metadados `partial/limited` continuam disponíveis. Uma terminação normal é um fato de transporte, não um atestado de correção agronômica ou completude semântica.

### Configuração

Mantidos na implantação local: `llama3.2:3b`, 4096, 256, 60 s, uma geração, loopback. `.env` não foi alterado. Padrão do código e `.env.example` alinhados a 256. `ASSISTANT_MAX_TOKENS` continua sendo teto adicional.

O validador permite até 384 somente para possibilitar o ensaio opt-in; isso **não seleciona 384 automaticamente**. `ASSISTANT_MAX_CONTINUATIONS=2` foi acrescentado ao exemplo; o valor padrão dispensa editar o `.env` existente para experimentar a funcionalidade.

## 3. Testes automatizados

Comandos usados:

```powershell
node --test --test-concurrency=1 test/ollama.test.js test/assistant.test.js
node --test --test-concurrency=1 test/assistant-continuation.test.js test/assistant-continuation-ui.test.js test/assistant-ui.test.js
node --test --test-concurrency=1 test/assistant-continuation.test.js test/assistant-continuation-ui.test.js test/ollama.test.js
node --test --test-concurrency=1
```

Resultados intermediários: 23/23 de compatibilidade inicial; 11/11 de continuação/UI/F-2; 34/34 direcionados; **21/21** na verificação final direcionada após alinhar os padrões. Incluem:

- Término normal, `length` e proteção de caracteres distintos; erro e timeout sem falso `limited`.
- Continuação explícita, nenhuma geração automática, limite por resposta, opção zero e cotas horárias.
- IDs antigos/repetidos, payload arbitrário, ausência de CSRF e acesso de outra conta recusados.
- Cancelamento HTTP durante continuação salva parcial vinculado e libera concorrência.
- Histórico preservado, vínculo original/partes, rascunho mantido e Markdown seguro.
- Dados anteriores como dados não confiáveis, nova leitura vencida como “sem dados”, sanitização e regras fixas presentes.
- As três perguntas obrigatórias e suas continuações cabem no orçamento com o contexto simulado dos testes. Isso não valida respostas reais do modelo.
- Configuração efêmera de 384 com mock, teto adicional e validação de valores excessivos, sem alterar a configuração local.

A primeira suíte completa passou com 109 testes: 106 aprovados, zero falhas, três integrações SQL opcionais ignoradas. Após os últimos ajustes de padrão e dois testes adicionais, a execução final passou com **111 testes: 108 aprovados, zero falhas e três integrações SQL opcionais ignoradas**, em aproximadamente 93 segundos. Saída em `.data/tests-ia1-final-all.txt`, ignorada pelo Git. Testes antigos não foram enfraquecidos ou removidos. As falhas temporárias de tempo real registradas na F-4 não reapareceram nesta execução.

## 4. Ensaios reais e métricas

| Ensaio | Resultado real | Métricas/limites |
| --- | --- | --- |
| Auditoria: alface, API Ollama direta, 256, prompt anterior | Abortado pela proteção de RAM, sem conclusão do modelo | 9064 ms; RAM livre inicial 1056 MiB, final 106 MiB. Não é timeout de 60 s ou término por tokens |
| Novo roteiro comparativo, 256 | Recusado antes da geração | 814 MiB livres; mínimo inicial do roteiro: 1536 MiB |
| Novo roteiro comparativo, 384 | Recusado antes da geração | 815 MiB livres; nenhuma resposta gerada |

Artefatos locais ignorados pelo Git: `.data/ia1-baseline.json`, `.data/ia1-real-256.json`, `.data/ia1-real-384.json`. Nenhuma repetição de geração foi forçada após detectar pressão de memória.

Não há comparação real de velocidade/qualidade 256 versus 384, pico de VRAM, tokens/s, tempo até primeiro token ou responsividade real do painel. Uma leitura posterior isolada de `nvidia-smi` informou 0/4096 MiB e 1% de utilização; é somente um instante **depois** do abort, não o pico durante a geração. Não houve teste visual no navegador nem comprovação do comportamento no teclado virtual.

`scripts/check-ia1-local.js` é um roteiro explícito, separado de `npm test`: usa somente Ollama local e banco em memória, credenciais efêmeras, diretórios temporários, timeout 60 s, uma geração por vez e as três perguntas obrigatórias. Mede duração, RAM livre, RSS do Node, amostras de VRAM/uso da GPU, `/api/ps` e uma consulta de estado durante a geração (latência da API, não teste de UI). Refusa iniciar abaixo de 1536 MiB e aborta se observar menos de 180 MiB durante a execução. Essas amostragens não garantem prevenir toda pressão de memória.

Não instala/baixa modelos, não usa MySQL real, não altera `.env`, não usa Claude/demo e não solicita continuação automaticamente. Cada rodada deve ser acompanhada por uma pessoa e não deve coincidir com outro usuário gerando no Ollama.

## 5. Precisão agronômica e pendências para IA-2

| Pergunta obrigatória | Critério de avaliação humana | Situação nesta etapa |
| --- | --- | --- |
| Qual é a umidade ideal para alface? | Não dar percentual universal do sensor; considerar calibração, solo, cultura e fase | Contexto/fluxo testados com mock; ensaio real abortado |
| Por que calibrar um sensor capacitivo de umidade? | Explicar escala relativa e influência do solo, sem confundir com teor volumétrico | Contexto/fluxo testados; resposta real não avaliada |
| Se minha caixa d'água está cheia, isso significa que minha plantação está encharcada? | Separar nível do reservatório do estado hídrico do solo | Regra explícita e fluxo testados; resposta real não avaliada |

A leitura dos documentos existentes de culturas/calibração/capacidade de campo já mostra ressalvas contra percentual universal e confusão entre escala relativa e umidade volumétrica. Nenhum erro agronômico de uma resposta real conclusiva foi identificado neste ensaio, porque não houve resposta real concluída para avaliar. **Isso não significa que o modelo esteja correto.**

Riscos ainda a investigar: generalização de percentuais, interpretação indevida de níveis, repetição/contradição entre partes e cobertura de ressalvas quando apenas um trecho curto do RAG cabe. Sem reformulação do RAG nesta etapa. Dados simulados não podem virar medições reais; dados ausentes devem continuar reconhecidos.

## 6. Arquivos e commits

- `src/assistant/service.js`: elegibilidade, contexto de continuação, cotas e metadados existentes.
- `src/assistant/routes.js`: distinção de término, persistência e campos SSE.
- `src/assistant/ollama.js`: recusa de motivos terminais desconhecidos.
- `src/assistant/prompt.js`: objetividade e regras de continuação/caixa versus solo.
- `src/config.js`, `.env.example`: padrão 256, comparativo até 384 e limite de continuações.
- `public/assistant.js`: botão, partes, avisos e preservação do rascunho; nenhum redesign/CSS alterado.
- `test/assistant-continuation.test.js`, `test/assistant-continuation-ui.test.js`: testes novos.
- `scripts/check-ia1-local.js`: comparação real opt-in com proteção de recursos.
- `docs/TESTE-MANUAL-OLLAMA.md`: instruções alinhadas a 256.
- Este relatório.

Commits: `f7c630b` (backend/metadados), `9ba0753` (interface), `7fb21b8` (testes/ensaio), `497682b` (padrões/contextos obrigatórios) e commit de documentação final.

Nenhum arquivo de banco, firmware, autenticação, permissões ou controle das bombas foi alterado.

## 7. Roteiro manual

1. Antes de gerar, confira RAM no Gerenciador de Tarefas. Com a pressão observada nesta sessão, libere memória fechando manualmente aplicativos desnecessários e aguarde estabilizar; não force gerações. Não instale outro modelo ou altere timeout/contexto para contornar a limitação.
2. Reinicie o backend local já configurado em SIMULAÇÃO/memória: Ctrl+C e `npm start`, usando suas credenciais existentes. Não execute migração/reset ou ajuste MySQL. Abra `http://localhost:3000/login.html`, entre e atualize com Ctrl+F5.
3. Em Assistente do Solo, confira Ollama local / `llama3.2:3b` / SIMULAÇÃO. Faça uma das três perguntas obrigatórias por vez. Revise o conteúdo segundo a tabela acima; término normal não prova precisão.
4. Se houver aviso de limite, clique **Continuar resposta** uma vez. Confira a nova parte vinculada, sem repetir toda a introdução. O rascunho no campo deve continuar intacto. Cada continuação exige novo clique, até duas por resposta no padrão. Não aumente tokens para forçar esse teste se a resposta terminar normalmente.
5. Interrompa uma geração com o controle existente. Confira texto parcial preservado e aviso de interrupção, sem classificá-la como limite de tokens. Timeout/falha também não deve disponibilizar continuação desse tipo. Reabra a conversa para conferir as partes e motivos registrados.
6. Alterne seções durante SSE e volte. Confira streaming, cópia por parte, aparência F-6 e histórico. Em outra conta existente, a conversa deve continuar invisível. Não envie comandos a bombas para testar o chat.
7. Se desejar configurar o teto, `ASSISTANT_MAX_CONTINUATIONS=2` é o padrão; 0 desativa e o máximo aceito é 3. Não é necessário editar o `.env` para usar o padrão. Qualquer edição manual fica fora do Git; reinicie após editar.
8. Para o comparativo, somente com memória estável e nenhum outro cliente gerando, escolha explicitamente uma rodada no PowerShell:

   ```powershell
   $env:SDA_TEST_IA1='true'
   try { node scripts/check-ia1-local.js --tokens=256 }
   finally { Remove-Item Env:SDA_TEST_IA1 -ErrorAction SilentlyContinue }
   ```

   Depois revise texto, motivo de término e recursos em `.data/ia1-real-256.json`. Somente se a primeira rodada for estável, execute separadamente o mesmo comando com `--tokens=384`. O script usa configuração efêmera; o `.env` permanece em 256. Saída 2 indica recusa por RAM; não diminua a proteção para obrigar o ensaio.
9. Compare durações, memória e correção/conclusão dos textos, sem considerar somente ausência de corte. Observe o painel manualmente; a consulta de estado do script não substitui essa avaliação. Registre repetições, percentuais indevidos, confusão caixa/solo e referências inventadas para a IA-2.
10. Encerre o servidor com Ctrl+C após sair. Dados do modo memória são temporários. Não exponha Ollama/MySQL à rede nem conecte Arduino.

## 8. Pendências

Validação real das três respostas e continuações com memória suficiente; comparação 256/384; desempenho/VRAM durante geração; conforto visual do novo botão em dispositivos reais. A limitação de contexto pode recusar uma continuação em contextos maiores, sem retirar segurança ou iniciar geração automática.

A pendência operacional da bomba de irrigação permanece sem investigação/correção; firmware continua NÃO VALIDADO. Nenhuma execução de IA-2 ou outra fase sem nova aprovação.
