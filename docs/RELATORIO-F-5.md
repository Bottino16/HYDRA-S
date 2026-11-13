# F-5 — Login e Administração premium

## Escopo

Modernização visual e estrutural das duas telas existentes. Somente F-5. Continuamos em SIMULAÇÃO, sem Arduino e com firmware NÃO VALIDADO fisicamente. Nenhuma implementação de F-6 ou Fase 4.5.

Não houve alteração de backend, APIs, banco/migrações, autenticação/sessões, CSRF, política de senhas, papéis/permissões, Ollama/modelo/tokens, bombas/travas/fila/ACK, firmware ou protocolo serial. `.env` e segredos não foram modificados ou versionados. Não houve instalação ou abertura de rede/firewall.

## Auditoria da interface anterior

Login usava os campos `campo-usuario` e `campo-senha`, token GET `/api/auth/csrf` e POST `/api/login`. Após sucesso, limpava `sessionStorage` e abria `/arthur.html`. Esse fluxo permanece.

Administração já implementava GET/POST `/api/usuarios`, PUT/DELETE `/api/usuarios/:id`, redefinição de senha no mesmo PUT, troca da própria senha por `sdaChangePassword()` e saída por `sdaLogout()`. Não havia na interface operação de ativação/desativação ou expiração de conta. Não foram adicionadas.

`nivel` conserva `master/cliente`. `plano` conserva `basico/premium` como valores do cadastro, sem cobrança ou contratação implementada. Os antigos rótulos de planos comerciais foram substituídos por **Classificação legada**, com explicação. Nenhuma mudança de permissão decorre desta reformulação.

Os antigos “logs do sistema” eram somente uma linha de abertura do painel, com data gerada no navegador, e limpeza do próprio DOM. Agora são **Registro temporário desta tela**, explicitamente sem persistência ou auditoria do servidor. A limpeza mantém confirmação e não chama API.

## Melhorias entregues

### Login

- Composição própria HYDRA-S, identidade água/automação em CSS, sem imagens pesadas ou animações contínuas.
- Formulário semântico com rótulos, autocomplete, senha oculta e envio por botão/Enter. Não existe cadastro público, recuperação de senha ou método novo de autenticação.
- Estado de carregamento, `aria-busy`, prevenção de envio duplicado enquanto pendente, erro de credenciais como texto seguro e mensagem em português para falha de conexão.
- Tema claro/escuro compartilhando `sda_tema` com o painel; preferência exclusivamente visual. Sem tokens de sessão no armazenamento do navegador.
- Composição reduzida no celular, preservando identificação e formulário sem altura fixa que impeça rolar.

### Administração

- Cabeçalho de gestão da instalação, retorno ao painel, troca da própria senha e encerramento da sessão.
- Criação de conta separada da listagem; campos identificados, instrução da política de senha existente e explicação da classificação legada.
- Tabela segura de usuários, papéis, classificação e estado real quando retornado. Estado ausente é “Não informado”; não se infere ativação. Senhas nunca são exibidas, nem como suposto dado recuperável.
- Ações Editar/redefinir senha e Excluir preservadas. No celular, linhas em cartões com rótulos e as mesmas ações acessíveis. Nenhum filtro ou limite de consulta novo.
- Diálogo de edição com título/nome acessível, senha opcional, foco inicial, ciclo Tab, Escape e retorno do foco ao acionador. Cancelar não envia alterações. Inputs preservados em erro; senha de edição inicia vazia como antes.
- Carregamento, lista vazia e falha de consulta não mantêm dados antigos como atuais. Criação/edição mostram envio pendente e bloqueiam envios duplicados do mesmo formulário.
- Confirmação de exclusão e proteções de último MASTER/usuários continuam dependendo do backend existente.

MASTER continua sendo o único papel administrativo. O bloqueio HTTP de CLIENTE não depende de ocultar a interface. A página também mantém sua verificação de sessão antes de consultar contas.

## Arquivos modificados

| Arquivo | Responsabilidade |
| --- | --- |
| `public/login.html` | Composição e formulário de login |
| `public/login.js` | Estados visuais, envio semântico e proteção contra duplicação, sem mudar autenticação |
| `public/access.css` | Componentes leves compartilhados pelas duas telas e login responsivo |
| `public/access-theme.js` | Preferência de tema compatível com o painel |
| `public/painel-adm.html` | Estrutura administrativa, tabela/diálogo, estados e operações preexistentes |
| `public/admin.css` | Layout administrativo, cartões móveis e modais |
| `test/access-ui.test.js` | Seis testes DOM com respostas simuladas |
| `docs/RELATORIO-F-5.md` | Este relatório e roteiro manual |

As páginas deixam de precisar das suas antigas fontes/ícones externos: usam fallback do design system e símbolos leves. Isso não implementa a apresentação offline do restante do sistema nem a Fase 4.5.

## Commits

1. `558b0bf` — login premium e temas compartilhados.
2. `7394052` — organização administrativa e nomenclatura fiel dos campos legados.
3. `7080175` — tabela segura, operações e feedback dos formulários.
4. `4def61f` — responsividade, foco no diálogo e erro de conexão no login.
5. Commit de testes/documentação desta entrega — testes novos e relatório final.

## Testes executados

```powershell
node --test test/auth.test.js
node --test test/access-ui.test.js
node --test --test-concurrency=1
```

