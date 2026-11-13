# F-2 — Assistente do Solo premium

13/11/2026. Interface do Assistente exclusivamente. SIMULAÇÃO, sem Arduino; firmware NÃO VALIDADO fisicamente. Não foi iniciada F-3/F-4/F-5/F-6 nem Fase 4.5.

## Melhorias

Cabeçalho HYDRA-S, motor/modelo retornados pelo backend, acesso a conversas e Voltar ao painel. Identidade azul profundo/ciano com cores dos tokens existentes para os dois temas. A identificação de SIMULAÇÃO permanece no badge e no aviso educativo. Avisos completos de privacidade, limitações e firmware ficam em um bloco expansível; não foram removidos.

No desktop, histórico lateral com datas, seleção ativa, Nova conversa e paginação existentes. Em até 900px, histórico recolhível com fundo de fechamento, Escape, controle de foco e estado anunciado; o chat fica inerte enquanto o painel móvel está aberto. O seletor anterior permanece oculto como adaptador de compatibilidade, sem uma segunda lista visível. Não há exclusão, renomeação ou novos endpoints.

Mensagens com autoria, diferenciação usuário/assistente, largura de leitura limitada, código e listas estilizados. O Markdown continua no mesmo renderizador seguro, inalterado. As fontes aparecem em bloco expansível com título/identificador como texto seguro: são trechos recuperados, não garantia de que o modelo citou todos. Não há links públicos para `/knowledge`. Cópia usa o texto renderizado, inclusive de respostas parciais.

Compositor no rodapé da área de conversa, campo que cresce até um teto visual, contador de caracteres baseado no limite já recebido do backend, envio por botão ou Ctrl/Cmd+Enter e quebra de linha por Enter. Indicador de geração e botão Interromper; feedback de limite, erro, cancelamento e indisponibilidade. O teto visual de altura não muda o limite de mensagem, tokens ou contexto.

O layout usa a altura disponível e `visualViewport` quando aplicável, com regras específicas para pouca altura. Em celular, sugestões rápidas recolhem durante foco no compositor. A região principal de mensagens rola; histórico, texto longo e avisos expandidos possuem rolagem localizada apenas quando necessária. A rolagem automática acompanha quem está perto do fim; ler mensagens anteriores não força retorno ao rodapé em cada delta. Ao carregar mensagens antigas, os nós já exibidos e a posição de leitura são preservados.

Durante recuperação/paginação/criação de conversa, controles conflitantes são temporariamente bloqueados na interface. Falha ao recuperar outra conversa mantém a seleção anterior e o histórico exibido. Isso evita duplicação por cliques e respostas concorrentes sobre o mesmo DOM; não altera fila, limites ou regras do backend. Navegar pelas áreas F-1 continua sem recriar o chat, abortar geração ou apagar rascunho.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `public/assistant.js` | Estrutura, histórico lateral, drawer, mensagens/fontes, compositor, estados e foco |
| `public/assistant.css` | Layout, temas por tokens, mensagens, fontes e regras responsivas |
| `public/arthur.html` | Carrega o CSS do Assistente depois da fundação/UI-3 para controlar sua cascata |
| `test/assistant-ui.test.js` | Cinco testes específicos de interação e estados do Assistente |
| Este documento | Evidências, escopo e roteiro manual |

Não foram alterados backend Ollama, modelo, tokens/contexto, protocolo SSE, timeout, AbortController da geração, autenticação/CSRF/permissões, banco, RAG, documentos, renderizador Markdown, firmware, protocolo serial, simulador, bombas ou fila. O caminho manual de Aplicar sugestão continua com confirmação, autorização, CSRF e ACK; texto da IA não vira comando. Nenhuma nova dependência, instalação, migração ou inferência real foi executada. `.env` preservado.

## Testes

Suíte completa: `node --test --test-concurrency=1` — **81 testes, 78 aprovados, zero falhas, três ignorados**. Arquivo local ignorado pelo Git: `.data/tests-f2-final.txt`.

Após os últimos ajustes de cores de feedback e detalhe de layout, reexecutados Assistente, Ollama mock, seções e navegação: `node --test test/assistant-ui.test.js test/assistant.test.js test/ollama.test.js test/frontend-sections.test.js test/ui-navigation.test.js` — **32 aprovados, zero falhas**. Saída: `.data/tests-f2-targeted-final.txt`. Sintaxe e `git diff --check` verificados.

Os cinco testes novos cobrem seleção/criação/recuperação, paginação de conversas e mensagens, preservação de nós, fontes/HTML malicioso como texto, Markdown seguro, cópia, envio por Ctrl+Enter, contador, deltas SSE, rolagem sem interromper leitura, rótulos de modelo/SIMULAÇÃO, limite de resposta, cancelamento do mesmo sinal, indisponibilidade/erro SSE, ausência de chamadas automáticas às bombas, histórico móvel, foco, Escape e rascunho ao alternar painel/chat. As regressões anteriores cobrem também isolamento entre usuários, timeout, CSRF, autorização e confirmação manual da sugestão.

