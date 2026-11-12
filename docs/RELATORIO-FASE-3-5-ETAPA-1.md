# Fase 3.5 — Etapa 1: Ollama local

Data: 12/11/2026. Escopo: Assistente do Solo em **SIMULAÇÃO**, instância única. Firmware continua **NÃO VALIDADO fisicamente**.

## Entrega

O backend agora seleciona explicitamente `ollama`, `claude` ou `demo`. O adaptador Ollama usa `POST /api/chat` local, interpreta NDJSON incremental (inclusive UTF-8 dividido entre fragmentos) e entrega os mesmos eventos SSE autenticados `meta`, `delta`, `done` e `error` ao navegador. Não instala nem baixa modelos. Claude permanece disponível somente por seleção explícita; não há fallback para Claude ou demonstração.

O endpoint vem exclusivamente da configuração do servidor: HTTP em `127.0.0.1` ou `[::1]`; `localhost` é convertido para `127.0.0.1`. Credenciais, caminhos, parâmetros, hosts externos e redirecionamentos são recusados. Não há endpoint/modelo configurável pelo cliente. Configuração de host inválida falha na inicialização; modelo ausente, indisponibilidade, resposta inválida e timeout deixam o painel funcionando e apresentam erro claro no chat, sem erro bruto do provedor.

Cancelamento pelo navegador, encerramento da sessão e timeout abortam a chamada local; o leitor do streaming é cancelado/liberado. Saída vazia, JSON inválido, término ausente, modelo inesperado ou ferramentas na resposta são recusados. Respostas parciais ficam identificadas. Término do Ollama por limite de tokens passa a sinalizar resposta limitada na interface.

O status, cada resposta nova e o histórico novo identificam **Ollama local • llama3.2:3b**; SIMULAÇÃO permanece visível. Registros anteriores sem metadados do motor mantêm rótulo genérico, sem atribuir retroativamente um modelo.

## Segurança e orçamento

- Sessão, CSRF, cotas, autorização e isolamento por usuário continuam nos caminhos existentes; nenhum teste antigo teve expectativa alterada.
- O system prompt obrigatório é preservado inteiro. Pergunta sanitizada e contexto técnico atual também são preservados; dados vencidos continuam como “sem dados”.
- Janela padrão: 4.096 tokens; saída padrão: até 128 tokens, configurável entre 32 e 256. O menor entre esse valor e `ASSISTANT_MAX_TOKENS` é aplicado.
- Uma estimativa conservadora por bytes UTF-8 limita a entrada à janela menos saída e 256 de reserva. **Não é um tokenizador exato.** O template do modelo também consome contexto. Nenhuma instrução de segurança é cortada para caber; se necessário, a pergunta é recusada com orientação para encurtá-la.
- No máximo um trecho RAG de até 360 caracteres e até quatro mensagens anteriores, sempre dentro do orçamento. Histórico e documentos permanecem dados não confiáveis. Fontes mostradas correspondem aos trechos enviados.
- Existe uma geração global por processo; outra conta recebe 429 com aviso de ocupado, a própria conta recebe 409. **Não há fila**, nem controle entre múltiplos processos. Validar inicialmente com um usuário.
- `keep_alive: 0` descarrega o modelo depois de cada resposta: reduz memória residente, mas aumenta a latência da pergunta seguinte.
- O modelo não recebe ferramentas nem executa comandos. A sugestão determinística e sua aplicação manual continuam exatamente sob as autorizações/travas anteriores. Permissões de cliente/master não mudaram.

## Arquivos

| Arquivo | Finalidade |
|---|---|
| `src/assistant/ollama.js` | Adaptador local, validação de frames, abort e falhas sanitizadas |
| `src/assistant/local-context.js` | Orçamento conservador e seleção limitada de RAG/histórico |
| `src/config.js` | Seleção de provedor e opções locais validadas |
| `src/assistant/service.js` | Reuso de contexto/conversas, identidade e bloqueio global de concorrência |
| `src/assistant/routes.js` | Identidade no SSE, erros locais e sinalização de limite de saída |
| `server.js` | Informa ao assistente se a aplicação está em simulação |
| `public/assistant.js` | Rótulos seguros do provedor/modelo no status e mensagens |
| `.env.example` | Referência de configuração local; Claude preservado |
| `test/ollama.test.js` | Testes mock e interface DOM |
| `scripts/check-ollama-local.js` | Ensaio real explícito, efêmero, com recursos amostrados |
| `README.md`, este relatório e `TESTE-MANUAL-OLLAMA.md` | Ativação, evidências e limites |

Nenhuma dependência adicionada; usa `fetch` do Node existente. Não houve modificação de `.env` real, migração, firmware, protocolo, proteção de bomba, permissão ou firewall. Não foi iniciada a Fase 4.5.

## Testes automatizados

Comando: `npm test` (execução sequencial, mocks; nenhuma chave real).

Resultado final registrado após a execução: **64 aprovados, zero falhas, três ignorados; 67 testes no total**.