- Autenticação: **19 verificações aprovadas**, zero falhas. Inclui login válido/inválido, logout/invalidação, acesso administrativo recusado ao CLIENTE, CSRF, política de senha, sockets, isolamento e XSS.
- Testes novos: **6/6 aprovados**, cobrindo CSRF/payload de login, carregamento/duplicação, erro seguro, sucesso/limpeza local, desconexão em português, tabela sem XSS, estado da conta, dados/rótulos móveis, foco/cancelamento do diálogo, payloads POST/PUT/DELETE, confirmação da exclusão, falha preservando formulário, limpeza apenas local, delegação ao logout existente, cliente sem consulta de contas e temas/rótulos.
- Uma primeira execução dos testes novos encontrou problema no ciclo de foco do diálogo na seleção dos controles; corrigido mantendo a ordem do DOM. Nenhuma expectativa de segurança foi reduzida.
- Suíte completa: **97 testes, 94 aprovados, zero falhas e três integrações SQL opcionais ignoradas**, em aproximadamente 87 segundos. Saída local em `.data/tests-f5-all.txt`, ignorada pelo Git. Inclui regressões de navegação/rascunhos, streaming, histórico/CSV, configurações, UI-3, comandos simulados e autenticação.

Os testes usam contas e banco de ensaio em memória, providers simulados e sessões controladas. Não utilizam seu MySQL real, Arduino, API paga ou geração real do Ollama. O teste DOM de login bem-sucedido verifica os efeitos locais; o redirecionamento efetivo do navegador permanece no roteiro manual. A suíte de autenticação verifica o login no backend real de teste.

## Limitações e pendências

- **Não houve validação visual real no navegador.** O bloqueio anterior de acesso local da ferramenta não foi contornado. Testes DOM não equivalem à inspeção de geometria, contraste percebido, leitor de tela ou teclado virtual. As seis larguras e os dois temas exigem conferência manual.
- As falhas temporárias de tempo real relatadas na F-4 continuam documentadas em `RELATORIO-F-4.md`; **não reapareceram na execução completa desta F-5**. Não foram modificadas regras operacionais ou expectativas para escondê-las. Esse resultado não determina a causa das falhas anteriores.
- Falha de acionamento da bomba de irrigação permanece pendência operacional **não investigada e não corrigida** nesta etapa.
- Registro temporário da administração não é histórico persistente. Ativação/desativação, validade, permissões individuais e recursos comerciais não foram acrescentados à interface.
- Firmware segue NÃO VALIDADO fisicamente. Modo memória perde dados temporários ao reiniciar.

## Roteiro manual de avaliação

1. Na pasta do projeto, use o ambiente local já configurado em `SIMULATE=true`, `DB_MODE=memory`, loopback, com suas credenciais existentes. Execute `npm start` se o servidor ainda não estiver rodando. Não execute setup/reset/migração e não altere portas ou modelo para avaliar a F-5.
2. Abra `http://localhost:3000/login.html` e atualize com Ctrl+F5. Teste claro/escuro. Tab deve percorrer campos/botão, e Enter deve enviar apenas uma solicitação. Confira que a senha permanece oculta.
3. Faça uma tentativa incorreta, respeitando o bloqueio temporário existente; a mensagem deve ser legível e o botão liberado. Depois entre com a conta MASTER válida e confira o redirecionamento ao painel, sem bypass. Não publique a senha.
4. Abra Administração pelo menu. Confira criação, listagem e registro temporário com descrições fiéis. Básico/Premium não devem parecer assinatura contratada. Estado deve vir do dado da conta; não existe botão novo para ativar/desativar.
5. No banco em memória de teste, crie uma conta CLIENTE com nome simples e senha forte. Edite nome/classificação, deixando senha vazia para mantê-la; confira a atualização. Se quiser testar redefinição, use outra senha forte. Credenciais não devem aparecer em tabela, registro local ou mensagens.
6. Abra Editar pelo teclado. Confira foco inicial, Tab/Shift+Tab contidos, Escape/Cancelar sem gravação e retorno ao botão de origem. Cancele uma exclusão e confira que a conta permanece; depois exclua somente uma conta de teste. Não exclua sua conta MASTER para avaliar o layout.
7. Em sessão separada, entre com CLIENTE e tente abrir `/painel-adm.html` e `/api/usuarios`: devem continuar recusados pelo backend (403), independentemente dos botões visuais. Não conceda MASTER para contornar esse teste.
8. Confira o registro temporário e sua limpeza confirmada: não representa exclusão de eventos do histórico operacional. Reabrir a página produz a linha de abertura novamente.
9. Encerre a sessão. Tentar reabrir o painel sem login deve voltar ao login; confirme também a autenticação novamente após isso.
10. Confira 360, 390, 768, 1024, 1440 e 1920 px, nos dois temas. No celular, lista em cartões, nenhuma ação cortada, botões confortáveis, nomes longos sem alargar a página e diálogo rolável com o teclado virtual. Cabeçalhos e indicadores não podem encobrir os controles.
11. Retorne ao painel e confira F-1/F-2/F-3/F-4/UI-3. Não é necessário acionar bombas ou mudar Ollama para avaliar esta entrega. Encerre com Ctrl+C quando terminar; dados em memória são temporários.

Aguardar aprovação antes da F-6.
