# Ajuste de hierarquia das bombas — Visão Geral

Entrega: 17/11/2026. Somente reorganização de apresentação; SIMULAÇÃO, firmware NÃO VALIDADO fisicamente.

## Auditoria

Os módulos premium da Water Experience já eram links sem botões de ligar/desligar. Os comandos principais eram gerados abaixo, mas sem uma região operacional semântica própria. Existia também um bloco legado da Bomba 3 no grid da Análise Ambiental, criando uma segunda localização de comandos fora do controle principal.

## Alterações

- Resumos mantêm códigos B01/B02/B03, nomes, funções, percursos, estado confirmado e chips existentes, sem inputs ou botões operacionais.
- Texto explicativo diferencia resumo e operação. Atalho visível passa a “Ir para controles”; aria-label, href e IDs de destino continuam iguais.
- Região acessível `#pump-operation`, nomeada por “Controle das bombas”, reúne barra de modo, três cartões, durações, comandos, feedbacks e aviso de segurança.
- O mesmo elemento `.legacy-manual` é movido para essa região, mantendo o recolhimento, campos, valores, IDs e eventos. As ações legadas permanecem disponíveis como controles adicionais nessa única área operacional; não houve criação, remoção ou unificação de handlers/rotas.
- Separador discreto e descrição tornam a hierarquia explícita. Análise Ambiental deixa de hospedar comandos manuais.

Arquivos: `public/maquete.js`, `public/overview-v41.css`, `test/water-experience.test.js` e este relatório. HTML, backend, APIs, autenticação/permissões, banco, firmware/protocolo, ACK/fila/travas, simulação e IA não foram alterados.

## Testes

**46 aprovados, 0 falhas**, aproximadamente 36,60 segundos, incluindo subtestes:

```powershell
node --test --test-concurrency=1 test/water-experience.test.js test/overview-v2.test.js test/protocol.test.js test/auth.test.js test/device-api.test.js test/environment-v5.test.js test/ui-navigation.test.js
```

Teste novo verifica: ausência de comandos no resumo; seis botões principais dentro da região operacional; mesmos alvos focáveis; um único bloco legado, preservando identidade do nó, input/valor/listener e chamadas existentes; clique em resumo sem novas requisições. Regressões verificam estados confirmados, leituras ausentes/zero, permissões, ACK/NACK/fila, segurança HTTP/sockets, ambiente V5 e navegação com streaming simulado. Comparação textual dos handlers de comandos e modos confirmou preservação. `git diff --check` passou, com apenas avisos de normalização LF/CRLF.

## Navegador

Prévia isolada, em memória e loopback, sem MySQL nem Ollama. Desktop 1440px: clique no resumo da Bomba 2 preservou hash `#pump-card-2` e foco no cartão. Celular 390px: Enter no resumo da Bomba 3 preservou hash/foco; sem overflow horizontal; bloco legado abriu dentro da região operacional. Nenhum erro de console capturado. Nenhuma bomba foi acionada na inspeção visual.

Captura local: `.data/pump-hierarchy-desktop.jpg`. Prévia PID 10852 encerrada após conferir propriedade da porta 3101; ausência de listener confirmada e credencial efêmera removida. Outros serviços e configurações persistentes preservados.

## Commits

- `3e0ed63` — implementação visual e teste de hierarquia.
- Relatório em commit documental separado, identificado no histórico Git.

## Limitações e roteiro

Não houve teste físico nem matriz visual exaustiva de temas/dispositivos. As ações legadas ainda têm seu formulário próprio, porém somente dentro da mesma seção oficial; eliminar ou unificar esse formulário exigiria um pedido separado, pois envolveria contratos e unidades diferentes (minutos versus segundos). Nenhuma correção operacional foi feita.

1. Inicie o sistema pela configuração habitual em SIMULAÇÃO e abra Visão Geral; use Ctrl+F5.
2. Confira que Water Experience mostra resumos e “Ir para controles”, sem ligar/desligar ou duração.
3. Use os três atalhos por clique e Tab/Enter. Confirme a rolagem e o foco no cartão correspondente.
4. Confira duração, ligar/desligar, estado e mensagens em Controle das bombas.
5. Abra “Ações adicionais • bomba 3”: o bloco deve estar dentro de Controle das bombas, antes da Análise Ambiental. Não é necessário enviar comandos para avaliar a composição.
6. Confira celular e ambos os temas; avalie a hierarquia antes de autorizar outra mudança.

Aguardando avaliação do usuário; nenhuma etapa seguinte iniciada. `docs/RELATORIO-IA-2E.md` permaneceu não rastreado e fora dos commits.
