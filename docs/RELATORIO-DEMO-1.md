# DEMO-1 — demonstração de irrigação em SIMULAÇÃO

## Escopo e diagnóstico

O simulador existente (`src/simulated-board.js`) já movimentava os níveis quando as saídas do controlador estavam ligadas. O problema para a gravação era preparar e coordenar um cenário reproduzível: o solo inicial podia estar úmido, e não havia um roteiro controlado das três bombas. Foi acrescentado um sequenciador do simulador, sem outro backend e sem alterar `PumpControl`, firmware ou protocolo.

O Digital Twin já recebia `rio`, `poco`, `caixa`, `solo` e `pumps` por `estado_sistema`. Os números continuam vindo desses campos, com validação de conexão e disponibilidade. Rio e Poço são percentuais virtuais do simulador; Caixa também é simulada; Solo é escala relativa, não teor volumétrico. As cinco boias continuam derivadas das mesmas regras do simulador: presença no Rio, mínima/máxima no Poço e mínima/máxima na Caixa. Boias não são sensores percentuais.

## Comportamento entregue

- Controles MASTER dentro do Digital Twin: iniciar, pausar, retomar, reiniciar e encerrar. CLIENTE mantém leitura e suas permissões anteriores.
- Cenário inicial: Rio 85%, Poço 10%, Caixa 8%; solo cinco pontos abaixo do limiar seco vigente, respeitando a calibração existente. Se a calibração impedir essa preparação, a operação é recusada.
- Captação até Poço atingir pelo menos 80%; transferência até Caixa atingir pelo menos 60%; irrigação até o solo atingir o limiar úmido vigente. Nenhum limiar operacional é substituído pelo roteiro.
- Abertura de 8 segundos e intervalos de apresentação de 25 segundos entre etapas. São esperas adicionais; os temporizadores de segurança não foram acelerados.
- Pausa solicita desligamento confirmado e congela a evolução física virtual. Telemetria, sequência, heartbeat e relógio de segurança continuam funcionando. Retomar respeita o intervalo mínimo entre ciclos, podendo demorar mais.
- Reiniciar repõe somente o cenário virtual, sem recriar o controlador nem apagar seus temporizadores ou o histórico. Encerrar desliga as saídas pelo caminho seguro e deixa modo MANUAL.
- Ao concluir, saídas desligadas e níveis finais congelados para gravação. Use **Encerrar demonstração** para liberar os controles normais e a evolução usual do simulador.
- Durante a reserva da demonstração, acionamentos concorrentes, troca de modo/limiares/calibração e troca de cenário são recusados. Um comando normal de desligar encerra primeiro a demonstração. Agendamentos ativos impedem iniciar; desative-os antes de gravar.
- Leituras, acionamentos e eventos usam os mecanismos existentes. Acionamentos registram origem `demonstracao`, conta responsável e identificação de simulação.
- Tubulações e irrigação só animam com saída confirmada. Alturas ilustradas do Poço/Caixa acompanham percentuais virtuais durante a demonstração, sem representar volume físico. Rio permanece ilustração conceitual. Movimento reduzido mantém a informação sem animação.

## Segurança e limitações

Preservados boot seguro, cinco boias, validade dos sensores, proteção a seco, máximo por ciclo, intervalo mínimo de 30 segundos, separação de partidas de 2 segundos, máximo de uma bomba simultânea, fila, ACK, sessão, CSRF e autorização MASTER. Testes usam relógio virtual para percorrer esses mesmos intervalos, sem reduzir constantes de produção.

**Não existe uma parada de emergência global dedicada nesta versão auditada do repositório.** Não foi inventada nem implementada nesta etapa. Encerrar demonstração e os comandos existentes de desligar foram preservados; isso não equivale a validar uma função global inexistente. Falhas bloqueiam a sequência; sem telemetria/ACK, nenhum estado físico é presumido.

Nenhum comando foi enviado a Arduino. Exclusivamente SIMULAÇÃO; firmware NÃO VALIDADO fisicamente. MySQL, `.env`, esquema, migrações, autenticação e integração Ollama não foram modificados. Não houve perguntas ao modelo real nem respostas falsas: IA-3D continua pendente de validação real.