**Não executados:** três integrações MySQL sem banco de ensaio configurado; nenhum acesso/migração no MySQL da apresentação. Nenhum teste físico ou compilação de firmware, que permanece inalterado. Nenhuma chamada real adicional à IA.

**Limitação visual:** o navegador já bloqueou a seleção da aba local nesta frente, e o bloqueio não foi contornado. Não há novas capturas ou testes renderizados desta entrega. JSDOM e simulação de media query não medem geometria, contraste, teclado virtual, área segura ou comportamento real do clipboard. Não se declara aprovação visual das larguras nem ausência de erros no console do navegador real. Os temas usam os mesmos tokens, mas seu aceite visual continua manual.

## Commits

1. `50c0713` — workspace e cabeçalho.
2. `c94f2aa` — histórico lateral e seleção.
3. `5de020c` — mensagens, fontes e posição de leitura.
4. `ab637b5` — compositor e estados de geração.
5. Responsividade, acessibilidade, testes e relatório, identificado no histórico da entrega.

## Como avaliar

1. Com o servidor local em SIMULAÇÃO/memória já aberto, entre em `http://localhost:3000/arthur.html`, use Ctrl+F5 e selecione Assistente do Solo. Se estiver parado, use o procedimento de conta temporária previamente aprovado, sem setup/migrações:

   ```powershell
   Set-Location 'C:\Users\felip\OneDrive\Desktop\HYDRA-S'
   $cred = Get-Credential -UserName 'master_hydra' -Message 'Senha temporária do MASTER'
   $env:ADMIN_PASSWORD = $cred.GetNetworkCredential().Password
   try { npm start } finally {
       Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
       $cred = $null
   }
   ```

   Esse procedimento pressupõe o `.env` anterior com `DB_MODE=memory`, `SIMULATE=true`, loopback e Ollama. Abra `http://localhost:3000/login.html`. Não fornecer senha no chat. Memória perde contas/conversas ao encerrar.
2. Confira **Ollama local • llama3.2:3b**, SIMULAÇÃO, Voltar ao painel e os avisos expansíveis. Se o provedor estiver indisponível, deve aparecer erro claro sem trocar para Claude ou demonstração.
3. Pergunte “Por que calibrar o sensor capacitivo?”. Observe os fragmentos, o indicador e Interromper. Leia acima durante geração para verificar que novos deltas não puxam a leitura ao fim. Respostas podem terminar no limite existente: nenhum aumento foi feito.
4. Copie a resposta, expanda fontes e teste texto com listas/código. HTML recebido deve continuar texto, sem elementos executáveis. Confira clareza de resposta parcial e de limite atingido.
5. Crie outra conversa, selecione a anterior e confira recuperação/seleção. Se houver páginas adicionais, use Mais conversas e Carregar mensagens anteriores. Não existem excluir/renomear.
6. Envie uma pergunta e alterne Histórico/Configurações/Visão Geral enquanto gera; retorne ao chat e confira continuidade. Digite um rascunho e alterne novamente: ele deve permanecer. Navegar não deve executar comando de bomba.
7. Interrompa uma resposta e confira a liberação dos controles. Use Enter para quebra de linha, Ctrl+Enter para enviar, Tab/Shift+Tab e Escape. Copiar pode exigir permissão do navegador; falha deve produzir orientação textual, sem afetar o chat.
8. Confira **360, 390, 768, 1024, 1440 e 1920px**, em ambos os temas. Em celular, abra Conversas, feche por botão/fundo/Escape e abra o teclado virtual real: o compositor deve permanecer acessível. Verifique área segura, orientação horizontal, zoom, mensagens longas e fontes expandidas. Registre sobreposição, rolagens concorrentes ou textos cortados. No computador, confira o histórico lateral e largura confortável das mensagens.
9. Verifique o console real ao enviar, cancelar e alternar seções. Se houver erro ou problema visual, registrar para ajuste dentro da F-2. Não conectar Arduino nem bombas reais.
10. Encerre sessão e use Ctrl+C ao terminar. Ollama pode permanecer aberto.

## Pendências

Aceite visual e teste de teclado virtual/clipboard real; eventuais correções da F-2. Fontes, ícones e Chart.js das demais áreas mantêm as dependências de CDN anteriores. Não foi implementado redesign de histórico operacional/configurações/administração. Nenhuma alteração de limites/modelo, nem continuação automática de respostas. Aguardar aprovação antes de outra etapa.
