# Relatório da Fase 1 — implementação e testes sem hardware

## Status

Implementação e testes de software concluídos. **Firmware NÃO validado para uso real.** Não houve upload, abertura de porta serial física, energização de relés/bombas, alteração do circuito ou teste hidráulico. O plano físico A/B/C/D deve ser executado e confirmado pelo usuário. Fase 2 não foi iniciada.

## Mudanças

- Firmware canônico em `firmware/sda/`, com configuração única, controle C++ separado, leitura assíncrona de ADC/DHT/ultrassônico, debounce, mediana e calibração. O sketch antigo inseguro foi aposentado; histórico preservado no Git.
- Inicialização OFF, retenção 5 s, proteção de origem/destino, contradições, validade/idade de sensores, limites 120/120/60 s e intervalos de 30 s. DHT inválido bloqueia todas por opção conservadora; outras falhas bloqueiam as bombas dependentes.
- Padrão conservador de uma bomba simultânea e 2 s entre partidas; variante de duas somente em teste virtual. Watchdog de 2 s para bloqueio do loop, sem substituir proteção elétrica.
- AUTO/MANUAL e retorno local ao AUTO após 10 s sem comunicação válida. Pedidos manuais são apagados na troca de modo/perda de supervisão; comandos negados não ficam armados.
- Protocolo JSON v1, contador uint32, soma de bytes, ACK/NACK, replay/ordem, buffer limitado e compatibilidade L/D/R preservada sem superar travas.
- Backend valida o mesmo protocolo na simulação e serial, envia um comando por vez, aguarda ACK e marca estado desconhecido se telemetria vence. Serial configurável, autodetecção conservadora e reconexão foram antecipadas exclusivamente para atender à integração exigida nesta fase.
- Simulação física compartilhada com três bombas, rio/poço/caixa, cinco boias, umidade, evaporação e variável de chuva. Não é uma validação elétrica/hidráulica.
- Painel complementar com três bombas, boias, modo, duração curta para bancada e estados confirmados; login, CSRF, autorização e testes anteriores mantidos. Nenhum redesenho offline foi executado.

## Resultados reproduzíveis

Ambiente: Windows, Node.js 20.20.2, Arduino AVR Boards 1.8.7, avr-g++ 7.3, alvo `arduino:avr:uno`, execução virtual via avr8js. MySQL 8.0.45 em instância temporária exclusiva na porta 3307; serviço MySQL80 existente preservado. Os scripts de firmware apenas compilam/emulam, sem comandos de upload ou acesso a porta física.

| Execução final | Resultado |
| --- | --- |
| `npm test`, com `SDA_TEST_MYSQL_PORT=3307` | **33 aprovados, zero falhas, zero ignorados** |
| Matriz C++: 32 combinações de boias × 32 máscaras de validade × 3 pedidos isolados | **3.072 cenários** |
| Controle C++: matriz + 25 cenários adicionais | **9.319 verificações, zero falhas** |
| Comparação C++ compilado × controle JS usado na simulação | **3.072 vetores iguais**, incluindo saídas, razões e alertas |
| Variante temporária com MAX_SIMULTANEOUS=2 | **6 verificações**, respeitando escalonamento e limite 2; produção continua 1 |
| Sketch completo com UART, ADC, GPIO, DHT e ultrassônico virtuais | **13 verificações**, 9,4 s virtuais, 9 estados e 4 ACKs válidos |
| Total de verificações em firmware emulado | **9.338**, sem falhas |
| Compilação UNO: flash | **14.044 / 32.256 bytes (43%)** |
| Compilação UNO: variáveis globais SRAM | **1.123 / 2.048 bytes (54%)**, 925 bytes disponíveis para pilha/locais |

Sem variável de banco de testes, `npm test` ignora somente a integração MySQL; isso não é apresentado como execução completa. `npm run firmware:test` precisa de CLI/core/avr-g++ conforme firmware/README.md. Os auxiliares foram nomeados `check-*` para não exigir compiladores no comando normal `npm test`.

### Cobertura do controle C++

Inicialização e retenção; todas as combinações relevantes de boias; máximas sem mínimas; máscaras de validade ausente; bloqueios por sensor; perda de origem; solo inválido; DHT inválido/vencido; ultrassônico inválido/contraditório; histerese do solo; memória de enchimento entre mínimo e máximo; duração máxima e intervalo mínimo das três bombas; fila; intervalo global; retorno AUTO por heartbeat; limiares inválidos; rollover de millis; debounce; mediana e descarte de valores/timeout; calibração; checksum e parser de comandos rejeitando duplicatas/campos extras.

