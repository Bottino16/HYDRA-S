# Matriz das cinco boias
Condições: retenção terminada, MANUAL, solo seco válido, DHT válido, ultrassônico coerente com boias da caixa, nenhuma bomba/cooldown anterior. Cada coluna é um pedido INDIVIDUAL, não três partidas juntas. 1=ativa depois da polaridade; 0=inativa.
| Rio | Poço mín | Poço máx | Caixa mín | Caixa máx | Autoriza B1 | Autoriza B2 | Autoriza B3 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | não | não | não |
| 1 | 0 | 0 | 0 | 0 | sim | não | não |
| 0 | 1 | 0 | 0 | 0 | não | sim | não |
| 1 | 1 | 0 | 0 | 0 | sim | sim | não |
| 0 | 0 | 1 | 0 | 0 | não | não | não |
| 1 | 0 | 1 | 0 | 0 | não | não | não |
| 0 | 1 | 1 | 0 | 0 | não | sim | não |
| 1 | 1 | 1 | 0 | 0 | não | sim | não |
| 0 | 0 | 0 | 1 | 0 | não | não | sim |
| 1 | 0 | 0 | 1 | 0 | sim | não | sim |
| 0 | 1 | 0 | 1 | 0 | não | sim | sim |
| 1 | 1 | 0 | 1 | 0 | sim | sim | sim |
| 0 | 0 | 1 | 1 | 0 | não | não | sim |
| 1 | 0 | 1 | 1 | 0 | não | não | sim |
| 0 | 1 | 1 | 1 | 0 | não | sim | sim |
| 1 | 1 | 1 | 1 | 0 | não | sim | sim |
| 0 | 0 | 0 | 0 | 1 | não | não | não |
| 1 | 0 | 0 | 0 | 1 | sim | não | não |
| 0 | 1 | 0 | 0 | 1 | não | não | não |
| 1 | 1 | 0 | 0 | 1 | sim | não | não |
| 0 | 0 | 1 | 0 | 1 | não | não | não |
| 1 | 0 | 1 | 0 | 1 | não | não | não |
| 0 | 1 | 1 | 0 | 1 | não | não | não |
| 1 | 1 | 1 | 0 | 1 | não | não | não |
| 0 | 0 | 0 | 1 | 1 | não | não | sim |
| 1 | 0 | 0 | 1 | 1 | sim | não | sim |
| 0 | 1 | 0 | 1 | 1 | não | não | sim |
| 1 | 1 | 0 | 1 | 1 | sim | não | sim |
| 0 | 0 | 1 | 1 | 1 | não | não | sim |
| 1 | 0 | 1 | 1 | 1 | não | não | sim |
| 0 | 1 | 1 | 1 | 1 | não | não | sim |
| 1 | 1 | 1 | 1 | 1 | não | não | sim |

A suíte também cruza os 32 estados com 32 máscaras de validade e os três pedidos: 3.072 cenários. A flag de validade modela leitura ausente/instável; não implica que fios abertos sejam sempre diagnosticáveis no circuito real.
