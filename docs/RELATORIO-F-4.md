# F-4 — Central de Configurações

## Entrega e limites

Redesign dos controles já existentes, sem novos endpoints ou recursos operacionais. Quatro cartões: Perfis de plantas, Agendamento de irrigação, Vazão das bombas e Cenários de simulação. Identidade azul profundo/ciano e tokens compartilhados com F-1, F-2, F-3 e UI-3; superfícies, hierarquia, formulários e estados visuais próprios da seção.

Continuamos em SIMULAÇÃO. Firmware NÃO VALIDADO fisicamente. Backend, banco, autenticação/CSRF, permissões, regras de agendamento, bombas/ACK/travas, serial e Ollama não foram alterados. Nenhuma mudança no `.env`, segredo, instalação, firewall ou configuração de rede. F-5, F-6 e Fase 4.5 não foram iniciadas.

## Melhorias

- Perfis apresentados em cartões informativos com nome, limite e seleção destacada. O seletor existente continua sendo o controle de seleção; os cartões não introduzem outra operação. Nomes são exibidos com `textContent`.
- Campos e ações de criação/edição/exclusão mantidos; rótulos associados aos campos e mensagens locais de carregamento, sucesso e erro. Confirmação de exclusão existente preservada.
- Agendamento identifica o perfil atual, mantém horário, duração em minutos, estado e calendário. Dias selecionados aparecem em resumo. A interface explica que confirmar o calendário prepara os dias, e Gravar configuração envia o agendamento.
- Dias do calendário são botões de teclado com `aria-pressed`, mantendo o foco no dia após sua atualização. Os dois modais têm nome acessível, foco inicial e contenção da navegação Tab.
- Vazões: três campos, mesmas unidades/min/step, valores nulos como ausência de calibração, consumo sempre ESTIMATIVA. O CLIENTE continua somente leitura; somente MASTER salva. Falha de carregamento mantém campos desabilitados, impedindo salvar campos vazios como se fossem valores consultados.
- Simulação separa instruções informativas das seis ações já existentes. Botões só aparecem para MASTER em simulação, com confirmação de resultado ou erro. Não existem novos cenários ou bypasses.
- Rascunhos ficam nos mesmos nós ao alternar seções. Não há gravação por navegação. Vazões/agendamentos mostram aviso de alterações locais e mantêm valores no formulário se houver falha de envio.
- Uma coluna para formulários móveis, duas colunas de cartões a partir de 1100 px, textos sem encolhimento excessivo e botões com pelo menos 44–48 px. Temas usam os mesmos tokens existentes.

## Comportamentos existentes explicitados

A seleção de perfil continua salvando imediatamente e carregando seu agendamento. Trocar o perfil pode, portanto, substituir os campos do agendamento por outro registro: isso não equivale a apenas mudar de seção. Não foi introduzida uma nova confirmação para essa operação.

O botão de cenário envia sua alteração imediatamente, como antes. Salvar vazões e Gravar configuração mantêm seus envios explícitos e os mesmos payloads. O calendário não envia nada sozinho. As atualizações `config_atual` recebidas do servidor continuam seguindo o comportamento preexistente; não foi criada uma política de resolução de conflitos entre edição local e atualização remota.

## Arquivos e commits

- `public/arthur.html`: estrutura de perfis/agendamento, rótulos, modais/calendário e feedback, preservando IDs, callbacks e payloads.
- `public/monitoring.js`: apresentação de vazões/simulação e seus estados visuais, mantendo operações e contratos.
- `public/settings-view.js`: apresentação segura dos perfis, contexto, dias, avisos locais e foco de modais; não acessa APIs.
- `public/settings.css`: estilos restritos à central e seus dois modais.
- `test/settings-ui.test.js`: quatro testes novos de integração DOM com requisições simuladas.
- Este relatório.

Commits de implementação:

1. `678ebb4` — organização dos controles em cartões premium.
2. `a42a63c` — feedback, calendário acessível e testes de contratos.
3. Commit de documentação desta entrega — relatório e roteiro de avaliação.

## Testes

```powershell
node --test test/settings-ui.test.js
node --test --test-concurrency=1
```

Os quatro testes novos passaram, verificando:

