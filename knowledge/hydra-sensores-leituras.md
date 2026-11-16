# HYDRA-S: sensores disponíveis, leituras inválidas e sem dados

## Finalidade de cada sensor

O HYDRA-S prevê sensor capacitivo de solo, DHT11 de temperatura e umidade do ar, ultrassônico de nível da caixa e cinco boias discretas. Cada sensor tem finalidade diferente. Sensor de solo não mede pH nem nutrientes; DHT11 não mede umidade do solo. Na SIMULAÇÃO, as leituras são geradas por software, sem medição física.

## Limitações das leituras

O sensor de solo usa A0 e escala relativa entre pontos seco/úmido provisórios; não prova teor volumétrico. O DHT11 usa D11 e envia null na falha, não zero. Ultrassônico usa TRIG A2 e ECHO A1, mediana de até cinco leituras, no mínimo três válidas e timeout. Geometria e pontos de referência ainda não foram validados na maquete.

## Dados ausentes, vencidos e inválidos

Sem atualização recente, o backend apresenta sem dados, incluindo estado desconhecido das bombas. DATA_STALE_SECONDS tem padrão de 5 segundos, configurável. Há prazos próprios de validade no controlador. Uma amostra inválida não é substituída por um valor plausível. A simulação não reproduz toda a física de ruído, contato, temperatura ou instalação.

## Níveis do Rio e do Poço

Na telemetria simulada existem percentuais contínuos de Rio e Poço. O firmware atual transmite suas boias, mas não percentuais contínuos desses dois reservatórios. Não afirmar que há sensores ultrassônicos extras nesses locais nem converter boia em porcentagem real. Sem dados confirmados, informar a limitação.

## Fontes do projeto

- firmware/sda/Config.h, Sensors.h e sda.ino: pinos, aquisição, mediana, timeouts e telemetria.
- src/simulated-board.js: telemetry gera temperatura 29,5 °C e umidade do ar 68% quando válidas, valores de demonstração.
- src/device-link.js: snapshot; src/config.js: dataStaleMs.
