# Plano de teste físico supervisionado — SDA

**STATUS: PENDENTE. Firmware NÃO aprovado para uso real.** Este documento é um roteiro para execução pelo usuário com o orientador/supervisor. Os resultados abaixo não foram preenchidos pelo agente. Não avance de etapa quando houver divergência.

## Regras de parada e preparação

Tenha o corte físico dos **12 V das bombas** ao alcance. Desligue essa fonte imediatamente se: qualquer bomba ligar inesperadamente; funcionar sem estar submersa; não parar ao perder a boia mínima/origem; reservatório transbordar; houver vazamento, aquecimento, odor, ruído anormal, reinícios, relé tremendo, fios soltos, corrente acima do dimensionado ou divergência entre LED/relé/painel e o comportamento real. Corte a alimentação lógica também em indício de curto/aquecimento nela. Não confie em logout, botão de software, parada do servidor ou perda do USB como emergência. Um relé soldado exige corte da fonte.

Antes de mudar fios, desligue as alimentações envolvidas. Não manuseie rede elétrica do adaptador. Não teste proteção a seco realmente secando uma bomba: simule a boia baixa enquanto a bomba continua submersa. Ajuste posição das boias antes da operação para que exista margem de água acima da sucção.

Conferir e registrar antes da etapa A:

- Modelo exato do UNO R3, módulo de relé 5 V ativo LOW, sensores e bombas.
- Pinos, NO/COM, diodos, fusível, bitola, isolamento de lógica e fixação conforme `PINOS-E-LIGACOES.md`.
- Correntes nominais e de partida/travamento das bombas e corrente de bobinas; adequação da fonte 12 V/3 A. Até comprovar, manter **MAX_SIMULTANEOUS=1**.
- ECHO em D13: conferir proteção série e disputa com LED/bootloader descrita em PINOS-E-LIGACOES.md; pendência impede energização.
- Resistores/polarização que garantem entradas de relé inativas durante bootloader/reset. Verificar módulo sem carga, não confiar só no sketch.
- Boias máximas abertas em cheio, mínimas fechadas com água; conferir com multímetro, sem energia.
- Sensor capacitivo polarizado conforme o diagrama; valores de calibração e geometria ainda são provisórios.
- Arduino firme e seco; recipientes estáveis; mangueiras presas; eletrônica fora de respingos; fonte com corte acessível.

## Ferramenta de bancada

Todos os testes automatizados usam placa virtual. Para o teste físico abaixo, **o próprio usuário** executa, com a porta correta e inicialmente sem os 12 V das bombas:

```powershell
npm ci
node scripts/serial-bench.js --port COMx --supervisionado
```

Troque COMx pela porta conferida no sistema. Não abra simultaneamente monitor serial, backend e ferramenta na mesma porta. Abrir a serial pode reiniciar o UNO. A ferramenta solicita MANUAL após o primeiro estado e envia heartbeat a cada 2 s; aguarde ACK MANUAL e modo confirmado. Ela só tenta abrir a porta quando o comando acima é executado; não é chamada por `npm test` ou `npm run firmware:test`.

Comandos locais:

```text
state
mode MANUAL
pump 1 on 4000
pump 1 off
pump 2 on 4000
pump 2 off
pump 3 on 4000
pump 3 off
stop
thresholds 25 40
calibrate 800 300
heartbeat off
heartbeat on
mode AUTO
exit
```

`stop` solicita MANUAL, apaga pedidos e desliga as três saídas; continua sendo parada de software, sem substituir o corte elétrico. Um pedido aceito em fila pode iniciar depois; cancele com `pump N off` ou `stop`. Após NACK de segurança, a solicitação é descartada. Não repita “on” continuamente: isso não supera o bloqueio nem o intervalo de 30 s.

## A — LEDs/relés sem bombas

1. **12 V das bombas desconectados.** Desconecte cargas de potência dos contatos. Use LEDs com resistores adequados ou apenas LEDs do módulo/continuidade dos contatos; não energize motor nesta etapa.
2. Abra `firmware/sda/sda.ino` no Arduino IDE, selecione UNO R3 e porta conferida. Compile e, somente nesta execução supervisionada, carregue. Não é preciso instalar bibliotecas de sensor/JSON.
3. Ligue/reinicie o UNO e observe os três canais desde o início do bootloader. Todos devem iniciar desligados; os primeiros 5 s não podem ter partida. Qualquer pulso de relé implica parar e corrigir polarização/alimentação.
4. Abra a ferramenta, aguarde ACK MANUAL. Estado sem leitura válida deve usar `null`, mostrar erro e impedir as saídas afetadas. O DHT pode demorar mais de 2,2 s para a primeira leitura válida; o solo exige oito amostras e o ultrassônico três.
5. Verifique que os estados publicados mudam aproximadamente a cada segundo, com v=1, seq crescente e checksum aceito. ACKs são frames extras. Compare os nomes de cada boia e o relé físico: bomba 1=D7, 2=D5, 3=D4.
6. Instale um alvo plano para o ultrassônico dentro da geometria configurada e obtenha leituras DHT/solo válidas. Não ajuste valores para esconder erro; calibre abaixo.
7. Com estados seguros, solicite individualmente cada bomba por 4000 ms. Compare ACK, LED, continuidade de NO/COM e estado. O ciclo deve terminar em 4 s, sem novas partidas durante 30 s.
8. Resete novamente: saídas OFF no boot. Só depois da retenção e com sensores válidos AUTO pode demandar água; MANUAL não é persistido após reset. Como as cargas estão desconectadas, confirme esse comportamento sem risco de bombeamento.