- Perfis sem interpretação de HTML, seleção/contexto e resumo dos dias.
- Preservação dos campos de horário, vazão e edição de perfil ao navegar; ausência de gravações ao navegar.
- Mesmo PUT de vazões com nulos e números; mesmo POST de cenário. Erros de envio preservam os valores digitados.
- CLIENTE sem edição de vazão e sem cenário; erro de leitura não habilita gravação de vazões vazias.
- Mesmo payload de agendamento, inclusive perfil, duração e dias. Calendário não envia requisição; foco/seleção permanecem no dia; falha de envio mantém formulário.

As primeiras execuções de compatibilidade tiveram falhas em verificações antigas de tempo real (sequência entre sockets e atualização de valores vencidos). Nenhuma expectativa foi enfraquecida ou alterada. Na execução completa isolada essas falhas não se repetiram: **91 testes, 88 aprovados, zero falhas e três integrações SQL opcionais ignoradas**, em aproximadamente 92 segundos. A saída local está em `.data/tests-f4-all.txt`, ignorada pelo Git. O resultado não determina a causa das falhas anteriores; esses testes de tempo real continuam sujeitos à avaliação de estabilidade.

A suíte completa inclui os testes existentes de autenticação, permissões, navegação com rascunhos e streaming ativo, histórico/CSV, UI-3, comandos simulados e Assistente/Ollama com mocks. Não é uma validação visual no navegador nem teste real do modelo.

## Validação visual e pendências

Não houve validação visual real no navegador nesta entrega. A ferramenta havia bloqueado o acesso local anteriormente e esse bloqueio não foi contornado. DOM não comprova geometria, contraste percebido ou funcionamento do teclado virtual. As seis larguras e os dois temas precisam da avaliação manual abaixo.

A falha já relatada no acionamento da bomba de irrigação permanece **pendência operacional não investigada**, sem alteração de proteção ou tentativa de correção. Os testes simulados não validam hardware. Não foram usados MySQL real, Arduino nem geração real do Ollama nesta etapa.

## Roteiro manual

1. Use o ambiente local já configurado: `SIMULATE=true`, `DB_MODE=memory`, loopback. Não modifique configuração, banco ou portas para avaliar a F-4. Na pasta do projeto, execute `npm start` com as credenciais locais existentes; entre em `http://localhost:3000/login.html`. Se já estiver rodando, atualize com Ctrl+F5.
2. Abra Configurações. Confira quatro grupos para MASTER, indicação SIMULAÇÃO, identificação de acesso nas vazões e ESTIMATIVA. CLIENTE deve manter as permissões anteriores; cenários são exclusivos MASTER.
3. Confira os cartões e a seleção dos perfis. Se trocar de perfil, lembre que a seleção é salva imediatamente. Crie/edite um perfil de teste somente se desejar persistir essa operação no ambiente temporário; cancele uma exclusão e confirme que a conta não perdeu o perfil.
4. Digite um horário e duração, sem gravar. Alterne Visão Geral, Histórico, Assistente e volte: valores devem permanecer. Faça o mesmo com uma vazão e com texto no modal do perfil. Não é necessário acionar bombas para esse teste.
5. Abra o calendário por teclado; use Tab e Enter/Espaço nos dias. Confirmar seleção deve apenas atualizar o resumo. Gravar configuração deve mostrar o resultado da operação existente. Confira o agendamento por perfil, sem testar execução física.
6. Em vazões, confira L/min, ausência de calibração nos campos nulos e os valores existentes. Se optar por salvar dados de teste, observe a mensagem e a indicação ESTIMATIVA. A simulação mantém suas seis ações: pausar, retomar, normal, rio seco, solo seco e falha DHT. Use Retomar/Cenário normal para voltar ao cenário de demonstração.
7. Confira carregamento e mensagens; não interprete erro de envio como sucesso. Não desative proteções, altere banco ou firmware para provocar falhas.
8. Verifique 360, 390, 768, 1024, 1440 e 1920 px, em claro e escuro. No celular, conferir uma coluna, campos sem corte, calendário com sete dias por linha e modais roláveis sem sobreposição. Confira foco visível e ordem Tab; não deve haver rolagem horizontal da página.
9. Confira que UI-3, histórico/CSV e Assistente continuam acessíveis. Uma resposta em streaming deve continuar ao alternar seções. Não é necessário alterar modelo, limites ou configuração Ollama.
10. Saia pelo menu e encerre o servidor com Ctrl+C quando terminar. Leituras/contas em modo memória são temporárias. Aguardar aprovação antes de qualquer próxima etapa.
