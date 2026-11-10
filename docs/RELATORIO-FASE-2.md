# Relatório — Fase 2 (backend)

Data: 10/11/2026. Escopo: implementação e testes em **SIMULAÇÃO**; sem Arduino, upload, acionamento elétrico ou ensaio físico. Firmware **NÃO VALIDADO PARA USO REAL**. Ensaios A/B/C/D PAUSADOS. Fase 3 depende de aprovação do usuário.

## Mudança de pinos entregue antes do backend

O diff foi apresentado antes do primeiro commit desta fase. Commit separado **b60e523**:

```diff
- TRIG_PIN=12, ECHO_PIN=13
+ TRIG_PIN=16, ECHO_PIN=15
```

TRIG usa A2/PC2 (digital 16), ECHO A1/PC1/PCINT9 (digital 15). A aquisição ECHO mudou para `PCINT1_vect`/porto C; DHT11 continua em `PCINT0_vect`/porto B. D12/D13 ficam livres. Config.h, tabela/diagrama em PINOS-E-LIGACOES.md, README do firmware e teste do sketch foram atualizados. A emulação verifica expressamente D13 como entrada livre, A1 entrada e A2 saída.

Após esse commit, `git diff b60e523 -- firmware/sda scripts/check-sketch.js` permaneceu vazio: nenhuma lógica de segurança foi alterada no restante da Fase 2. Mantidos uma bomba simultânea, intervalo de partida 2 s, ciclos máximos 120/120/60 s e cooldown 30 s.

## Implementação

- Serial com porta `.env`, auto-detecção conservadora e reconexão após fechamento, erro de porta ou escrita. Mais de um dispositivo reconhecido deixa o sistema desconectado. O modo real nunca fabrica dados nem muda para simulação.
- `DATA_STALE_SECONDS` (padrão 5): ausência de frame válido torna sensores, boias e estados das bombas nulos. HTTP e telas mostram sem dados; comandos são bloqueados. ACK não renova a validade dos sensores. SIMULAÇÃO fica explícita no banner e painel operacional.
- Rotas/controller de monitoramento separados de serviços e acesso ao banco. Compatibilidade preservada para APIs e sockets anteriores; autenticação/CSRF/master continuam obrigatórios. Logs operacionais usam estrutura JSON sem corpos de requisição ou credenciais.
- Agendamento por perfil, dia e fuso configurável, sem teto fixo de 15%. O primeiro master ativo controla a automação compartilhada; agendas de cliente ficam isoladas e não acionam a maquete. O perfil agendado não precisa ser o selecionado. Um ciclo nunca excede o limite do firmware.
- Reserva anterior ao envio: diário exclusivo em disco com fsync e chave UNIQUE em `acionamentos`. Repetir tick, reiniciar no mesmo minuto ou perder o diário local com banco preservado não reenvia a ocorrência. Reserva indisponível bloqueia envio; erro/resultado incerto não dispara tentativa automática. Registros pendentes após reinício ficam incertos, com término físico desconhecido.
- Histórico de solo, temperatura, umidade do ar, níveis, três bombas, cinco boias, modo e origem da leitura. Retenção configurável, filtro ISO com fuso, paginação e CSV completo em lotes. O limite da API não trunca o CSV. Migrações aditivas preservam as sete tabelas e dados existentes.
- Eventos e alertas com tipo, severidade e mensagem persistidos no MySQL e emitidos em tempo real. Transições confirmadas criam/encerram acionamentos; desconexão não presume que a bomba desligou.
- Vazão por bomba configurável pela interface ou variáveis iniciais, persistida em arquivo privado. Volume = duração confirmada × vazão em L/min, apenas para ciclo concluído; permanece **ESTIMATIVA**. Sem calibração ou com término incerto, volume indisponível.
- Clima consultado apenas pelo backend, com chave privada opcional, cache, timeout, agrupamento de chamadas e intervalo após falha. Modo offline responde normalmente e não trava irrigação ou interface. Clima é informativo, não substitui segurança local.
- Controles de demonstração para pausar/retomar telemetria e testar solo seco, rio seco e falha DHT. Disponíveis somente para master em SIMULAÇÃO.

## Evidência dos testes

Comandos executados em PowerShell na raiz, MySQL de teste isolado em 127.0.0.1:3307:

```powershell
$env:SDA_TEST_MYSQL_PORT = '3307'
npm test
npm run firmware:test
```

Resultado final da suíte Node: **44 testes aprovados, 0 falhas, 0 ignorados** (33 anteriores e 11 novos). Os arquivos de testes antigos foram mantidos sem alterações. Integrações criaram bancos aleatórios exclusivos e os removeram ao final. O serviço MySQL80 existente não foi modificado.

