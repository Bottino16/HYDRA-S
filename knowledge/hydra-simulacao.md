# HYDRA-S: simulação, água e medições reais

## O sistema está medindo água de verdade?

O HYDRA-S não está medindo água de verdade nesta etapa: opera exclusivamente em SIMULAÇÃO, sem Arduino. Leituras e estados das bombas vêm de um modelo de software. SIMULAÇÃO conectada significa dados simulados recentes, não hardware conectado. O firmware permanece NÃO VALIDADO fisicamente; valores simulados não validam uma instalação real.

## Cenários e desconexão

Os cenários implementados são normal, rio_seco, caixa_baixa, solo_seco e erro_dht. Alteram valores virtuais ou flag de falha; não reproduzem todos os defeitos de hardware. Pausar telemetria interrompe a recepção pelo backend, não necessariamente a evolução interna do simulador. Após vencer a atualização, aparece sem dados; não interpretar como último valor real nem como zero.

## Memória e limites do modelo

DB_MODE=memory é independente de SIMULATE: guarda contas, leituras e conversas em memória e perde esses registros ao reiniciar. Alguns ajustes e reservas de agendamento usam arquivos próprios; não afirmar que todos os dados somem. A simulação varia reservatórios e solo por taxas artificiais, sem provar vazão, corrente, absorção ou consumo reais. Ensaios físicos continuam pendentes.

## Fontes do projeto

- src/services/device-service.js: transporte simulado, source, simulationControl e receive pausado.
- src/simulated-board.js: tick e telemetry.
- src/config.js: simulate e dbMode independentes.
- src/db/operational-store.js e src/services/settings.js: reservas e configurações em arquivos.