## Arquivos

Implementação: `src/services/irrigation-demo.js`, `src/services/device-service.js`, `src/simulated-board.js`, `src/controllers/monitoring-controller.js`, `public/maquete.js`, `public/digital-twin.js`, `public/digital-twin.css`.

Testes: `test/irrigation-demo.test.js`, `test/demo-api.test.js`, `test/water-experience.test.js`, `test/phase2.test.js`. O ajuste na fixture de Fase 2 somente carrega `digital-twin.js` antes de `maquete.js`, como já ocorre na página real; não remove asserções nem altera permissões.

## Roteiro de gravação e servidor principal

1. Entre como MASTER em uma instância com `SIMULATE=true`. Desative agendamentos simulados ativos antes de começar.
2. Na Visão Geral, confira **SIMULAÇÃO ATIVA**, conexão e valores disponíveis.
3. Clique **Iniciar demonstração**. Grave o percurso completo; a sequência coordena as três bombas automaticamente por pedidos sujeitos às travas existentes.
4. Para interromper a gravação, clique **Pausar demonstração**. Confira saídas desligadas e números estáveis. **Retomar demonstração** mantém o roteiro e aguarda segurança quando necessário.
5. Use **Reiniciar demonstração** para uma nova tomada; uma partida recente pode exigir espera de 30 segundos. O histórico anterior permanece.
6. Ao terminar, clique **Encerrar demonstração**; confira as três saídas desligadas e modo MANUAL. O uso normal volta a ser permitido.
7. Em Histórico e Eventos, atualize as listas e confira as três bombas, origem demonstração e eventos do roteiro. Em memória, esses registros não sobrevivem a uma reinicialização.

O processo principal de `127.0.0.1:3000` não foi encerrado nem reiniciado. A configuração local lida indica modo memória, mas não foi possível confirmar o conteúdo da memória do processo sem sua sessão. Portanto, trate contas, sessões e conversas como potencialmente temporárias e valiosas. Carregar o novo backend nessa porta exige reinicialização **somente após autorização do usuário**, conforme item 12 da solicitação.

Foi usada uma instalação isolada em `http://127.0.0.1:3101`, memória descartável e credenciais temporárias aleatórias não publicadas. Nenhuma exposição à LAN. O navegador de desenvolvimento já está autenticado nessa instalação; ela não compartilha contas, sessões ou conversas com a porta 3000.

## Evidências e resultados

### Ensaios em tempo real no simulador

Dois ciclos completos foram observados na prévia atualizada, incluindo reinício, pausa e retomada pela interface. Um ciclo sem pausa, amostrado a cada segundo, levou **105,743 s** entre a primeira amostra em execução e a primeira concluída (aproximadamente 107 s a partir do clique). No máximo uma saída esteve ligada por vez. Os valores finais desse ensaio foram:

| Campo | Inicial | Final |
|---|---:|---:|
| Rio | 85% | 67% |
| Poço | 10% | 28% |
| Caixa | 8% | 43% |
| Solo, escala relativa | 10% | 30% |

O limiar vigente nesse ambiente era 30%; isso é configuração do controlador, não recomendação agronômica universal. O aumento temporário do Poço e da Caixa foi registrado durante suas respectivas etapas. Arredondamentos e o intervalo da telemetria podem produzir pequena ultrapassagem das metas visuais.

Um ensaio anterior de repetição encontrou discrepância entre a meta de solo capturada e o limiar vigente: a trava desligou corretamente a Bomba 3, mas o roteiro interpretou a parada como precoce. O sequenciador passou a consultar o limiar vigente; não alterou o controlador. Um teste determinístico específico reproduz a mudança de limiar e verifica a conclusão.

O histórico no navegador exibiu seis acionamentos concluídos dos dois ciclos, com origem `demonstracao`, `Conta #1` da instalação temporária e marca SIMULAÇÃO. Os eventos exibiram início, captação, transferência, irrigação, pausa, retomada, conclusão e encerramento. Volumes permaneceram indisponíveis sem vazão calibrada; nenhuma medição foi inventada.

