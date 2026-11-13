# F-1 — Fundação do frontend premium

Escopo: arquitetura atual HTML/CSS/JavaScript/Express, sem Marko, novas dependências ou build. Somente SIMULAÇÃO; firmware NÃO VALIDADO fisicamente. Não foi iniciada F-2 nem Fase 4.5.

## Organização entregue

O ambiente autenticado tem quatro seções locais persistentes e o acesso administrativo existente:

| Navegação | Conteúdo |
|---|---|
| Visão Geral | UI-3, indicadores, maquete, bombas, gráfico, clima e ações adicionais existentes |
| Histórico e Eventos | Consulta por período, leituras, acionamentos, ESTIMATIVA e eventos existentes |
| Configurações | Mesmos perfis, agendamento, vazões e cenários de simulação |
| Assistente do Solo | Mesmo chat, histórico, streaming e controles |
| Administração | Link protegido existente em `/painel-adm.html`, ocultado para CLIENTE pelo mecanismo anterior |

Não foram criadas rotas. Login e painel continuam em `/login.html` e `/arthur.html`. A área administrativa mantém a navegação de página e autorização existentes.

`ui-sections.js` centraliza registro, seleção e visibilidade. Alternar seção não desmonta nós, não reconecta Socket.io e não chama APIs de salvar. A instância de navegação tem guarda contra registro duplicado. Formulários continuam nos mesmos elementos, preservando IDs e listeners. A posição da área principal é lembrada por seção; dispositivos com rolagem do documento precisam da conferência manual indicada abaixo.

O Assistente utiliza o gerenciador quando presente, mantendo o fluxo antigo para montagens isoladas/testes. Seu observador antigo de ocultação não é ativado junto com o gerenciador, evitando duas fontes de controle da visibilidade. Voltar ao painel seleciona Visão Geral sem destruir mensagens ou interromper geração.

Os cartões existentes de perfis e agendamento são movidos, não reconstruídos. Vazões e simulação foram separados de histórico em cartões básicos; feedback de salvar/cenário aparece agora na própria seção Configurações. Endpoints, payloads, unidades, permissões, limites e validações permanecem os mesmos. Não foram criados formulários novos de calibração ou limiares.

## Fundação compartilhada

`ui-foundation.css` consolida tokens de espaçamento, tamanho de controles, tipografia e largura de conteúdo. Acrescenta contratos reutilizáveis para cartão, botão, campo, tabela e aviso com estados de sucesso, erro, carregamento e indisponibilidade. Esses contratos preparam as próximas áreas; não significam que histórico/chat/admin já receberam redesign completo.

Novas seções possuem cabeçalhos e foco consistente. Configurações usa uma coluna por padrão e duas a partir de 1024px. O menu recolhível, foco visível, Escape, textos dos itens e dois temas reaproveitam UI-1. O CSS específico da UI-3 e seus componentes foram preservados; regras dos novos cabeçalhos excluem explicitamente o cabeçalho da central hídrica para não reduzir sua hierarquia.

Login/administração continuam aguardando sua etapa visual. Não houve extração geral de todos os estilos inline nem redesign completo do chat, tabelas ou formulários.

## Arquivos

- `public/ui-sections.js`: novo gerenciador de seções persistentes.
- `public/arthur.html`: destinos de navegação, contêineres e classificação dos cartões existentes.
- `public/ui-navigation.js`: foco na seção selecionada, mantendo o menu móvel.
- `public/ui-foundation.css`: tokens e componentes compartilhados, layouts das seções.
- `public/maquete.js`: montagem da mesma UI-3 dentro de Visão Geral; lógica de comandos/estados intacta.
- `public/monitoring.js`: destinos separados de histórico/configurações e feedback local; mesmas consultas e operações.
- `public/assistant.js`: integração de navegação, sem alterar SSE, mensagem, sanitização ou comandos.
- `test/frontend-sections.test.js`: testes direcionados da F-1.
- Este relatório.

Não houve alteração em backend/APIs, banco/migrações, autenticação/CSRF, permissões, Ollama, firmware/protocolo, fila/ACK/travas, simulação ou agendamento. `.env` não foi alterado. Nenhum teste MySQL real, instalação, inferência real ou exposição de rede foi executado.

## Testes e evidências

- `node --test --test-concurrency=1`: **76 testes; 73 aprovados, zero falhas e três ignorados**. Inclui regressões de autenticação, sessão/CSRF, autorização, sockets, bombas/ACK, simulação, histórico/CSV, Assistente, XSS, mocks Ollama e UI-1/UI-3.
- `node --test test/frontend-sections.test.js test/ui-navigation.test.js test/dashboard.test.js`: **9 aprovados**.
- Reexecução direcionada após acrescentar verificações de payload dos controles movidos: `node --test test/frontend-sections.test.js`: **2 aprovados**.
- Sintaxe dos scripts e `git diff --check` verificados.

