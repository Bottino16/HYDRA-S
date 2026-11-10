# Protocolo serial SDA v1

9600 baud, 8N1, ASCII, uma linha terminada por LF (CRLF recebido também é permitido). Envelope canônico, sem espaços extras ou campos externos:

```text
{"v":1,"seq":N,"data":OBJETO,"checksum":SOMA}
```

`checksum` é a soma dos bytes ASCII de `1|N|` seguida pelos bytes exatos de OBJETO, módulo 65536. Não é CRC forte, autenticação ou proteção contra adulteração deliberada. Evita erros simples de transporte; sequências detectam repetição/ordem. O backend rejeita versão, tamanho, checksum, forma e tipos inválidos sem atualizar o último estado válido. Frames de estado acima de 512 bytes são descartados; comando no UNO cabe em 191 bytes mais terminador.

Use `require('./src/protocol').encode(seq, data)` para gerar a linha; não invente o checksum. O parser AVR é fechado e rejeita escapes, estruturas aninhadas, chaves duplicadas, desconhecidas ou campos incompatíveis com o comando. As chaves do objeto podem variar de ordem; o envelope deve manter a ordem mostrada.

## Estado e inicialização

O UNO emite `data={"type":"boot"}` com `seq=0` após reset; todos os pedidos pendentes no backend são cancelados e o estado vira desconhecido. O contador de emissão é compartilhado por estados e ACKs e incrementa por frame, com rollover uint32. O backend aceita apenas avanços na janela uint32; reboot é uma exceção explícita que nunca confirma bomba ligada. O contador de comandos é separado e também uint32. O UNO rejeita comandos repetidos/antigos; não faça retentativa automática de acionamento.

Um estado tem estes campos:

```json
{"type":"state","solo":20,"solo_bruto":700,"temperatura":29.5,"umidade_ar":68,"caixa":47,"boias":[true,true,false,true,false],"pumps":[false,false,false],"modo":"AUTO","alertas":0}
```

- `boias`: rio com água, poço mínimo, poço máximo, caixa mínimo, caixa máximo. `true` é estado lógico ativo, depois da polaridade e do debounce; `null` é inválido/ausente no modelo.
- `solo`, `temperatura`, `umidade_ar`, `caixa`: `null` se inválidos. `solo_bruto` é diagnóstico ADC para calibração; zero bruto pode ser uma leitura real de falha, mas nunca representa uma umidade válida automaticamente.
- `pumps`: estados das saídas 1, 2 e 3. Não são confirmação de vazão/contato mecânico.
- `caixa`: porcentagem estimada pela geometria do ultrassônico. Na simulação, `rio` e `poco` extras têm percentuais da física virtual; no equipamento real não há sensores contínuos nesses reservatórios, portanto tais percentuais não são inventados.
- `modo`: AUTO ou MANUAL.

Após 3,5 s sem estado válido, o backend publica `connected=false` e bombas `[null,null,null]`. Um frame corrompido não mantém a conexão artificialmente atualizada. Uma conexão TCP/Socket.io ativa não significa Arduino conectado.

## Comandos

| OBJETO em `data` | Regra |
| --- | --- |
| `{"cmd":"heartbeat"}` | Mantém supervisão; não aciona bombas |
| `{"cmd":"setMode","mode":"MANUAL"}` | Cancela pedidos e desliga saídas; entra no modo pedido |
| `{"cmd":"setMode","mode":"AUTO"}` | Cancela pedidos e desliga antes de reavaliar AUTO |
| `{"cmd":"pump","id":1,"on":true,"ms":4000}` | Apenas MANUAL; todas as travas continuam obrigatórias |
| `{"cmd":"pump","id":1,"on":false}` | Cancela pedido, inclusive na fila |
| `{"cmd":"setThresholds","dry":25,"wet":40}` | 1 ≤ dry < wet ≤ 100 |
| `{"cmd":"calibrate","dry":800,"wet":300}` | Apenas MANUAL e todas OFF; ADC entre 0 e 1023 e diferença > 50 |

Duração omitida ou zero usa o máximo do ciclo em Config.h. Duração maior é recusada, sem truncar silenciosamente. Limiar e calibração são voláteis no Arduino: após reset voltam ao arquivo de configuração. O backend reaplica o perfil selecionado; a calibração definitiva deve ser copiada para Config.h. Comandos válidos renovam o heartbeat; lixo/corrupção/replay não renovam.

ACK emitido **depois de avaliar travas e aplicar saídas**:

```json
{"type":"ack","cmd":123,"ok":true,"code":0,"pumps":[false,false,true],"modo":"MANUAL"}
```

`cmd` corresponde ao `seq` do comando, não ao contador de transmissão do Arduino. `ok=true` pode significar pedido aceito em fila, ainda com `pumps=false`. Só ACK/estado validado autoriza a interface a exibir ligado. Timeout de ACK de 2,5 s não presume sucesso nem repete o acionamento. O backend mantém uma fila limitada e transmite apenas um comando por vez, aguardando ACK para proteger o buffer do UNO.

| code | Significado |
| --- | --- |
| 0 | permitido/confirmado |
| 1 | retenção de partida após reset |
| 2 | origem sem água |
| 3 | destino cheio |
| 4 | sensor inválido/ausente/vencido/contraditório |
| 5 | intervalo mínimo entre ciclos |
| 6 | máximo de ciclo |
| 7 | aguardando vaga de simultaneidade |
| 8 | aguardando intervalo entre partidas |
| 9 | solo já úmido |
| 10 | sequência repetida/antiga |
| 11 | frame/parser/checksum inválido; cmd=0 quando não é possível confiar na sequência |
| 12 | parâmetro/modo inválido |

Máscara `alertas`: 1 rio seco; 2 poço baixo; 4 caixa baixa; 8 erro de sensor; 16 bloqueio; 32 heartbeat perdido; 64 limite de ciclo; 128 fila; 256 retenção inicial. Some os bits; não interprete como enum único.

Buzzer ativo por padrão: 1 pulso rio, 2 poço, 3 caixa, 4 sensor, 5 bloqueio/limite. Grupos repetem a cada 3 s; em simultaneidade a prioridade é sensor, bloqueio, rio, poço, caixa. Bloqueio de comando fica retido por 3 s para ser audível. Um buzzer passivo exige `BUZZER_ACTIVE=false`.

Compatibilidade local: bytes `L`, `D`, `R`, com ou sem LF, operam apenas a bomba 3 depois de entrar em MANUAL; L usa máximo configurado, R solicita 4 s, D desliga. Não passam por cima das travas. A integração profissional usa somente JSON e sequência/ACK; não use os caracteres antigos para validar o novo backend.
