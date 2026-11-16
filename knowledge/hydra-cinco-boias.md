# HYDRA-S: cinco boias do Rio, Poço e Caixa

## Função das cinco boias

As cinco boias são, nesta ordem: Rio com água, Poço mínimo, Poço máximo, Caixa mínimo e Caixa máximo. A boia do Rio indica disponibilidade; as duas do Poço e as duas da Caixa indicam limiares de enchimento e disponibilidade. Não medem umidade do solo nem volume contínuo em litros.

## Posicionamento previsto e polaridade

No mapa do HYDRA-S, Rio usa D2; mínimo/máximo do Poço usam D3/D8; mínimo/máximo da Caixa usam D9/D10. Rio e mínimas fecham para GND com água (LOW ativo); máximas abrem ao atingir cheio (HIGH ativo). As cinco entradas usam INPUT_PULLUP. São posições funcionais previstas; alturas físicas e orientação real ainda precisam de conferência.

## Estados coerentes e limites de diagnóstico

Boia ativa é o estado lógico após a polaridade, não necessariamente HIGH. Máximo ativo com mínimo inativo é contraditório e bloqueia as bombas dependentes desse reservatório. Fio aberto na máxima pode parecer cheio; mínima desconectada pode parecer sem água. O circuito não distingue todas as falhas. Não considerar as flags de falha da simulação como diagnóstico elétrico comprovado.

## Fontes do projeto

- firmware/sda/Config.h: FLOAT_PINS e FLOAT_ACTIVE_LEVEL.
- firmware/sda/sda.ino: updateFloats e configuração INPUT_PULLUP.
- firmware/sda/Control.h: coerência de well/box e validade das boias.
- docs/PINOS-E-LIGACOES.md e docs/MATRIZ-BOIAS.md: mapa e combinações lógicas.
