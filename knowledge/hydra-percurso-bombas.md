# Como funciona o HYDRA-S: bombas de irrigação, Rio → Poço → Caixa → Plantação

## Função confirmada de cada bomba

O HYDRA-S funciona no percurso Rio → Poço → Caixa → Plantação. A bomba 1 transfere água do Rio para o Poço; a bomba 2 transfere do Poço para a Caixa; a bomba 3 é a bomba de irrigação, da Caixa para a Plantação. Isso é confirmado no controlador e na simulação, sem medição de fluxo que prove transferência física.

## Origem e destino

Rio, Poço e Caixa são reservatórios representados na maquete. A bomba 1 exige água no Rio e respeita o máximo do Poço. A bomba 2 exige o mínimo do Poço e respeita o máximo da Caixa e o ultrassônico. A bomba 3 exige o mínimo da Caixa, ultrassônico e solo válidos, além das demais proteções. Não se deduz a vazão real pelo nome da bomba.

## Limitação física

O HYDRA-S permanece em SIMULAÇÃO, sem Arduino disponível e com firmware NÃO VALIDADO fisicamente. Os nomes Rio e Poço descrevem o percurso do projeto; não confirmam captação em rio natural, perfuração, capacidade em litros ou desempenho elétrico/hidráulico. Ensaios físicos supervisionados são pendentes, não funcionalidades já validadas.

## Fontes do projeto

- src/simulated-board.js: tick altera os reservatórios e o solo conforme pumps[0..2].
- firmware/sda/Control.h: Control::step, origens e destinos das três saídas.
- docs/PINOS-E-LIGACOES.md: D7 bomba 1, D5 bomba 2, D4 bomba 3; circuito não validado.
