# Visão Geral Premium V5 — Análise Ambiental

Entrega em 17/11/2026. Escopo: somente apresentação do monitoramento inferior da Visão Geral. SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.

## Diagnóstico

O gráfico ocupava duas linhas do grid, vinculando sua altura ao clima e ao bloco legado de comandos. Os cartões tinham hierarquia pouco definida e a lateral misturava contexto ambiental com operação da Bomba 3. Em telas pequenas, regras anteriores de altura também deixavam espaço excedente sob o canvas. O clima indisponível podia manter o ícone anterior após uma consulta. A apresentação externa inferia “Ensolarado” apenas porque rainy era falso, mesmo sem evidência suficiente para descrever céu aberto.

Uma linha constante em zero não é defeito visual: zero é valor válido e foi preservado. Não foram inventadas variações para melhorar a aparência.

## Composição implementada

“Análise Ambiental” recebe cabeçalho com identificação técnica, descrição discreta e continuidade com os tokens existentes. O gráfico é o elemento principal; o clima fica ao lado em desktop amplo e abaixo em notebook estreito/tablet/celular. Cartões usam azul profundo, ciano, bordas discretas, hierarquia tipográfica e transições leves, sem biblioteca adicional.

O gráfico tem título “Dinâmica da umidade”, legenda textual, escala relativa não volumétrica de 0–100%, marcações percentuais de 25 em 25, tooltip escuro com contraste explícito e altura controlada de 250px (220px no celular). Linhas retas evitam interpolação curva que sugira oscilações não recebidas. A animação existente continua respeitando movimento reduzido. Rótulos do eixo X continuam limitados a seis, com todos os pontos e horários originais preservados. Zero, null, série vazia e lacunas mantêm seus significados; não há alteração da consulta, período ou dados.

O clima tem composição compacta e identificação de CONSULTA EXTERNA, SIMULAÇÃO CLIMÁTICA, OFFLINE ou SEM DADOS. Valores externos são apresentados somente quando os campos existem e têm tipo válido; temperatura zero é válida. Não se infere céu ensolarado a partir da ausência de chuva. Estado offline não reutiliza valores/ícones anteriores. Simular e Consultar clima conservam suas funções e a mesma API; serviço meteorológico/cache não foram modificados. A consulta permanece informativa, sem novas decisões de irrigação.

## Ações adicionais da Bomba 3

A inspeção confirmou tratar-se de comandos legados, com duração em minutos, `regarManual()` e `pararRega()`, usando os caminhos protegidos existentes. Foram mantidos como bloco recolhível abaixo da análise, após o clima também na ordem do DOM. Não foram duplicados ou incorporados aos cartões operacionais da V4.1. Seus conteúdos, IDs, chamadas e regras foram preservados. Uma eventual consolidação com o controle principal fica como proposta para etapa própria; nenhuma correção L-2 foi feita.

## Arquivos

- `public/arthur.html`: composição do módulo ambiental, rótulos, apresentação climática e opções visuais do gráfico; conteúdo legado apenas reposicionado dentro do mesmo grid.
- `public/environment-v5.css`: estilos da seção inferior, temas por tokens existentes, breakpoints, dimensões e transições.
- `test/environment-v5.test.js`: testes determinísticos de dados/estados/contratos preservados.
- `docs/RELATORIO-VISAO-GERAL-V5.md`: este relatório.

Não foram alterados a maquete, reservatórios, handlers operacionais, backend/APIs, banco, autenticação/permissões, firmware/protocolo, Ollama, Assistente, login ou outras páginas. Nenhuma dependência foi adicionada. O documento não rastreado da IA-2E permaneceu fora dos commits.

## Testes

Execução final após os ajustes: **75 aprovados, 0 falhas, 0 ignorados**, aproximadamente **59,55 segundos**. Inclui subtestes; execuções repetidas não são somadas ao total.

```powershell
node --test --test-concurrency=1 test/environment-v5.test.js test/water-experience.test.js test/overview-v2.test.js test/protocol.test.js test/ui-navigation.test.js test/settings-ui.test.js test/assistant-ui.test.js test/auth.test.js test/device-api.test.js test/history-ui.test.js test/ui-polish.test.js test/access-ui.test.js test/login-experience.test.js
```

