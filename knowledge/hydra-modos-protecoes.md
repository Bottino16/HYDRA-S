# HYDRA-S: bomba desligada, modos AUTO e MANUAL e proteções

## Interpretar uma bomba desligada

Uma bomba desligada não significa necessariamente falta de água. No HYDRA-S, pode não existir pedido, o solo pode estar úmido, o destino cheio, haver sensor inválido, retenção de partida, intervalo entre ciclos ou limite de tempo. Sem estado recente e motivo confirmado, a causa é informação insuficiente; não diagnosticar pelo desligamento isolado.

## Modo automático local

Em AUTO, a bomba 1 inicia enchimento abaixo do mínimo do Poço e mantém a intenção até o máximo; a bomba 2 faz o equivalente para a Caixa se houver água no Poço. A bomba 3 inicia abaixo do limiar seco e deixa de irrigar ao atingir o úmido: histerese. Todas continuam sujeitas às travas, fila e sensores válidos.

## Modo manual e agendamento

Em MANUAL, a bomba atende pedidos explícitos, sem ignorar proteções. O backend muda para MANUAL antes de acionar individualmente; trocar modo desliga saídas e limpa pedidos. Sem heartbeat por 10 segundos, o controlador cancela pedidos manuais e volta a AUTO com travas; isso não garante permanecer desligado se AUTO encontrar demanda segura. Agendamento é do backend, não uma memória de horários no Arduino.

## Limites implementados, não validados fisicamente

Após inicialização há 5 segundos de retenção. O padrão é uma bomba simultânea, partidas espaçadas em 2 segundos, intervalo mínimo de 30 segundos por bomba e ciclo máximo de 120/120/60 segundos para bombas 1/2/3. Falha de DHT bloqueia todas; outras falhas bloqueiam as saídas dependentes. Os limiares locais iniciais seco/úmido são 25/40 na escala relativa, e o backend pode atualizá-los pelo perfil; não são ideais agronômicos universais.

## Fontes do projeto

- firmware/sda/Config.h: limites e limiares iniciais.
- firmware/sda/Control.h e src/pump-control.js: máquina de estados, histerese e heartbeat.
- src/services/device-service.js: prepareManual, thresholds e comandos.
- src/services/scheduler.js: reserva por ocorrência, perfil e bloqueios de agendamento.