Os testes novos percorrem as quatro seções repetidamente e verificam uma seção visível/um item ativo; identidade dos nós; preservação do horário, vazão, filtro de período, rascunho e mensagens; continuidade dos deltas SSE; ausência de abort por navegação; mesmo número de inscrições no socket; ausência de salvamento por troca de seção; mesmos payloads de vazão/cenário; guarda contra reinicialização do gerenciador; foco, Escape e fechamento do menu móvel.

Saídas locais ignoradas pelo Git: `.data/tests-f1-all.txt`, `.data/tests-f1-sections.txt` e `.data/tests-f1-final-sections.txt`. Três integrações SQL foram ignoradas por ausência de banco de ensaio; não se acessou o banco da apresentação. Firmware inalterado: compilação/ensaio físico não foram repetidos.

**Limitação visual:** a ferramenta de navegador bloqueou anteriormente a seleção da aba local nesta frente. A restrição não foi contornada e não há nova revisão renderizada/capturas nesta entrega. Testes DOM não medem sobreposições, contraste, dimensões ou teclado virtual. A matriz visual e os dois temas permanecem para aceite manual. Também é necessário conferir o redimensionamento do gráfico ao voltar à Visão Geral.

## Commits

1. `070afd1` — seções persistentes, organização e testes iniciais.
2. `abcb288` — componentes compartilhados e layouts, com verificações dos controles movidos.
3. Relatório e roteiro manual, identificado no histórico Git da entrega.

## Roteiro manual

1. Com o servidor local em SIMULAÇÃO/memória já aberto, acesse `http://localhost:3000/arthur.html` e pressione Ctrl+F5. Se estiver parado, inicie pelo procedimento de senha temporária previamente aprovado:

   ```powershell
   Set-Location 'C:\Users\felip\OneDrive\Desktop\HYDRA-S'
   $cred = Get-Credential -UserName 'master_hydra' -Message 'Senha temporária do MASTER'
   $env:ADMIN_PASSWORD = $cred.GetNetworkCredential().Password
   try { npm start } finally {
       Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
       $cred = $null
   }
   ```

   Use `http://localhost:3000/login.html`. Não executar setup/reset/migrações. Não compartilhar senha no chat. Esse roteiro pressupõe o `.env` temporário anterior com `SIMULATE=true`, `DB_MODE=memory` e loopback.
2. Confira SIMULAÇÃO e UI-3 em Visão Geral. Abra Histórico e Eventos, ajuste um período e alterne de seção: os campos devem permanecer.
3. Em Configurações, edite um campo sem salvar, navegue e volte: o valor deve continuar e nenhuma confirmação de salvamento deve aparecer. Perfis, agendamento, vazões e simulação devem estar nessa seção, sem cópias na Visão Geral.
4. No Assistente, envie uma pergunta, alterne pelas outras áreas e retorne enquanto gera. A resposta deve continuar; o rótulo Ollama/modelo e os avisos de dados simulados permanecem. Experimente também um rascunho não enviado e Voltar ao painel.
5. Use Tab/Shift+Tab/Enter/Espaço nos controles nativos. O foco deve ser visível. Selecionar uma seção pelo menu móvel fecha-o e leva foco ao título. Escape fecha o menu e retorna ao acionador.
6. Confira **360, 390, 768, 1024, 1440 e 1920px**, em tema claro e escuro. Observe textos cortados, sobreposição, rolagem horizontal global, menu com todos os destinos e gráfico ao retornar. Tabelas/chat antigos ainda terão etapas próprias; registrar qualquer regressão introduzida na F-1.
7. Com CLIENTE, confira o acesso permitido e a ausência de administração; as rotas administrativas continuam protegidas. Não criar novas permissões. Com MASTER, os mesmos botões de salvar/comando devem funcionar pelos caminhos anteriores.
8. Encerre sessão e use Ctrl+C ao terminar. Dados em memória são descartados.

## Pendências

Aceite visual manual e correção de eventuais regressões da F-1; redesign do Assistente (F-2); tabelas/histórico (F-3); formulários/configurações (F-4); login/admin (F-5); revisão integrada (F-6). CDNs existentes ainda não foram substituídas por assets locais. Nenhuma mudança de modelo/tokens. Aguardar aprovação antes da F-2.