### Cobertura do sketch completo

O binário real compilado inicia sem relés ativos; adquire ADC por operação assíncrona; calcula mediana de ecos por PCINT; recebe DHT11 virtual por bordas/checksum; publica `null` antes da leitura e depois da perda de sensor; processa heartbeat e mudança de modo; aceita comando seguro de B3 e confirma a saída no ACK; desliga ao perder a mínima; rejeita alteração de comando sem checksum novo. Todos os frames de saída são interpretados pelo decoder real do backend.

Esse teste revelou e corrigiu uma corrida na temporização DHT: a ISR podia escrever uma borda depois do micros() capturado pelo loop, gerando diferença unsigned aparente muito grande. A comparação passou a considerar a ordenação temporal e o teste com sinal válido/falha tornou-se regressão permanente.

A aplicação virtual não inclui bootloader físico, ruído elétrico, carga indutiva, tolerâncias mecânicas ou sensores reais. A leitura por interrupção ainda deve ser conferida sob alimentação/carga reais.

### Regressão backend/interface

Todos os testes originais `test/auth.test.js` e `test/database.test.js` foram executados sem alterações. Confirmados: anônimo 401; cliente em rota master 403; CSRF; senha fraca; logout/expiração/redefinição revogando sessão/socket; internos 404, inclusive firmware/documentos; CRUD/persistência/retenção MySQL; fallback; XSS tratado como texto; carregamento do dashboard. Novos testes cobrem formato/checksum/seq/rollover, descarte sem atualizar estado, NACK, timeout, reset, fila serial, heartbeat e falhas na simulação, ACK nas novas APIs, cancelamento e painel sem indicação otimista de bomba ligada.

## Suposições e pendências

1. Calibração ADC 800/300 e distâncias 30/200 mm são provisórias, não medidas da maquete. Calibrar com sensores instalados e copiar resultados para Config.h; mudanças por comando no Arduino são voláteis.
2. Máximas em NC (abrem em cheio) e mínimas/rio fechando com água precisam de conferência real. INPUT_PULLUP não detecta todo rompimento/contato travado. O resistor externo do solo auxilia a falha aberta, mas não diagnostica todo defeito.
3. Um relé desligado no software não comprova contato aberto ou fluxo zero. Corrente/vazão não são medidas. Relé soldado, sifonagem, vazamento e dimensionamento continuam físicos.
4. 12 V/3 A não é comprovação de capacidade de partida. Manter simultaneidade 1 até medir corrente e conferir fonte, fusível, cabos e diodos.
5. ECHO em D13 pode disputar o pino com LED/bootloader antes da aplicação. O diagrama registra proteção série e conferência obrigatória; eventual remapeamento/isolamento depende da avaliação real, sem alterar silenciosamente o mapa pedido.
6. A polarização das entradas dos relés precisa garantir OFF no bootloader/alta impedância. O sketch sozinho não controla essa etapa. A estabilidade de alimentação e o watchdog devem ser observados na bancada.
7. Percentuais de rio/poço existem apenas na simulação; boias reais fornecem estados discretos. O cartão legado em litros continua estimativa da demonstração antiga, não medição; o painel novo mostra caixa em porcentagem e boias separadas.
8. Perfil selecionado do primeiro master alimenta a histerese compartilhada; não existe arbitragem multiusuário/hardware por cliente nesta fase. Agendamentos acima do máximo do ciclo são recusados com alerta, sem truncamento.
9. Reconexão serial está implementada e falhas de transporte estão cobertas por testes da camada de protocolo; autodetecção, drivers USB, resets ao abrir porta e reconexão física ainda precisam de ensaio.
10. Offline/CDNs permanece para Fase 4. Store de sessão continua em memória/uma instância, como na Fase 0.5. IA, histórico consultável completo e auditoria operacional continuam nas fases posteriores.

Plano do usuário: `TESTE-FISICO-FASE-1.md`; pinos/diagrama: `PINOS-E-LIGACOES.md`; matriz: `MATRIZ-BOIAS.md`; protocolo: `PROTOCOLO-SERIAL-V1.md`. Nenhum item físico foi marcado como aprovado. Aguardar aprovação antes da Fase 2.
