# UI-1 — Fundação visual e navegação

13/11/2026. Operação exclusivamente em SIMULAÇÃO. Firmware NÃO VALIDADO fisicamente.

## Entrega visual

Identidade HYDRA-S com azul profundo, ciano, superfícies sólidas, bordas discretas, espaçamentos e controles consistentes. Fundação de cores dos temas escuro e claro aplicada ao painel e Assistente. Sem novas dependências, bibliotecas ou downloads. Tipografia com alternativas do sistema caso a fonte externa não carregue. Redução de transparências/desfoque e suporte à preferência de movimento reduzido.

Navegação lateral organizada em operação e ferramentas/conta. Entrada explícita **Painel principal**, seleção da seção ativa, marca HYDRA-S e espaço próprio para o Assistente. Textos de navegação permanecem visíveis em celular. Menu recolhível até 800px, fechamento por Escape ou fundo, foco controlado e menu fechado fora da navegação por teclado. Link para saltar ao conteúdo e foco visível.

Assistente com cabeçalho e **Voltar ao painel** destacado. Alternar seções só muda visibilidade e foco: preserva DOM, conversa e streaming. Sem redesign completo do chat. Notificações agora são uma seção irmã do botão acionador; “Limpar tudo” é um botão real. Escape fecha o painel e o acionador anuncia expansão. Conteúdo, persistência e regras das notificações foram preservados.

Botões/campos existentes recebem a base visual, incluindo os controles criados dinamicamente. Nenhum envio, confirmação, trava ou ACK foi modificado. Login/administração terão sua padronização própria em UI-4; esta entrega cria a fundação reutilizável sem redesenhar essas páginas.

## Arquivos

- `public/ui-foundation.css`: variáveis de tema, componentes, navegação e regras responsivas.
- `public/ui-navigation.js`: menu móvel, Escape, foco e reação à troca de seção.
- `public/arthur.html`: estrutura do menu/notificações, identidade, ponto de entrada do painel e carregamento da fundação.
- `public/assistant.js`: destino do item de navegação, seleção ativa, botão de retorno e foco. Transporte SSE, composição de mensagens e ações preservados.
- `test/ui-navigation.test.js`: três testes de estrutura, navegação móvel/desktop e preservação de conversa/streaming.
- `test/assistant.test.js`: expectativa do rótulo alterada de “Voltar à telemetria” para “Voltar ao painel”; fixture define provedor legado vazio explicitamente para não herdar Ollama do `.env` local. Nenhuma expectativa de segurança foi enfraquecida.
- Este relatório.

Não houve alterações em backend, autenticação, permissões, banco/migrações, firmware, protocolo, lógica de bomba, sensores simulados, configuração Ollama ou limites de tokens. `.env` não foi alterado. Nenhuma mudança de rede/firewall. Não foi iniciada UI-2 ou Fase 4.5.

## Verificação

`node --test --test-concurrency=1`: 70 testes no total, 67 aprovados, zero falhas, três integrações MySQL ignoradas. Inclui regressões de autenticação, CSRF, logout, sockets, autorização de bombas, ACK/travas, Assistente, isolamento, XSS, mocks Ollama e os três testes novos de navegação. Saída local ignorada pelo Git em `.data/tests-ui-1-final.txt`.

A primeira tentativa foi interrompida ao detectar que a fixture antiga herdava `ASSISTANT_PROVIDER=ollama` do `.env` criado para o teste manual. A suíte foi isolada de novo por configuração da fixture, sem alterar produção. Essa execução interrompida não é contada como aprovação. Não foi planejado nem realizado benchmark adicional do Ollama.

Testes DOM confirmam notificações fora do botão, links existentes, menu recolhível, Escape/backdrop, acesso desktop e troca painel/chat enquanto chegam deltas SSE, sem abortar a resposta ou recriar mensagens. Não medem geometria nem contraste renderizado.

**Revisão visual no navegador não executada:** a ferramenta rejeitou a seleção da aba local por política de URL. Nenhum contorno foi tentado. Capturas e validação de pixels em desktop, tablet, 360px e dois temas permanecem manuais. Portanto esta entrega não declara responsividade visual certificada. Não foram acionadas bombas físicas nem exercitado MySQL; as três integrações SQL precisam de banco de ensaio separado e não foram habilitadas.

## Avaliação manual

1. Inicie pelo procedimento temporário aprovado: `.env` mantém `DB_MODE=memory`/`SIMULATE=true`, e a senha MASTER é fornecida apenas no processo. No PowerShell:

   ```powershell
   Set-Location 'C:\Users\felip\OneDrive\Desktop\HYDRA-S'
   $cred = Get-Credential -UserName 'master_hydra' -Message 'Senha temporária do MASTER'
   $env:ADMIN_PASSWORD = $cred.GetNetworkCredential().Password
   try { npm start } finally {
       Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
       $cred = $null
   }
   ```

2. Abra `http://localhost:3000/login.html`, entre e atualize com Ctrl+F5 para carregar o CSS novo. Não executar setup/migrações para essa avaliação.
3. Confira a lateral HYDRA-S e a seleção em Painel principal. Abra Assistente, inicie uma pergunta e volte ao painel durante a resposta. Reabra: a conversa deve continuar. Confira rótulos de Ollama/modelo e SIMULAÇÃO.
4. Abra notificações, use Tab para “Limpar tudo”, e Escape para fechar. Alterne o tema; confira legibilidade dos controles e mensagens.
5. No modo responsivo do navegador, confira 1440px, 768px e 360px, em ambos os temas. Menu móvel abre, fecha por fundo/Escape, preserva textos e permite teclado. Verifique sobreposições, rolagem e foco; registrar problemas para correção dentro desta etapa.
6. As bombas devem continuar com os estados confirmados anteriores e comandos sujeitos às mesmas confirmações/travas. Sem dados deve continuar explícito. Nenhum ensaio de hardware é autorizado.
7. Encerre sessão e use Ctrl+C. Dados em memória são descartados; Ollama pode permanecer aberto.

## Pendências

Validação visual manual; redesign do chat/rolagem/referências (UI-2); maquete visual e histórico (UI-3); login/admin e revisão completa dos temas (UI-4); revisão final de acessibilidade (UI-5). Fontes, ícones e Chart.js continuam dependentes de CDN onde já eram usados; não foi feita a distribuição offline. Não foram aumentados tokens nem criadas funcionalidades de rede. Aguardar aprovação antes de qualquer próxima etapa.
