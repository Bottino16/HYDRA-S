# Firmware SDA — Fase 1

**NÃO VALIDADO PARA USO REAL.** Compilação e emulação aprovam apenas os cenários de software descritos. Nenhum upload, conexão serial física ou acionamento de hardware foi realizado nesta fase. A aprovação física depende do usuário e do roteiro `docs/TESTE-FISICO-FASE-1.md`.

## Organização

- `sda/Config.h`: única configuração de pinos, polaridades, relés, limiares, tempos e geometria.
- `sda/Control.h`: máquina de estados C++ independente de Arduino e sem alocação dinâmica.
- `sda/Sensors.h`: debounce, mediana e conversão calibrada.
- `sda/Protocol.h`: envelope, checksum e parser fechado dos comandos.
- `sda/sda.ino`: aquisição assíncrona, saídas, watchdog, serial e buzzer no UNO R3/ATmega328P.
- `tests/`: matriz e cenários em C++, compilados com avr-g++ e executados no ATmega328P emulado por avr8js. O código de controle é o mesmo incluído pelo sketch.

Abra **sda/sda.ino**, selecione Arduino UNO (AVR Boards) e apenas compile até concluir a conferência elétrica. Não são necessárias bibliotecas adicionais de sensores ou JSON. O driver de DHT11 em D11 e ECHO em A1 (digital 15) usa PCINT do porto C; DHT usa PCINT do porto B do ATmega328P; esses pinos são conferidos por static_assert. Alterar esses dois pinos exige adaptar o driver, além de Config.h. ADC é dedicado a A0.

## Valores iniciais a conferir

| Item | Padrão |
| --- | --- |
| Partida após reset | todas OFF; retenção inicial 5 s e sensores válidos obrigatórios |
| Simultaneidade | **1**, máximo configurável 2 após medição elétrica |
| Intervalo global entre partidas | 2 s; no máximo uma partida por passagem do controle |
| Limite de ciclo bombas 1 / 2 / 3 | 120 / 120 / 60 s |
| Intervalo mínimo de cada bomba | 30 s após desligar, inclusive por falha ou troca de modo |
| Solo seco / úmido | 25% / 40%; faixa intermediária mantém histerese |
| Calibração ADC seco / molhado | 800 / 300, provisória |
| Caixa cheia / vazia (distância) | 30 / 200 mm, provisória |
| Debounce das boias | 80 ms; instabilidade prolongada invalida após 500 ms |
| Heartbeat | servidor a cada 2 s; MANUAL volta AUTO após 10 s sem comando válido |
| Telemetria | alvo de 1 Hz, com ACKs adicionais e possível pequeno atraso durante transmissão |
| Watchdog | 2 s; reset retorna à inicialização segura |

Todo comando manual respeita a segurança e o máximo de duração; uma solicitação negada não fica armada para executar depois. Comando aceito em fila pode executar quando houver vaga e intervalo: o ACK informa as saídas ainda desligadas. `pump ... off` cancela também a solicitação pendente. `setMode` cancela solicitações manuais e desliga as saídas antes de avaliar o novo modo; AUTO pode voltar a demandar água respeitando o intervalo mínimo.

A bomba 1 mantém enchimento entre mínimo e máximo do poço; a 2 mantém enchimento da caixa enquanto houver água acima do mínimo do poço; a 3 usa histerese do solo, mínimo da caixa, tempo máximo e intervalo mínimo. Prioridade de partidas alterna de forma circular. Em falha de DHT, todas são bloqueadas por escolha conservadora. Solo inválido bloqueia a 3; ultrassônico/caixa inválidos bloqueiam 2 e 3; poço contraditório bloqueia 1 e 2; rio ausente bloqueia a 1. Boias máximas ativas com mínimas inativas são contradição, nunca estado cheio válido.

Ultrassônico não substitui falha por distância plausível: timeout de 25 ms ou distância fora da geometria zera a janela e invalida a leitura. A mediana usa até cinco amostras válidas, exigindo três novas após falha. Há comparação conservadora entre boias da caixa e ultrassônico, com tolerância em Config.h. DHT usa bordas por interrupção, checksum e timeout; falha publica `null`, nunca um zero artificial. ADC é iniciado e consultado sem espera ocupada; solo usa média de oito amostras e rejeita extremos de desconexão.

No retorno ao AUTO por heartbeat, pedidos manuais são apagados e bombas ligadas são desligadas; a operação local pode reiniciar depois do intervalo seguro. Assim, cortar comunicação **não é parada de emergência**. Use o corte físico dos 12 V.

## Compilar e testar sem placa

```powershell
npm ci
npm run firmware:test
```

É preciso ter Arduino CLI e o core `arduino:avr` instalados (pelo Arduino IDE ou CLI). No Windows, os scripts procuram a instalação padrão do IDE e `Arduino15`. Para outra instalação, defina `ARDUINO_CLI` (executável) e `AVR_BIN` (pasta com avr-g++, avr-objcopy e avr-nm). Nenhum script de teste contém upload ou abertura de porta física.

`npm run firmware:test` executa a matriz C++, verifica paridade com o simulador JS, testa uma cópia temporária da configuração com simultaneidade 2 e compila/executa o sketch completo com ADC, GPIO, UART e sensores virtuais. `npm test` verifica protocolo, ACK, interface e regressões de autenticação. Consulte `docs/RELATORIO-FASE-1.md`.

## Limitações físicas que o software não resolve

Boias de dois fios não têm diagnóstico completo: contato preso e rompimento indistinguível de um estado válido podem passar despercebidos. Máximas foram configuradas para abrir em cheio: fio aberto simula cheio e bloqueia enchimento; isso não identifica a origem da falha. Sensor analógico flutuando pode produzir valor plausível: o roteiro exige polarização externa e calibração. Relé soldado, retorno de água/sifonagem, vazamento, sobrecorrente e ruído de alimentação exigem proteção elétrica/mecânica e ensaio real. Software não comprova que um contato de potência abriu: `pumps` informa a saída comandada do Arduino, não corrente ou vazão medida.
