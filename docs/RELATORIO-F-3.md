# F-3 — Histórico e Eventos premium

## Escopo entregue

Modernização exclusivamente do frontend de Histórico e Eventos. Permanecem SIMULAÇÃO e firmware NÃO VALIDADO fisicamente. Backend, banco, autenticação, permissões, comandos de bombas, firmware, protocolo, Ollama, tokens e interface F-2 não foram alterados. A F-4 e a Fase 4.5 não foram iniciadas.

- Leituras em tabela semântica com data, valores/unidades, níveis, estados das três bombas e detalhes de boias, modo e fonte.
- Acionamentos com bomba, estado, origem, horário, estimativa e conta responsável quando registrada. O contrato fornece `usuario_id`: exibição como Conta #ID, sem inventar nomes ou consultar administração.
- Detalhes expansíveis conservam informações das colunas recolhidas em telas menores. Campos ausentes ou inválidos mostram “Sem dados”; zero válido permanece zero.
- Consumo sempre identificado como **ESTIMATIVA**, calculado somente dos volumes disponíveis nos acionamentos carregados. Ausência de volume não vira consumo zero. Cobertura informada em X de Y registros; não representa medição real ou total garantido do período.
- Eventos com hierarquia visual, severidade e filtros locais de categoria/severidade, explicitamente limitados aos registros carregados.
- Eventos ao vivo em área separada: últimos 100 recebidos desde a abertura, independentes do período consultado e dos filtros locais.
- Estados de carregamento, consulta vazia, falha e indisponibilidade. Nova consulta limpa valores antigos; solicitações duplicadas são bloqueadas durante carregamento. Falha na consulta inicial de telemetria não impede consultar os registros históricos.

## Contratos preservados

As mesmas três consultas GET usam `de`, `ate` e `limit=100`: `/api/leituras`, `/api/acionamentos`, `/api/eventos`. Não houve paginação nova nem aumento do limite. O frontend valida o período máximo de 31 dias já exigido pelo backend. Resumos indicam que usam os registros carregados, sem afirmar cobertura integral.

CSV preservado em `/api/leituras.csv`, com o mesmo período, sem o limite visual de 100. Alterar datas desabilita o link até nova consulta. A exportação continua sujeita à autorização existente. Filtros locais de eventos não modificam CSV ou requisições.

Valores dinâmicos são inseridos com `textContent`, sem HTML vindo dos registros. Nenhuma nova escrita operacional foi adicionada. A navegação mantém os elementos montados pela F-1; não reinicia o Assistente nem seu streaming. Configurações existentes continuam na sua seção e com suas permissões.

## Arquivos

- `public/history-view.js`: componentes e renderização segura dos registros.
- `public/history.css`: estilos exclusivos da seção, tokens compartilhados, temas claro/escuro e adaptação responsiva.
- `public/monitoring.js`: integração das consultas e estados visuais; controles operacionais de Configurações preservados.
- `public/arthur.html`: carregamento dos dois novos arquivos.
- `test/history-ui.test.js`: cinco testes direcionados, com DOM e API simulada.
- `test/frontend-sections.test.js` e `test/phase2.test.js`: inclusão de `history-view.js` na lista de scripts dos testes. Nenhuma expectativa de autorização ou segurança foi reduzida.
- Este relatório.

## Verificação automatizada

Comandos executados:

```powershell
node --test test/frontend-sections.test.js test/phase2.test.js
node --test test/history-ui.test.js
node --test --test-concurrency=1
```

Os testes direcionados de compatibilidade passaram: 12/12. Os cinco testes novos passaram, cobrindo valores ausentes/zero, estimativas parciais, conta registrada, conteúdo malicioso como texto, detalhes, filtros locais, eventos ao vivo, limite de 100, datas e CSV, erro de consulta, bloqueio de duplicação, cliente sem escritas e falha de telemetria. A execução final da suíte completa passou com **87 testes: 84 aprovados, zero falhas e três integrações SQL opcionais ignoradas**, em aproximadamente 87 segundos. Saída local em `.data/tests-f3-final.txt` (arquivo ignorado pelo Git).

