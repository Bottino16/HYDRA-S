# UI-3 — Central premium de controle hídrico

13/11/2026. Somente apresentação do painel principal. **SIMULAÇÃO**, sem Arduino; firmware **NÃO VALIDADO fisicamente**.

## Transformação visual

- Cabeçalho HYDRA-S e conexão, seguidos dos quatro indicadores existentes, agora no topo. Os elementos foram movidos, não duplicados: IDs e consumidores permanecem válidos.
- Circuito Rio → Poço → Caixa → Plantação, com quatro representações HTML/SVG, preenchimento proporcional aos valores recebidos e escala relativa do solo explicitada. Percentuais ausentes, não finitos ou fora de 0–100 ficam **Sem dados**, sem preenchimento fictício.
- Cinco boias individuais: rio/presença, poço mínima/máxima e caixa mínima/máxima. Dados ausentes são desconhecidos; máxima ativa com mínima inativa aparece como contradição, sem alterar as regras do controlador.
- Conexões B1/B2/B3 seguem o mapeamento de `docs/PINOS-E-LIGACOES.md`. Verde indica saída confirmada ligada, **não vazão**. Não há animação de fluxo: o sistema não mede vazão real.
- Três cartões de bomba, cada um com percurso, estado confirmado, duração, comandos e feedback próprios. Pendente, bloqueio/erro e ausência de confirmação ficam próximos da bomba correspondente. Solicitação em andamento não muda a saída mostrada. Atributo de ocupado e mensagens de status auxiliam tecnologias assistivas.
- Seletor AUTO/MANUAL segue a telemetria, sem seleção otimista. Resposta do comando fica separada do modo confirmado.
- Alertas decodificados conforme a máscara do protocolo existente: rio/poço/caixa, falha de sensor, bloqueio, heartbeat, limite de ciclo, fila e retenção inicial. A máscara continua indicada para diagnóstico.
- Gráfico existente preservado; histórico, estimativa de consumo e eventos separados visualmente. As ações legadas da bomba 3 continuam disponíveis em um bloco recolhível. O antigo texto “corte emergencial” foi substituído por “solicitar parada • bomba 3”, pois a função existente não garante parada geral de emergência.
- Temas claro/escuro usam os tokens UI-1. Grade de sensores em duas colunas nas larguras menores, circuito vertical e cartões de bomba empilhados em celular. Alvos de toque de pelo menos 44px nos comandos móveis. Sem framework, fonte ou biblioteca novos.

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `public/maquete.js` | Estrutura do circuito, sensores, cartões, apresentação de estados, controles existentes e feedback |
| `public/dashboard.css` | Acabamento, estados, grades, temas e responsividade UI-3 |
| `public/arthur.html` | Carregamento do CSS, títulos, rótulos, ações adicionais e tratamento visual de números inválidos |
| `public/monitoring.js` | Agrupamento visual de leituras, estimativa e eventos; mesmos endpoints/IDs |
| `test/dashboard.test.js` | Quatro verificações específicas dos componentes novos |
| Este documento | Evidências e roteiro manual |

Nenhum arquivo de backend, autenticação, permissões, Ollama/Assistente, banco/migrações, firmware, protocolo, simulador ou fila foi alterado. UI-1 e renderização segura do chat permanecem intactas. `.env` não foi alterado. Não houve instalação, migração, configuração de rede nem avanço para UI-2, UI-4 ou Fase 4.5.

## Preservação operacional

Os comandos continuam em `window.sdaRequest`, que aplica sessão e CSRF: `POST /api/bombas/1..3` com `{on,ms}` e `POST /api/modo` com `{mode}`. Confirmação humana de ligar e limites de duração são preservados; backend e controlador continuam decidindo autorização, fila, travas e ACK. O novo campo por bomba mantém a mesma unidade em segundos convertida para milissegundos.

ACK pode produzir mensagem de confirmação, mas não altera o estado do cartão: este espera `estado_sistema`. Telemetria durante uma requisição não reabilita o mesmo botão pendente. O botão de desligar não é indiscriminadamente bloqueado por uma solicitação de ligar pendente. Desconexão torna as três saídas desconhecidas, apaga preenchimentos e desabilita comandos. CLIENTE continua somente com leitura e recebe 403 nas rotas de comando existentes; não foi concedida permissão adicional.

O preenchimento de rio/poço exibe apenas o nível já informado pelo backend, sem criar novas medições. Solo é escala relativa do sensor; não representa umidade volumétrica. Consumo permanece **ESTIMATIVA**, dependente da configuração de vazão existente. “Saída ligada” não comprova vazão, funcionamento mecânico ou água circulando.

## Testes