A prévia descartável foi reiniciada após os ensaios para carregar o ajuste final de tratamento de desconexão. Seus dados de teste não pertencem à instalação principal. As capturas e o resumo do ciclo foram preservados neste diretório; a prévia foi deixada pronta para outra tomada.

### Verificações visuais

Revisão no navegador integrado em **360, 390, 768 e 1440 px**, sem rolagem horizontal nas larguras verificadas. Botões móveis em duas colunas, encerramento em largura total e áreas de toque de pelo menos 44 px. Desktop revisado nos temas escuro e claro; celular e tablet revisados no tema escuro. Teclado virtual e dispositivos físicos não foram testados. A geometria aprovada do circuito permaneceu preservada pelos testes de fidelidade.

Capturas em `docs/evidencias-demo-1/`: captação, transferência, irrigação ativa, conclusão, histórico de acionamentos, desktop claro, tablet e celulares. `ciclo-observado.json` contém somente telemetria simulada e o resumo temporal, sem credenciais.

### Testes automatizados

Novos testes determinísticos verificam ciclo completo e ACK, simultaneidade, níveis e solo, pausa com telemetria fresca, retomada com cooldown, reinício sem apagar retenção, encerramento, rio seco, boias contraditórias, limiar vigente e perda de telemetria. A integração HTTP cobre anônimo 401, CSRF 403, CLIENTE 403, conflitos 409, registros normais e recusa do modo demonstração no hardware antes de qualquer escrita serial.

Os testes de apresentação verificam botões MASTER, ausência para CLIENTE, dados zero válidos, desconexão e coerência de tubulações/irrigação com os estados confirmados. A suíte inclui autenticação, protocolo, APIs de bombas, navegação, configurações, histórico, Análise Ambiental V5 e preservação de seções.

Uma execução intermediária teve uma falha de sincronização no teste antigo de cartões vencidos: o valor ainda estava no placeholder antes de receber a atualização. A fixture agora aguarda a primeira leitura e a atualização vencida, com timeout de 5 s, em vez de dormir 350/50 ms. Todas as asserções de indisponibilidade e XSS foram preservadas. Nenhuma correção operacional foi feita para acomodar o teste.

Comando da suíte pertinente:

```powershell
node --test --test-concurrency=1 test/irrigation-demo.test.js test/demo-api.test.js test/device-api.test.js test/protocol.test.js test/water-experience.test.js test/phase2.test.js test/auth.test.js test/dashboard.test.js test/environment-v5.test.js test/history-ui.test.js test/settings-ui.test.js test/frontend-sections.test.js test/ui-navigation.test.js
```

Testes determinísticos não representam ensaio físico nem validação do Ollama real. O modelo real, MySQL e hardware físico não foram acionados nesta validação.

Resultado da execução final: **90 testes aprovados, zero falhas, zero pulados**, em 193,430 s. O resultado inclui o ajuste final de desconexão e a espera por estado na fixture. Logs locais ignorados pelo Git: `.data/tests-demo-verified.txt`. A verificação `git diff --check` também terminou sem erros.

## Commits e pendências

- `faa5276` — sequenciador integrado ao simulador, rota existente e testes de segurança/API.
- `6ac15fb` — controles e sinais no Digital Twin, testes de apresentação e fixture de Fase 2.
- Relatório e evidências em commit documental separado, identificado na entrega final.

Pendências: autorização antes de reiniciar o servidor principal; avaliação visual e gravação pelo usuário; teclado virtual e aparelhos físicos; parada de emergência global dedicada não existente nesta versão; IA-3D ainda sem validação real. Nenhuma correção operacional L-2 foi aplicada. O arquivo anterior `docs/RELATORIO-IA-2E.md` foi deixado intacto e fora dos commits desta etapa.

Estado esperado ao entregar: somente esse relatório antigo permanece não rastreado; os arquivos DEMO-1 estão commitados. A prévia 3101 permanece em loopback, exclusivamente simulada, sem iniciar outra etapa.