A suíte inclui regressões existentes de autenticação/autorização, navegação, UI-3, Assistente, streaming, cancelamento, protocolo e comandos simulados. Isso não certifica hardware nem resolve a pendência operacional da bomba de irrigação. Nenhum MySQL real, modelo Ollama real ou hardware foi utilizado nesta validação.

## Limitações e pendências

- Não houve validação visual no navegador: o acesso local havia sido bloqueado pela ferramenta e não foi contornado. Testes DOM não medem sobreposições, geometria, contraste percebido, teclado virtual ou acabamento real.
- Conferir manualmente 360, 390, 768, 1024, 1440 e 1920 px, nos dois temas, e fluxo de download CSV no navegador.
- O problema relatado no acionamento da bomba de irrigação permanece **pendente, sem investigação ou correção nesta etapa**.
- Firmware continua NÃO VALIDADO fisicamente. Dados em memória desaparecem ao reiniciar.

## Roteiro manual de avaliação

1. Com o servidor local já em execução, abra `http://localhost:3000/login.html`, entre com sua conta e atualize o painel com Ctrl+F5. Não abra portas nem altere o `.env` para avaliar a F-3.
2. Caso precise iniciar, use o ambiente local previamente configurado (`SIMULATE=true`, `DB_MODE=memory`, somente loopback). Na pasta do projeto execute `npm start`. Se a senha inicial não estiver configurada, forneça-a somente no terminal, com a conta já definida em `ADMIN_USER`, antes de iniciar:

   ```powershell
   $credencialHydra = Get-Credential -Message 'Conta MASTER local: informe usuário e senha forte'
   $env:ADMIN_USER = $credencialHydra.UserName
   $env:ADMIN_PASSWORD = $credencialHydra.GetNetworkCredential().Password
   try { npm start } finally {
     Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
     Remove-Variable credencialHydra -ErrorAction SilentlyContinue
   }
   ```

   Não execute setup, reset ou migrações de banco. Se a configuração divergir de memória/simulação/loopback, pare e revise antes de iniciar.
3. Abra **Histórico e Eventos**. Confira selo SIMULAÇÃO, período, resumos, tabelas e detalhes. Dados ausentes devem aparecer como “Sem dados”; uma lista vazia deve ter mensagem própria.
4. Escolha um período com até 31 dias e clique **Consultar período**. Confira datas e limite visual de 100 por categoria. Altere uma data: o CSV fica indisponível até consultar novamente. Período invertido ou maior que 31 dias deve mostrar erro, sem manter resumos antigos como atuais.
5. Exporte o CSV e confira o período e as colunas das leituras. Ele pode ter mais registros que a tabela, pois não usa o limite visual de 100.
6. Nos eventos carregados, selecione categoria e severidade. Confira a indicação de filtro local e a mensagem sem correspondências. Eventos recebidos depois ficam na área ao vivo, sem se misturarem ao período.
7. Confira ESTIMATIVA e cobertura dos volumes disponíveis. Acionamentos sem conta registrada não devem inventar responsável. Não provoque ciclos de bomba para investigar a falha operacional nesta avaliação visual.
8. Teste as seis larguras indicadas e os dois temas. No celular abra os detalhes das linhas; confira botões, datas e ausência de rolagem horizontal da página. Eventual rolagem da tabela deve ficar no seu contêiner.
9. Use Tab, Shift+Tab e Enter para campos, botões, filtros e detalhes. Confira foco visível. Alterne Visão Geral, Histórico, Configurações e Assistente: filtros, formulário e conversa devem permanecer. Durante uma resposta do Ollama, mude de seção e volte; a navegação não deve interromper a geração.
10. Confira com CLIENTE que continuam as permissões anteriores, sem funções administrativas liberadas. Encerre a sessão pelo menu. Para encerrar o servidor, Ctrl+C no terminal; no modo memória os registros temporários serão perdidos.

## Commits

- `cfa1fbc` — tabelas, resumos, eventos e integração visual.
- `ee9aaed` — testes direcionados e acabamento de detalhes responsivos.
- Commit final desta entrega — resiliência à falha de telemetria e relatório.

Aguardar aprovação antes da F-4.