**Critério A:** nenhuma partida no bootloader/retenção; mapeamento correto; leituras reais válidas e falhas explícitas; todos os canais obedecem desligamento e intervalo. Registrar vídeo/fotos e tempos. Se falhar, não avançar.

## B — Boias à mão, uma de cada vez, ainda sem motores

Mantenha apenas lógica/relés e alvos/sensores, com 12 V desconectados. Altere uma boia por movimento e confirme a leitura antes do próximo. Use a matriz `MATRIZ-BOIAS.md`: as colunas indicam autorização **individual**, nunca ordem para ligar três juntas.

| Ensaio | Procedimento | O que observar |
| --- | --- | --- |
| Rio sem água | Bomba 1 solicitada; passe apenas rio para inativo | B1 OFF após debounce, alerta; B2/B3 só dependem de suas origens |
| Poço mínimo | Com B2 solicitada, retire mínimo sem acionar máximo | B2 OFF; B1 pode preencher em AUTO se rio tiver água |
| Poço cheio | Com mínimo ativo, acione máximo | B1 OFF; B2 só permitida se caixa e sensores seguros |
| Caixa mínima | Com B3 solicitada, retire mínimo mantendo água/alvo coerente com posição | B3 OFF; B2 pode preencher em AUTO se poço disponível |
| Caixa cheia | Com mínimo ativo, acione máximo e alvo de nível alto | B2 OFF |
| Poço contraditório | Mínimo inativo + máximo ativo | Erro de sensor; B1/B2 bloqueadas |
| Caixa contraditória | Mínimo inativo + máximo ativo | Erro; B2/B3 bloqueadas |
| Boia/ultrassônico contraditórios | Máxima caixa ativa com alvo baixo, ou mínima inativa com alvo muito alto | Erro; B2/B3 bloqueadas |
| Instabilidade | Faça contatos oscilarem antes de estabilizar | Sem múltiplas partidas; instabilidade contínua invalida após prazo |
| Fio aberto | Desconecte sinal por chave/conector apropriado, um de cada vez | Registrar estado real: mínima/rio simulam ausência; máxima simula cheio. Não afirmar diagnóstico de todas as falhas |

Ainda em B:

1. **Solo:** anote `solo_bruto` estabilizado em seco e em referência molhada do método escolhido. Não mergulhe eletrônica do sensor nem o DHT. Com todas OFF em MANUAL, envie `calibrate valor_seco valor_molhado` (seco > molhado + 50). Observe a média estabilizar; use `thresholds 25 40`. Os números 800/300 não são calibração universal.
2. **Histerese:** abaixo de 25% em AUTO, B3 pode ligar com caixa segura; entre 25 e 40% mantém o ciclo; em 40% para. Uma nova queda não pode superar o intervalo de 30 s.
3. **Máximo por ciclo:** com LEDs, não água, solicite cada bomba sem duração específica pelo protocolo ou com os máximos 120000/120000/60000 ms. Mantenha heartbeat e condições seguras. Deve parar no limite correspondente e respeitar cooldown. Valores acima do limite devem ser recusados. Solicitação de 4000 ms já verifica a duração menor.
4. **Fonte/escalonamento:** em MANUAL e estados seguros, solicite B1 e logo B2 por 4000 ms. Somente uma saída liga por vez no padrão; B2 fica em fila e só inicia com vaga e pelo menos 2 s desde a última partida. Repita cancelando B2 com `pump 2 off`: ela não deve partir depois.
5. **DHT falho:** usando chave de sinal/ligação de teste apropriada, interrompa DATA. Não mexa em potência. Após a próxima aquisição/timeout, temperatura e umidade devem ser `null`, nunca zero inventado; todas OFF/bloqueadas.
6. **Ultrassônico falho:** remova o alvo/retorno válido ou use chave de sinal preparada. B2/B3 devem parar/bloquear, nível `null`; recuperação exige três leituras novas. Medidas fora da geometria também devem invalidar, não virar um valor plausível.
7. **Heartbeat:** com LEDs e MANUAL, execute `heartbeat off` e não envie outros comandos (eles renovam o prazo). Após 10 s desde o último comando válido, modo vira AUTO, pedidos manuais são apagados e saídas em operação desligam. AUTO pode voltar a demandar água após as travas/intervalo. Execute `heartbeat on` ao terminar. Simplesmente tirar o USB pode cortar energia/resetar e não testa esse timeout.
8. **Alertas:** isole os estados para ouvir grupos 1/2/3/4/5; em falhas simultâneas há prioridade. Compare máscara de alertas, não apenas o som.
9. Grave os valores definitivos em Config.h (calibração, distâncias, polaridades). Recompile e repita A/B após qualquer ajuste. Calibração via comando é volátil.