| Verificação | Evidência / resultado |
| --- | --- |
| Anônimo / master / sessão | 401 nas APIs privadas, 403 para cliente nas rotas master; logout, expiração e redefinição invalidam sessão/socket; testes antigos passam |
| Arquivos internos / XSS / senha | 404 inclusive caminhos codificados; senha fraca recusada; login/CRUD escapam dados; novo feed de eventos trata HTML como texto |
| Protocolo e segurança | Checksum/versão/seq, repetição, NACK, timeout, fila, perda de heartbeat e ausência de estado presumido continuam aprovados |
| Serial virtual | Porta explícita, reconhecimento, ausência, ambiguidade, desconexão/erro, reconexão e descarte de linha grande; nenhum dispositivo real aberto |
| Sem Arduino | Ramo `SIMULATE=false` com transporte vazio injetado: página 200 após login, sensores nulos, bombas desconhecidas, comando 503; sem dados artificiais |
| Leituras vencidas | API retorna todos os sensores e bombas nulos; DOM limpa valores/barras e mantém SIMULAÇÃO explícita; retomar recupera estado recente |
| Agendamento por perfil | Solo 40% aceita perfil 55% e bloqueia 15%; dias/fuso, ausência de dados, duração insegura e NACK testados |
| Agendamento integrado | Simulador confirma bomba 3, com limite 55% do perfil não selecionado; único registro agendado e encerramento confirmado |
| Reinício no mesmo minuto | Não duplica envio em memória com diário preservado nem em MySQL; chave UNIQUE impede repetição mesmo sem diário local |
| Histórico completo | Campos/filtragem/paginação e CSV HTTP; banco exporta **1.101 leituras**, ultrapassando lote de 1.000; retenção remove leitura vencida |
| Persistência/migração | Schema anterior reconstituído migra sem perder usuário; eventos/acionamentos recuperados em nova instância; ciclo pendente marcado incerto |
| Água | Calibração privada recuperada; 2 L/min por 30 s = 1 L estimado; sem vazão e término incerto não recebem volume |
| Clima | Provedor virtual com cache, concorrência, falha assíncrona e síncrona; modo offline sem erro; chave não aparece no retorno |
| Duas sessões | Dois sockets independentes recebem seq/estado/evento iguais; dois navegadores DOM autenticados separadamente exibem os mesmos quatro cartões após atualização |

Firmware: **9.340 verificações aprovadas**, sendo 9.319 da matriz/25 cenários (3.072 combinações e vetores de paridade JS/C++), 6 da configuração alternativa de concorrência e 15 do sketch completo em ATmega328P emulado. Sketch: 14.150 bytes de flash (43%), 1.124 bytes de SRAM (54%), 924 livres. Emulação do sketch: 9,4 s virtuais, 9 frames de telemetria e 4 ACKs, sem hardware.

Os navegadores automatizados usam jsdom, Socket.io e HTTP reais locais, com Chart.js/canvas substituídos. Não equivalem a inspeção visual em Chrome/Edge. O ramo real sem porta usa double de transporte e o teste de reconexão usa porta virtual; não houve acesso a COM física. Clima externo foi testado com provedores virtuais, sem depender da internet ou usar credencial real.

## Como rodar e revisar

Siga **TESTE-MANUAL-FASE-2.md** para instalação do zero, configuração segura de `.env`, simulação sem banco ou com MySQL, duas sessões, falhas, histórico/CSV, calibração fictícia, agendamento e reinício. O README também foi atualizado. Não é necessário Arduino.

Principais variáveis novas: `DATA_STALE_SECONDS`, `SERIAL_RECONNECT_MS`, `SCHEDULE_TIMEZONE`, `SCHEDULE_JOURNAL_DIR`, `SETTINGS_FILE`, `FLOW_PUMP_1_L_MIN`/2/3, `WEATHER_OFFLINE`, `WEATHER_CACHE_SECONDS`, `WEATHER_TIMEOUT_MS`. Todas constam no `.env.example`; `SIMULATE=true` e `WEATHER_OFFLINE=true` são os padrões desta entrega.

## Limites e pendências

1. **Firmware NÃO VALIDADO; testes físicos PAUSADOS.** Conferir circuito/polaridades, fonte e corrente de partida, diodos, geometria, calibração de solo/ultrassônico/vazão e execução supervisionada A/B/C/D quando houver Arduino. Só o usuário pode confirmar essa validação.
2. Garantia de agendamento é de **no máximo um envio por ocorrência**, com preferência por bloquear/perder ocorrência diante de dúvida. Não promete execução física exatamente uma vez nem recupera horários passados. Proteção de partida, cooldown, água ou outro ciclo podem bloquear. ACK confirma saída lógica, não vazão/contato/corrente.
3. Preserve `.data/schedule-occurrences` com o banco. Remover ambos elimina a memória de deduplicação. Instância única local; coordenação distribuída e store persistente de sessões ficam fora deste escopo. Reinício exige novo login.
4. Persistência completa exige MySQL disponível. Em fallback/memória, a tela avisa; leituras (até 10.000), eventos (até 1.000) e acionamentos são temporários. Diário e vazões continuam em disco privado. Dados temporários não são mesclados automaticamente ao banco após reconexão.
5. Rio/poço têm percentuais contínuos apenas na simulação; sem sensores contínuos físicos, o firmware fornece boias e níveis contínuos nulos. Não inferir litros medidos. Configuração de vazão ainda precisa de calibração física.
6. Revisão visual manual em Chrome/Edge e provedor meteorológico externo permanecem no roteiro; nenhum teste elétrico foi realizado. Clima offline funciona, mas Chart.js, ícones e fontes ainda dependem de CDN/cache. Entrega totalmente offline planejada para **Fase 4**, sem executá-la agora.
7. Fase 3 (IA/conhecimento) **não iniciada**; aguarda aprovação. Credenciais antigas de serviços externos continuam exigindo revogação no provedor se ainda estiverem ativas.

## Commits por etapa

- `b60e523`: pinos/ISR, tabela, diagrama e testes (primeiro e separado).
- `f1b1e4c`: persistência, migrações, reservas e agendamento por perfil.
- `3f11f95`: serviços, APIs, telemetria vencida e clima pelo backend.
- `c668c66`: interface de simulação, sem dados, histórico/CSV e vazões.
- Commits seguintes: regressões automatizadas, ajuste de reconexão de escrita e documentação desta entrega.
