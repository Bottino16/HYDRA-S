# Auditoria dos níveis do Digital Twin

Data: 19/11/2026. Operação exclusivamente em SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.

## Diagnóstico

Não foi reproduzida regressão no vínculo entre telemetria e cena. O estado «Controlador desconectado» desabilita corretamente os percentuais. Não há evidência suficiente para afirmar se a captura original veio de telemetria pausada, expirada, transporte desconectado ou outra condição. O servidor existente na porta 3000 não foi alterado nem autenticado nesta auditoria. A validação foi realizada em uma prévia isolada em 127.0.0.1:3101, DB_MODE=memory e SIMULATE=true, sem MySQL ou mudanças em .env.

## Origem e percurso dos dados

| Componente | Campo | Significado confirmado |
| --- | --- | --- |
| Rio | rio | Percentual do estado virtual river do simulador; não é medição física nem cálculo pelas boias. |
| Poço | poco | Percentual do estado virtual well do simulador; não é medição física nem cálculo pelas boias. |
| Caixa | caixa | Percentual virtual box na simulação. No firmware, é o campo associado ao ultrassônico, sem validação física. |
| Plantação | solo | Escala relativa do sensor de solo; simulada nesta instalação, não representa volume de água nem teor volumétrico calibrado. |

Origens: src/simulated-board.js (input/telemetry), firmware/sda/sda.ino (emissão state), src/device-link.js (receive/snapshot), src/services/device-service.js (snapshot/tick), public/maquete.js (render), public/digital-twin.js (sync).

A Visão Geral anterior e a atual usam os mesmos campos. maquete.js só aceita número finito entre 0 e 100 quando connected é true. Os valores chegam por /api/estado e estado_sistema; sync copia as leituras validadas para as três composições SVG. Zero válido continua 0%; null, undefined, NaN, valores fora da faixa e estado desconectado ficam Sem dados. O backend já anula leituras vencidas; a interface não recupera o último valor como se fosse atual.

As cinco boias são booleanas de presença/mínimo/máximo. Não fornecem percentuais contínuos. O firmware atual não emite rio e poco: esses números não devem ser presumidos em hardware futuro.

## Representação visual

Nenhuma mudança no frontend foi necessária ou realizada. Os números já aparecem próximos às ilustrações. Os volumes SVG são estáticos e conceituais, com aviso visível de ausência de escala de leitura e vazão medida. Não representam os percentuais, inclusive quando há dados. Não foi criado cálculo nem animação proporcional de água.

## Verificações reais no navegador

Prévia isolada: Rio 80%, Poço 35%, Caixa 60%, solo variando em tempo real. Pausar telemetria nas Configurações levou ao vencimento e a Sem dados nos quatro componentes; retomar restaurou os valores. Cenário Rio seco mostrou 0% nas três composições, com SIMULAÇÃO conectada. Nenhum comando manual de bomba foi enviado.

Desktop 1440px, celular 360px e tablet 768px conferidos. Sem rolagem horizontal em 360px e 768px. Capturas JPG em evidencias-niveis/: desktop-conectado.jpg, desktop-desconectado.jpg, mobile-conectado.jpg e mobile-desconectado.jpg. Os cenários desconectados representam telemetria pausada e vencida, sem desligar o servidor.

## Testes automatizados

Comando: node --test --test-concurrency=1 test/water-experience.test.js test/dashboard.test.js test/protocol.test.js

25 aprovados, zero falhas. Teste adicional cobre atualização dos quatro campos, zero, ausência, NaN, desconexão e reconexão nas três composições. Suíte existente cobre validação de protocolo, vencimento, ACK, controles e fidelidade da geometria aprovada. Testes DOM não substituem a inspeção visual, realizada separadamente.

## Avaliação manual e pendências

1. Inicie sua instalação com SIMULATE=true e entre no painel.
2. Em Configurações, use Retomar telemetria ou Cenário normal; volte à Visão Geral.
3. Confirme SIMULAÇÃO conectada e percentuais ao lado das ilustrações.
4. Pause a telemetria, aguarde seu prazo configurado de validade e confirme Sem dados.
5. Retome a telemetria. Rio seco deve apresentar 0%, não Sem dados.

Se sua instalação continuar desconectada após retomar, ainda será necessário investigar seu processo e conexão específicos antes de propor mudanças. Não foi diagnosticada a causa histórica da captura original. Nenhuma validação física foi realizada. Prévia temporária encerrada ao final; servidor 3000, Ollama e MySQL preservados.