**Critério B:** todas as proteções observadas, sem pedidos negados que executem depois, sem reset espontâneo e sem divergência de polaridade. Corrigir e repetir A/B antes de C.

## C — Uma bomba e recipiente pequeno, operador ao lado

1. Desligue tudo e conecte **uma única bomba por vez**, com diodo, fusível/corte e mangueiras fixados. Mantenha MAX_SIMULTANEOUS=1. Fonte de 12 V continua OFF enquanto confere ligações.
2. Encha o recipiente de origem; mantenha a bomba submersa com margem e destino com espaço. Não deixe cabo/eletrônica em contato com água.
3. Energize só lógica, abra ferramenta, confirme MANUAL e três OFF. Confirme que todos os sensores de segurança necessários são válidos e boias representam o nível real.
4. Só então ligue os 12 V e solicite `pump N on 4000`. Observe imediatamente fluxo, corrente (instrumento/fonte adequado), alimentação, relé e ausência de ruído/reset. Corte a fonte em qualquer anomalia.
5. Simule a perda da boia de origem **sem tirar água da bomba**. Deve parar. Confirme ausência de fluxo; se o fluxo continuar por relé ou sifonagem, corte a fonte e corrija.
6. Execute `pump N off`, espere a saída confirmada OFF e confira a parada física. Desligue os 12 V antes de tocar ou mover qualquer ligação. Respeite 30 s antes de nova partida.
7. Repita para as outras duas, uma de cada vez, somente após a anterior passar. Não use teste a seco para medir corrente de travamento nem provoque curto/travamento de motor.

**Critério C:** cada bomba funciona submersa, para fisicamente nas travas, não causa queda/reset/relé oscilante e tem corrente compatível com dimensionamento. Registrar corrente observada e método de medição. Pendência elétrica impede D.

## D — Maquete completa e painel

1. Com fontes OFF, monte Rio → B1 → Poço → B2 → Caixa → B3 → Plantação; fixe tudo. Confirme margem de captação antes das boias mínimas, proteção contra transbordamento e ausência de sifonagem.
2. Energize lógica sem 12 V, confirme MANUAL/OFF/sensores. Para trocar da ferramenta para o backend: `stop`, corte 12 V, `exit`, configure `.env` com `SIMULATE=false` e `SERIAL_PORT=COMx` e inicie `npm start`. Apenas um processo pode usar a porta. Não use `SIMULATE=true` como comprovação da maquete real.
3. Faça login master. Confirme “HARDWARE — validação física pendente”, estado do Arduino conectado, cinco boias coerentes e três saídas OFF. A conexão do site sozinha não comprova a do Arduino. Solicite MANUAL, confirme ACK, e só então energize 12 V.
4. Selecione duração de 4 s no painel novo e teste manualmente cada circuito. A interface não deve presumir ligado no clique; observe ACK/estado, LED/relé e fluxo real. Fila deve ser identificada, sem segunda bomba simultânea.
5. Com fontes/correntes já aprovadas, solicite AUTO. Baixe o poço controladamente mantendo B1 submersa: ele deve encher até máximo com rio disponível. Baixe a caixa mantendo B2 submersa: só enche se o poço estiver acima do mínimo. Solo seco só permite B3 com caixa acima do mínimo; histerese/tempo/cooldown permanecem.
6. Simule os limites com margem de água e operador junto ao corte. Não esvazie a origem até a bomba ficar seca. Observe ciclos e transbordamento; o ultrassônico complementa as boias da caixa, não as substitui.
7. Termine em MANUAL/OFF, confirme parada física, corte os 12 V e só depois encerre servidor/USB. Não deixe o sistema sozinho nesta fase.

**Critério D:** sequência hidráulica correta, nenhuma simultaneidade não autorizada, todas as travas passam, telemetria/ACK condizem com a operação e não existem resets/ruído/vazamentos. Não equivale a certificação elétrica ou operação autônoma prolongada.

## Registro para devolver ao projeto

| Campo | Preencher pelo executor |
| --- | --- |
| Data, executor e supervisor | PENDENTE |
| Commit/versão usada | PENDENTE |
| Modelos de bombas, relés, fonte, sensores | PENDENTE |
| Calibração seco/molhado e geometria | PENDENTE |
| Polaridades reais das cinco boias | PENDENTE |
| Correntes medidas e proteção elétrica | PENDENTE |
| A / B / C / D: passou, falhou ou não executado | PENDENTE |
| Vídeos/fotos, máscaras de alerta e tempos | PENDENTE |
| Divergências, correções e repetição | PENDENTE |
| Confirmação final do usuário | **PENDENTE — firmware não validado para uso real** |
