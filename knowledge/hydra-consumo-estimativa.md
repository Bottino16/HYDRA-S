# HYDRA-S: consumo de água e vazão das bombas como ESTIMATIVA

## O que significa o consumo

Consumo de água no HYDRA-S é sempre ESTIMATIVA, não medição real. Para cada bomba, o volume estimado usa duração registrada em minutos multiplicada pela vazão configurada em L/min. Sem vazão configurada ou término confiável, o volume fica ausente, não zero medido. Na SIMULAÇÃO não comprova gasto de água físico.

## Vazão configurada não é medidor

Há três campos de vazão, um por bomba, positivos ou null para não calibrada. Um campo preenchido representa configuração, não prova calibração física. Mesmo com vazão informada, o rótulo permanece ESTIMATIVA: não há medidor de vazão na implementação. Pressão, instalação e fluxo físico não são confirmados por ACK.

## Transferência e consumo final

As bombas 1 e 2 transferem água entre reservatórios; a bomba 3 aplica à Plantação. Somar os volumes das três bombas pode contar a mesma água em etapas diferentes e não prova consumo líquido da cultura. O cálculo existente registra por acionamento, sem balanço hídrico físico validado. Dimensionamento e aferição reais permanecem pendentes.

## Fontes do projeto

- src/services/settings.js: vazoes_l_min, estimativa e calibração por bomba.
- src/db/operational-store.js: startAction e finishAction, volume apenas para status concluida.
- src/controllers/monitoring-controller.js: ações e configurações rotuladas ESTIMATIVA.
- src/simulated-board.js: percurso das três saídas, sem medidor físico.
