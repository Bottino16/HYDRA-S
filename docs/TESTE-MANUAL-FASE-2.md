# Fase 2 — teste manual no navegador, somente SIMULAÇÃO

Firmware **NÃO VALIDADO**. Ensaios físicos PAUSADOS. Não conecte Arduino nem energize bombas para este roteiro.

## Preparar do zero

1. Instale Node.js 20.19+; execute `npm ci` na raiz.
2. Copie `.env.example` para `.env`. Escolha `ADMIN_USER`, senha forte exclusiva (12+ caracteres, maiúscula, minúscula, número e símbolo) e `SESSION_SECRET` aleatório de 32+ caracteres. Gere o segredo com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Não versione `.env`.
3. Defina `SIMULATE=true`, `WEATHER_OFFLINE=true`, `DATA_STALE_SECONDS=5`, `READING_SAVE_SECONDS=2`. Para demonstração rápida sem banco: `DB_MODE=memory`; execute `npm start`. Leituras/eventos/acionamentos nesse modo desaparecem ao reiniciar; a tela avisa. Para testar persistência use MySQL 8 local: configure os campos `DB_*`, execute `npm run db:setup` e `npm start` (ou `npm run ready`). Nunca use banco de produção.
4. Acesse http://localhost:3000 (ou `PORT`/`APP_ORIGIN` configurados), entre e confira o selo **SIMULAÇÃO**. Espere pelo menos 6 s para terminar a proteção de partida. Nenhum valor nesta fase vem de hardware.

## Verificar tela e atualização compartilhada

1. Abra Chrome e Edge, ou uma janela normal e outra privada. Entre separadamente nas duas. Compare solo, temperatura, umidade, caixa, três bombas e cinco boias.
2. No fim do painel, escolha “Solo seco”. As duas sessões devem mostrar o mesmo estado; pequenas diferenças de instante durante atualização são normais. Volte ao “Cenário normal”.
3. Clique “Pausar telemetria”. Após 5 s, ambas devem mostrar **SIMULAÇÃO sem dados**, sensores “sem dados”, barras vazias e bombas desconhecidas. Não deve permanecer o último valor válido. Tentar ligar bomba deve falhar sem mostrar ligada.
4. Clique “Retomar telemetria”. A comunicação simulada volta; todos recebem estado recente. Pausar telemetria simula falha de comunicação; o controlador virtual continua executando localmente e mantém suas travas.
5. Escolha “Falha DHT”: temperatura e umidade do ar ficam sem dados, não 0. Em “Rio seco”, tentativa manual da bomba 1 é bloqueada pelo controlador. Volte ao normal antes de continuar.

## Comandos, histórico e consumo

1. Em normal e após proteção de partida, no painel de três bombas escolha duração 4 s. Ligue a bomba 1 e confirme. A tela só deve exibir ligada após ACK/estado; o evento deve aparecer nas duas sessões. Aguarde o desligamento. Cooldown mínimo é 30 s; não altere isso para facilitar teste.
2. Em vazões, informe um valor de demonstração em L/min para a bomba 1, deixe as outras vazias e salve. Esses números servem apenas para testar cálculo, não são calibração física. Repita um ciclo depois do cooldown. Consulte o período; o volume concluído deve conter **ESTIMATIVA**. Sem vazão ou com ciclo incerto, volume deve permanecer indisponível.
3. Consulte início/fim cobrindo a execução. Observe solo, temperatura, umidade, níveis e as três bombas no histórico. A tela exibe até 100 linhas por consulta; o CSV contém todo o período. Abra o CSV e confira coluna `fonte=SIMULACAO`, datas UTC e os três estados de bomba. Datas inválidas ou intervalo maior que 31 dias são recusados.
4. Com MySQL, reinicie o servidor, entre novamente e consulte o mesmo período. Eventos e ciclos permanecem; sessões anteriores são encerradas. O diário de ocorrências e as vazões ficam em `.data`, mesmo na demonstração em memória.

## Agendamento por perfil e reinício

1. Selecione um perfil do master com limite maior que o solo (ex.: 55%, cenário normal ≈42%). Configure hora um ou dois minutos à frente, duração **1 minuto**, ativo e dia atual. O fuso padrão é America/Fortaleza. Salve. Cada perfil possui sua configuração. Para observar a origem agendada sem a irrigação AUTO antecipar por solo seco, depois de salvar selecione outro perfil com limite baixo (ex.: 15%). A agenda continua vinculada ao perfil de 55%.
2. Aguarde o horário. A ocorrência deve ser reservada uma vez e gerar evento. O acionamento depende do ACK e das travas: partida, água, DHT, histerese, cooldown e limite de uma bomba. Nunca aumente a duração para contornar uma trava.
3. Reinicie no mesmo minuto após o evento de ocorrência aceita. Entre novamente. Não deve aparecer outro envio daquela ocorrência. Ciclo cujo término ficou desconhecido será “incerta”, sem volume calculado e sem reenvio.
4. Se o servidor começar no minuto e a proteção de partida bloquear o pedido, o registro fica bloqueado; não insiste naquele minuto. Não há recuperação automática de horários passados. Teste um perfil com limite abaixo do solo: registra bloqueio pelo limite próprio, sem limite fixo de 15%.
5. Não apague `.data/schedule-occurrences` para “repetir” uma ocorrência; planeje outro horário. Faça backup desse diretório com o banco.

## Clima offline e autorização

1. Com `WEATHER_OFFLINE=true`, confira “CLIMA OFFLINE” sem toast de erro e com painel responsivo. A aparência de ícones/Chart.js pode exigir cache de CDN até a Fase 4.
2. Opcionalmente, em ensaio separado, configure `WEATHER_OFFLINE=false` e chave OpenWeather no `.env` (ou use Open-Meteo sem chave). Reinicie. O navegador consulta apenas `/api/clima`; nenhuma chave deve aparecer nas respostas. Corte a internet: após expirar o cache, aparece offline e o último clima fica identificado como cache no endpoint. Esse teste externo não foi executado pelo agente.
3. Sem login, APIs retornam 401. Como cliente, comandos, cenários e alterações de vazão retornam 403. Logout invalida HTTP e socket. Arquivos `.env`, `server.js`, `/db`, `/src`, `/knowledge` e `/firmware` retornam 404.

## Encerrar e pendências

Pare com Ctrl+C. Não avance para upload nem testes físicos. Conferência elétrica, polaridades, vazões reais, geometria e ensaios A/B/C/D dependem de disponibilidade do Arduino e confirmação do usuário. O plano físico continua em `docs/TESTE-FISICO-FASE-1.md`; Fase 3 aguarda aprovação.