Os dez testes novos cobrem fragmentação NDJSON/UTF-8, término normal/por limite, conteúdo inválido/incompleto/vazio/modelo divergente/ferramentas, HTTP 404/500 e rede indisponível, timeout e abort/liberação do leitor, restrição de endpoint, orçamento/contexto obrigatório, SSE autenticado sem chave e sem fallback, bloqueio global e modo simulado, seleção explícita do ambiente e identificação/XSS na interface e histórico.

Os testes antigos continuam cobrindo autenticação/CSRF/logout/arquivos privados/sockets, isolamento e privacidade, RAG/prompt injection/XSS, sugestão e ACK/travas, monitoramento, histórico/CSV, agendamento, serial virtual e simulação das três bombas. Não foram alterados.

**Não executados:** três integrações MySQL, pois `SDA_TEST_MYSQL_PORT` não foi fornecido e não foi criado banco de ensaio nem executada migração. O serviço MySQL existente foi preservado. Não foi repetida a compilação/emulação C++ (`npm run firmware:test`), pois firmware está fora do escopo e inalterado; os testes Node pertinentes à Fase 1 foram executados. Nenhum ensaio físico, teste em celular/LAN, teste de carga ou chamada Claude foi realizado.

## Ensaio real controlado

Executado neste Windows com o Ollama já instalado (API `/api/version`: **0.40.16**), modelo já presente `llama3.2:3b` Q4_K_M. Listener antes/depois: **127.0.0.1:11434**. Nenhum programa instalado ou modelo baixado.

O script criou uma aplicação efêmera em memória, sessão/CSRF reais, controlador simulado e clima offline. Enviou uma única pergunta pelo backend: “Em uma frase curta, por que calibrar o sensor de umidade do solo?”. Configuração: contexto 4.096, saída 32 tokens, timeout 45 s. Não utilizou o banco persistente nem contas existentes.

| Evidência | Resultado |
|---|---|
| Tempo da requisição autenticada | **12.571 ms** (12,571 s) |
| HTTP | 200, `text/event-stream` |
| Metadados | `provider=ollama`, `model=llama3.2:3b`, `demo=false`, `fonte=SIMULAÇÃO` |
| Streaming | `meta`, aviso de dados simulados, 32 deltas de conteúdo real e `done` |
| Saída inicial do modelo | “Para calibrar o sensor de umidade do solo é importante garantir que ele esteja funcionando corretamente...” |
| Bombas | `suggestion=null`; nenhum comando solicitado |
| RAM livre amostrada | Inicial 855 MiB; mínimo observado **387 MiB**; final 1.132 MiB |
| VRAM usada amostrada | Inicial/final 0 MiB; máximo observado **2.377 / 4.096 MiB** |
| Utilização de GPU amostrada | Até 23% |
| `/api/ps` durante inferência | `size=2935666768`, `size_vram=2421120040`, contexto 4.096 |
| Após resposta | `/api/ps` sem modelo carregado (`keep_alive: 0`) |

O valor `size_vram / size` foi aproximadamente 82,5%; indica alocação/offload, não porcentagem de uso instantâneo da GPU. As amostras não garantem capturar o pico real. Não foram calculados tokens/s nem consumo total de CPU. O MySQL já estava em execução, mas o ensaio não exercitou consultas nele.

A saída terminou no limite reduzido de 32 tokens, ficando incompleta. O ensaio confirmou transporte/streaming real, **não qualidade agronômica nem desempenho sustentado**. O rótulo de resposta limitada foi acrescentado e testado por mock após observar esse comportamento; não se repetiu inferência só para essa alteração de interface. A recuperação RAG reutilizada selecionou `materia-organica.md` para essa pergunta; a precisão da busca simples segue limitada e não foi reformulada nesta etapa.

Dados brutos do ensaio ficaram em `.data/ollama-real-result.json` e a saída da suíte em `.data/tests-ollama.txt`, ambos ignorados pelo Git. O relatório registra as evidências necessárias sem credenciais.

## Limitações e pendências

Há pouca RAM disponível: fechar aplicativos desnecessários manualmente antes de ensaiar é recomendável. Não foi autorizado encerrar programas/serviços. Respostas padrão de 128 tokens, uso prolongado e vários usuários ainda precisam de avaliação; não aumentar contexto/concorrência agora. O descarregamento por resposta favorece memória em detrimento de velocidade. Janela de 2.048 é aceita pela configuração, mas pode recusar até perguntas curtas por não comportar as instruções obrigatórias; manter 4.096.

O isolamento do servidor Ollama depende também de sua configuração externa. Foi verificado loopback nesta máquina; o código não reconfigura o serviço. A aplicação recusa endereços externos. A escolha de um modelo local é configuração administrativa; não usar modelos remotos/cloud. A instância deve permanecer única.

Não há validação física, fila global, alteração de permissões, implantação comercial ou rede/QR. O próximo passo depende de aprovação após o roteiro manual de um usuário.

Referências oficiais consultadas: [API Chat](https://docs.ollama.com/api/chat) e [streaming NDJSON](https://docs.ollama.com/api/streaming). Usamos a API HTTP local sem SDK adicional.