- Suíte final: `node --test --test-concurrency=1` — **74 testes, 71 aprovados, zero falhas, três ignorados**. Abrange autenticação, CSRF, logout, autorização, sockets, protocolo, ACK/travas, simulação, agendamento, histórico/CSV, Assistente/isolamento/XSS, mocks Ollama e navegação UI-1.
- Direcionados após acabamento: `node --test test/dashboard.test.js test/protocol.test.js` — **15 aprovados, zero falhas**.
- Novos componentes: correspondência dos quatro valores e cinco boias; valores inválidos e contradições; desconexão; três rotas/payloads de bomba; modo confirmado; erro/bloqueio; recusa de duração/confirmação; CLIENTE em leitura; estado conservador antes e depois do ACK; ocupação durante atualização; preservação dos IDs/indicadores/gráfico; ausência de erros capturados no teste DOM do componente.
- `git diff --check` e sintaxe dos scripts alterados verificados. Testes antigos não foram alterados nesta UI-3.
- Saídas locais, ignoradas pelo Git: `.data/tests-ui-3-final.txt` e `.data/tests-ui-3-final-components.txt`.

**Não executados:** três integrações MySQL por ausência de banco de ensaio configurado; não foi acessado/migrado o MySQL da apresentação. Nenhum teste físico. Compilação do firmware não foi repetida, pois está inalterado e fora deste escopo. Não houve inferência real adicional do Ollama.

**Limitação visual:** a ferramenta de navegador já bloqueou a seleção da aba local durante esta frente de UI. A restrição não foi contornada. Não há nova captura renderizada ou certificação visual de desktop/tablet/360px. Os testes DOM não medem geometria, contraste ou desempenho real do navegador. Não se declara ausência de erros no console de um navegador real; apenas no componente exercitado em DOM. Verificar manualmente o roteiro abaixo.

## Commits por etapa

1. `9b21e7b` — estrutura do circuito e disposição compacta.
2. `0a42d1f` — níveis, boias, alertas e testes iniciais.
3. `3b8cc28` — feedback dos comandos e modo confirmado.
4. `2df5821` — indicadores no topo e histórico organizado.
5. Acabamento responsivo/temas, SVG da plantação, testes finais e este relatório, identificado no histórico Git da entrega.

## Como avaliar

1. Se o servidor já está rodando em SIMULAÇÃO/memória, abra `http://localhost:3000/arthur.html` e use **Ctrl+F5**. A autenticação continua obrigatória.
2. Se estiver parado, use o `.env` temporário já aprovado, sem executar setup/reset/migrações:

   ```powershell
   Set-Location 'C:\Users\felip\OneDrive\Desktop\HYDRA-S'
   $cred = Get-Credential -UserName 'master_hydra' -Message 'Senha temporária do MASTER'
   $env:ADMIN_PASSWORD = $cred.GetNetworkCredential().Password
   try { npm start } finally {
       Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
       $cred = $null
   }
   ```

   Abra `http://localhost:3000/login.html` e use a conta/senha temporárias. Memória perde dados ao encerrar. Não fornecer senhas no chat.
3. Confira valores no topo e circuito, as cinco boias, os percursos das três bombas e o selo SIMULAÇÃO. Abra os dois temas. Use Tab/Enter e confira foco e leitura dos textos.
4. Em modo MANUAL, solicite ligar uma bomba por quatro segundos. Confirme: primeiro aparece pendência, e só telemetria confirmada pode mostrar ligada. Um bloqueio deve exibir o motivo. Desligar continua na mesma rota; não simula corte físico da fonte. Não conectar Arduino/bombas reais.
5. Nos controles de simulação existentes, pause telemetria e aguarde o prazo de vencimento: os indicadores devem ficar sem dados, as saídas desconhecidas e os controles indisponíveis. Retome, teste rio seco e falha DHT; confira alertas e bloqueios. Ao terminar retorne ao cenário normal.
6. Consulte o histórico/CSV. O consumo precisa continuar marcado ESTIMATIVA, ou indisponível sem calibração. Abra perfis, agendamento e as ações adicionais para confirmar que os recursos anteriores continuam disponíveis.
7. Abra o Assistente, envie uma pergunta e volte ao painel durante o streaming. Reabra o chat para confirmar preservação. Essa troca não deve criar novas requisições de bomba.
8. Confira 1440px, 768px e 360px nos dois temas; circuito e bombas devem empilhar em celular, sem rolagem horizontal global. Registre sobreposições, textos cortados, problemas de contraste e mensagens do console. Fontes, ícones e Chart.js continuam dependentes das CDNs anteriores; distribuição offline é pendência separada.
9. Encerre sessão e pressione Ctrl+C no servidor, quando terminar. Ollama pode permanecer aberto.

Próximo passo: receber a avaliação manual e corrigir eventuais problemas dentro da UI-3. Não iniciar outra etapa sem aprovação.
