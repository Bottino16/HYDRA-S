# Sensor capacitivo de umidade do solo e calibração

## Por que calibrar

Sensores capacitivos estimam água indiretamente por resposta dielétrica; precisam de calibração adequada ao solo. No HYDRA-S, seco e úmido criam escala relativa: isso não garante medição volumétrica nem capacidade de campo. Sem Arduino, apenas simulamos; valores provisórios não constituem calibração física.

## Referência e validação

Calibrar exige relacionar a resposta do sensor com um método independente em amostras representativas e diferentes estados de umidade. No estudo IRRIGAP, leituras elétricas foram comparadas com pesagens e volume conhecido de solo. Isso sustenta a necessidade de avaliação local, não uma equação universal para qualquer sensor capacitivo. Incerteza e representatividade precisam ser avaliadas com apoio técnico.

## O que o estudo não valida

O IRRIGAP estudado em solo franco-argiloso não é comprovação de desempenho do sensor da maquete. Os dois extremos da escala do HYDRA-S não comprovam linearidade física nem transformam a leitura em teor volumétrico. Não transferir coeficientes, profundidades ou percentuais do artigo para perfis de plantas. Sensor capacitivo não mede pH ou nutrientes; dados ausentes significam sem dados.

## Fontes de referência

- Costa, B.R.S.; Correia, J.S.; Bassoi, L.H. (2014), Embrapa/UNIVASF/UNESP — Calibração do sensor de capacitância IRRIGAP para medida da umidade em solo de textura franco argilosa. Texto original, resumo e Materiais e Métodos: princípio indireto, comparação com referência e ajuste local. https://www.alice.cnptia.embrapa.br/bitstream/doc/1004787/1/Bassoi2014.pdf
- Registro bibliográfico: https://www.alice.cnptia.embrapa.br/handle/doc/1004787?locale=pt_BR
- HYDRA-S: firmware/sda/Sensors.h, soilPercent; Config.h, pontos provisórios; src/simulated-board.js. Não há validação física por esses arquivos.

Referências consultadas em 16/11/2026. Métodos laboratoriais exigem orientação; não são instruções de ensaio físico do HYDRA-S.
