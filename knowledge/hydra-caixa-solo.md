# HYDRA-S: diferença entre nível da Caixa e umidade do solo nos reservatórios

## Grandezas independentes

Caixa cheia não significa solo encharcado. Nível da Caixa é água no reservatório; umidade do solo vem de outra leitura. Solo seco não significa falta de água na Caixa: pode haver água armazenada sem irrigação. No HYDRA-S, dados simulados descrevem grandezas distintas, não medições físicas nem diagnóstico definitivo da plantação.

## Leituras com finalidades diferentes

O ultrassônico estima o nível da Caixa por distância; as boias da Caixa indicam mínimo e máximo. O sensor capacitivo representa umidade relativa do solo. A Caixa pode estar cheia enquanto o solo permanece seco; inversamente, solo úmido não comprova reserva de água. Para avaliar encharcamento, faltam observação de drenagem, solo e calibração física.

## Ausência não é zero

Leitura ausente, vencida ou inválida significa sem dados; não autoriza concluir reservatório vazio ou solo seco. Sem leituras recentes e válidas do HYDRA-S, reconhecer informação insuficiente. Percentual de nível não é automaticamente litros; percentual do solo não é teor volumétrico nem faixa ideal universal.

## Fontes do projeto

- firmware/sda/sda.ino: updateSoil e updateUltrasonic são aquisições separadas.
- src/simulated-board.js: box e soil variam separadamente em tick.
- src/device-link.js: snapshot limpa leituras quando sem comunicação recente.
- src/assistant/context.js e src/assistant/prompt.js: sem dados, SIMULAÇÃO e distinção caixa/solo.
