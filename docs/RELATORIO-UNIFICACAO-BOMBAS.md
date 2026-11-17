# Unificação das bombas na Water Experience

Entrega: 17/11/2026. Escopo exclusivamente de consolidação do frontend. SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.

## Auditoria e resultado

Antes havia três artigos premium usados como âncoras, três artigos operacionais gerados em outra grade, uma barra de modo e um formulário legado da Bomba 3. Os comandos reais eram registrados uma vez por botão em maquete.js; regarManual/pararRega eram funções globais legadas do HTML. Os estados eram atualizados por telemetria, com feedback separado de ACK/erro.

Agora os três artigos premium são os próprios cartões operacionais `#pump-card-1/2/3`, com classes `.circuit-pump.pump-card`. Não se cria a grade inferior `.pump-grid` nem a região `#pump-operation`. Não se cria âncora ou texto “Ir para controles”. Cada artigo mantém ícone, código, nome, função, percurso, estado confirmado, campo de segundos, um Ligar, um Desligar e feedback. Há exatamente três cartões e seis botões principais de bomba.

O mesmo código de criação de inputs/botões e registro dos listeners é executado sobre os artigos premium existentes. Os handlers de bombas, os handlers de modo e a função de renderização operacional foram comparados textualmente com a versão anterior e permanecem intactos. Sessão/CSRF continuam no mesmo sdaRequest; payloads e endpoints operacionais não mudaram. ACK isolado não muda a indicação para ligada antes da telemetria confirmada, conforme o comportamento anterior.

AUTO/MANUAL fica na Water Experience, próximo ao circuito, com feedback e estado confirmado. Os avisos de segurança e alertas permanecem disponíveis. Estados auxiliares internos usados pelos contratos existentes foram preservados para acessibilidade/atualização; não há cartões ou controles antigos escondidos com CSS.

## Bomba 3: formulário legado

O mesmo disclosure e input `#tempo-manual` foram preservados dentro do cartão da Bomba 3, com título “Avançado · duração em minutos”. Os dois botões legados que repetiam ligar/parar são removidos do DOM, e não apenas ocultados. A ação “Usar duração em minutos” apenas converte o valor para segundos e preenche o campo principal; não envia requisição nem liga a bomba. O acionamento exige usar o único botão Ligar e mantém sua confirmação e limites. Uma duração convertida acima do limite continua recusada pelo handler original. CLIENTE não pode usar a conversão nem os comandos.

As funções globais legadas e endpoints do backend não foram removidos ou reescritos. A apresentação passa a usar somente o caminho principal existente `/api/bombas/3`; não há segundo par de comandos ou novo listener de acionamento. IDs de status legados continuam presentes para os consumidores existentes, sem repetir visualmente o estado operacional.

## Arquivos

- `public/maquete.js`: artigos únicos, montagem dos controles e barra de modo, disclosure de minutos sem comandos duplicados.
- `public/overview-v41.css`: disposição compacta dos controles, feedback, avançado e responsividade.
- `test/water-experience.test.js`: contratos atualizados de acordo com a decisão nova, teste de unicidade, modo, limites e conversão sem requisição.
- `docs/RELATORIO-UNIFICACAO-BOMBAS.md`: este relatório.

`public/arthur.html` e `public/environment-v5.css` não foram alterados nesta entrega; Análise Ambiental V5 preservada. Backend/APIs, banco, firmware/protocolo, regras de simulação, autenticação/permissões, IA e login não foram alterados. Nenhuma correção L-2 foi feita.

## Testes e justificativa das alterações

Execução final: **47 aprovados, 0 falhas, 0 ignorados**, aproximadamente **40,92 segundos**, contando subtestes.

```powershell
node --test --test-concurrency=1 test/water-experience.test.js test/overview-v2.test.js test/protocol.test.js test/auth.test.js test/device-api.test.js test/environment-v5.test.js test/ui-navigation.test.js
```

As expectativas antigas de “resumo sem botões” e “atalho com href” foram substituídas: a nova decisão exige os controles dentro do artigo premium e elimina as âncoras. As verificações de estado confirmado, dados ausentes, canteiros ilustrativos, erro seguro e CLIENTE foram mantidas. O antigo teste de seção inferior foi substituído por ausência dessa seção/grade, exatamente três cartões e seis comandos principais, disclosure único e ausência dos botões legados. Foram adicionados testes de conversão sem requisição, recusa de duração acima do limite, um único envio ao clicar novamente durante pendência, payload de modo e CLIENTE sem operação/conversão.

A suíte inclui proteção HTTP/CSRF/sessão/sockets, comandos seguros, ACK/NACK/timeout/fila e simulação, regressões da V5, navegação e streaming simulado preservado. Não é teste físico nem validação do Ollama. Não foram modificados testes de backend ou afrouxadas expectativas de segurança. `git diff --check` passou; apenas avisos de normalização LF/CRLF.

## Verificações visuais

Prévia isolada em memória, SIMULAÇÃO e loopback 127.0.0.1:3101. Inspeções em desktop 1440px, tablet 768px e celular 360px, com amostras dos temas escuro e claro. DOM confirmou três cartões, seis botões principais e zero grades inferiores. O avançado da Bomba 3 abre no próprio artigo. Conflito de grid do disclosure no celular foi identificado e corrigido; ausência de overflow horizontal confirmada em celular/tablet. Nenhum erro de console capturado. Não foi realizado acionamento manual pelo navegador; segurança e comandos foram verificados pela suíte automatizada com simulação.

Capturas locais: `.data/unified-pumps-desktop.jpg` e `.data/unified-pumps-mobile.jpg` (não versionadas). A prévia Node PID 18224 foi encerrada após conferir a propriedade da porta. Ausência de listener confirmada e credencial efêmera removida. Nenhum outro serviço foi encerrado; `.env` e MySQL não foram modificados.

## Commits

- `20c8c82` — integração dos controles únicos nos artigos premium.
- `0d3f6af` — atualização dos testes e cobertura da unificação.
- `7ebf6db` — correção da largura móvel do avançado e teste do limite convertido.
- Relatório em commit documental separado, disponível no histórico Git.

## Roteiro manual e limitações

1. Inicie o sistema com a configuração habitual em SIMULAÇÃO (`npm start`), entre no login e use Ctrl+F5 em Visão Geral.
2. Confira circuito e três cartões premium, cada um com duração, Ligar/Desligar e feedback. Não deve haver nova grade inferior nem “Ir para controles”.
3. Navegue com Tab pelos campos e botões; confira AUTO/MANUAL e seu estado confirmado.
4. Em Avançado da Bomba 3, informe minutos e use “Usar duração em minutos”. Confira a conversão no campo de segundos: nenhuma bomba deve ligar nessa ação.
5. Ao testar um comando em simulação, confirme explicitamente e observe pendência, bloqueio/erro ou estado confirmado. Valores acima do limite devem ser recusados; não aumente limites para testar.
6. Confira uma conta CLIENTE: comandos e campos principais permanecem somente leitura, com conversor desabilitado, conforme as permissões atuais.
7. Avalie desktop/celular e ambos os temas; confirme que a Análise Ambiental V5 continua abaixo, preservada.

A revisão visual não cobre todas as combinações de dispositivos, temas ou navegadores físicos. Validação física do firmware e a pendência L-2 continuam fora desta entrega. Aguardando avaliação do usuário antes de outras alterações. `docs/RELATORIO-IA-2E.md` permaneceu não rastreado e não foi incluído nos commits.