Três testes novos verificam preservação de zero/lacunas/horários e tooltip, ausência de dados, configuração de movimento reduzido, contrato CSV, clima simulado/externo com zero/offline/erro, e unicidade dos controles/IDs legados. O primeiro ensaio encontrou uma deficiência no mock de Chart (não copiava data/options); o mock foi corrigido, sem alterar dados da aplicação. Regressões cobrem V4.1, comandos/ACK/NACK/fila, autenticação/CSRF/permissões, navegação, Assistente com streaming simulado, histórico, configurações e login.

## Verificação no navegador

Prévia isolada em memória, SIMULAÇÃO, clima offline, conta efêmera e loopback em 127.0.0.1:3101. Não foi usado MySQL nem carregado Ollama.

Inspeções em 360, 390, 768, 1024, 1440 e 1920px, com amostras dos temas claro/escuro. Não foi observado transbordamento horizontal nas larguras medidas. A revisão identificou e corrigiu a ordem móvel do bloco legado e a altura herdada do contêiner do canvas. Em 390px, altura final de 220px confirmada. Ordem de teclado verificada: Exportar CSV → Simular. Download CSV confirmado pelo botão existente. Simular mostrou rótulo explícito; Consultar clima retornou OFFLINE/sem dados e limpou a representação anterior. Nenhum erro de console capturado.

Capturas locais não versionadas: `.data/v5-desktop.jpg` e `.data/v5-mobile.jpg`. Testes automatizados não substituem inspeção visual ou avaliação do usuário.

A prévia Node PID 19836 foi encerrada após conferir a propriedade da porta. Ausência de listener confirmada, credencial efêmera removida. Outros serviços não foram encerrados; `.env` e dados persistentes não foram modificados.

## Commits

- `a384b8b` — composição ambiental, gráfico e clima compacto.
- `ec41087` — testes de zero, ausência, clima offline e contratos.
- Relatório entregue em commit documental separado, disponível no histórico Git.

## Limitações e pendências

- Avaliação final do usuário e testes em dispositivos físicos, zoom e diferentes navegadores permanecem necessários. Não foi executada a combinação exaustiva de todos os temas em todas as larguras.
- Não houve consulta meteorológica externa real nesta prévia: campos externos foram validados com respostas simuladas em testes.
- Os estados de zero e ausência foram testados deterministicamente; a captura real do navegador usa a telemetria simulada corrente, sem forçar valores para fins estéticos.
- Chart.js e ícones mantêm suas dependências existentes de CDN; distribuição offline não integra esta entrega.
- Operação legada da Bomba 3 e investigação L-2 continuam pendentes em etapa própria. Nenhum ensaio físico ou validação real da IA foi executado.

## Roteiro manual

1. Inicie pela configuração local habitual (`npm start`), mantendo SIMULATE=true. A prévia 3101 foi encerrada.
2. Abra `http://localhost:3000/login.html` se sua porta configurada for 3000; autentique e abra Visão Geral. Use Ctrl+F5.
3. Role até Análise Ambiental. Confira gráfico, legenda, porcentagens, horários e clima. Compare os valores com Histórico e Eventos; não espere variações artificiais numa série constante.
4. Passe o ponteiro sobre o gráfico e confira tooltip e escala relativa. Use Exportar CSV e confira o arquivo recebido pelo endpoint existente.
5. Use Simular e confirme SIMULAÇÃO CLIMÁTICA. Use Consultar clima: sem serviço disponível, deve indicar OFFLINE ou SEM DADOS, sem manter valores climáticos simulados como externos.
6. Alterne claro/escuro; inspecione 360/390, 768, 1024, 1440 e 1920px. No celular, gráfico → clima → ações adicionais, sem rolagem horizontal.
7. Navegue por Tab/Shift+Tab, observe foco e abra/feche o bloco legado com Enter, sem necessidade de acionar bombas para avaliar o visual.
8. Confira que a V4.1, o login e as outras seções permanecem preservados. Avalie o acabamento visual antes de aprovar outra etapa.
