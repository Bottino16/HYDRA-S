# HYDRA-S: bomba solicitada, pendente, confirmada ou bloqueada

## Pedido não é confirmação

Bomba solicitada significa intenção enviada pelo usuário; pendente pode estar aguardando envio, ACK ou vaga de partida. ACK aceito não significa bomba ligada: o estado pumps pode continuar false enquanto aguarda limite simultâneo ou intervalo entre partidas. No HYDRA-S, só considerar saída ligada após ACK ou telemetria recente confirmar pumps true; em SIMULAÇÃO isso é estado simulado.

## Bloqueio e perda de confirmação

Um comando bloqueado apresenta motivo do controlador, como origem sem água, destino cheio, sensor inválido, solo já úmido ou intervalo entre ciclos. Timeout de ACK não comprova nem acionamento nem desligamento físico. Reinício e desconexão cancelam pendências; o servidor não reenvia automaticamente esses pedidos nem presume o estado. As travas continuam obrigatórias no manual.

## Saída elétrica não é fluxo medido

Bomba confirmada descreve a saída informada pelo controlador, não prova giro, água transferida ou relé funcionando fisicamente. O backend registra transições confirmadas; perda de comunicação pode deixar um acionamento incerto. Não há sensor de fluxo implementado que confirme entrega de água. O firmware permanece NÃO VALIDADO fisicamente.

## Fontes do projeto

- src/device-link.js: command, flush, receive ACK, timeout e reset.
- src/simulated-board.js: ACK aceita CAPACITY/START_GAP sem afirmar pumps true.
- src/services/device-service.js: transitions e contexto de comandos.
- src/db/operational-store.js: status iniciada, concluida, bloqueada e incerta.
