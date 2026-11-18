# Visão Geral V6 — circuito e operação integrados

Entrega: 18/11/2026. Escopo exclusivamente visual da Water Experience. Operação em SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.

## Diagnóstico

A composição anterior posicionava quatro reservatórios em uma faixa e três cartões operacionais em outra. Bordas independentes e superfícies retangulares enfraqueciam a associação entre origem e bomba. O seletor de modo aparecia como uma barra administrativa separada.

## Conceito e implementação

Estações hídricas contínuas: Rio + Captação, Poço + Transferência, Caixa + Irrigação e Plantação como destino com superfície verde discreta e maior largura no desktop. Cada estação reúne ilustração, leitura, boias e controles em uma superfície de topo curvo. Conectores estáticos indicam somente o percurso, nunca vazão medida.

O cabeçalho recebeu subtítulo mais direto; “Operação hídrica” reúne o modo confirmado e o seletor em cápsula. Foram refinados fundos, curvas, cores por módulo, botões, entradas, foco e avisos. As ilustrações SVG existentes foram reutilizadas. Não foram adicionadas bibliotecas, imagens externas ou animações pesadas. Movimento reduzido continua respeitado.

Os nós existentes são agrupados em wrappers visuais, sem recriar controles. Continuam presentes três bombas, seis botões principais e o conversor legado recolhível na Bomba 3. Duração, confirmação explícita, estados pendentes, erros e atualização pela telemetria são preservados. Nenhuma saída passa a ser mostrada como ligada por efeito de clique.

## Arquivos

- `public/arthur.html`: inclusão da folha V6.
- `public/maquete.js`: agrupamento visual dos nós existentes e dois textos de apresentação.
- `public/overview-v6.css`: estilos restritos à Water Experience; reutiliza os tokens dos temas.
- `test/water-experience.test.js`: teste adicional de ordem, unicidade, preservação do legado, valores digitados e telemetria.
- `docs/RELATORIO-VISAO-GERAL-V6.md`: este relatório.

Análise Ambiental V5, indicadores superiores, outras páginas, backend, APIs, autenticação, permissões, firmware, protocolo, Ollama e regras operacionais não foram modificados. O documento preexistente `docs/RELATORIO-IA-2E.md` ficou fora dos commits.

## Verificações automatizadas

Comando executado:

```powershell
node --test --test-concurrency=1 test/water-experience.test.js test/overview-v2.test.js test/ui-navigation.test.js test/environment-v5.test.js test/auth.test.js test/device-api.test.js test/history-ui.test.js test/assistant-ui.test.js
```

Resultado: **57 testes aprovados, 0 falhas**, incluindo subtestes; duração aproximada 49,8 s. Log local ignorado pelo Git: `.data/v6-tests.txt`.

Cobertura pertinente: comandos e ACK, ausência de estado otimista, bloqueios/erro escapado, CLIENTE somente leitura, modo, legado, controles únicos, leituras zero/nulas, boias, navegação, histórico, Assistente e autenticação. Comparação textual com o HEAD anterior confirmou handlers de bombas, modo e função render idênticos. `git diff --check` sem erros de whitespace.

## Navegador e responsividade

Prévia isolada em `127.0.0.1:3101`, DB_MODE=memory e SIMULATE=true, credenciais aleatórias temporárias, clima offline. Nenhum acesso ao MySQL ou modelo real foi necessário.

Foram medidas as seis larguras nos dois temas: 360, 390, 768, 1024, 1440 e 1920 px. A largura de conteúdo não ultrapassou o viewport. Botões das bombas: 46 px de altura. Uma coluna até 700 px, duas até 1200 px e quatro acima disso. A ordem DOM continua Rio/B1 → Poço/B2 → Caixa/B3 → Plantação, inclusive por teclado.

Inspeção visual de desktop claro/escuro, tablet e celular; foco visível confirmado por Tab do campo da Bomba 2 ao botão Ligar. Nenhum erro de console capturado. Capturas locais em `.data/v6-desktop.jpg`, `.data/v6-desktop-light.jpg` e `.data/v6-mobile.jpg` (fora do Git).

Os comandos de bomba foram exercitados pelos testes automatizados; não foram acionados manualmente no navegador. Os testes de interface não equivalem a testes físicos. Teclado virtual de aparelho real, Safari e zoom do navegador permanecem para conferência manual. A navegação vertical é maior no celular para preservar controles confortáveis.

## Commits

- `275113c` — composição e estilos das estações V6.
- `77dedd6` — teste de preservação do percurso e controles.
- Commit documental seguinte — relatório e roteiro final.

## Roteiro de avaliação

1. Inicie o HYDRA-S pelo procedimento habitual, mantendo SIMULATE=true, e abra `http://localhost:3000/arthur.html` após autenticar. Use Ctrl+F5 para atualizar os estilos.
2. Confira Rio/Captação, Poço/Transferência, Caixa/Irrigação e Plantação; cada bomba deve ter somente um conjunto Ligar/Desligar.
3. Compare temas e larguras; confira textos, boias, duração, botões, mensagens e o painel recolhível da Bomba 3.
4. Use Tab/Shift+Tab e confira foco; alterne seções e retorne à Visão Geral.
5. Em SIMULAÇÃO e com conta autorizada, confira o seletor e os comandos existentes: observe pedido pendente, ACK, bloqueios e estado confirmado. Não interprete ilustrações/conectores como medição real de fluxo.
6. Confira a Análise Ambiental abaixo, sem alterações de composição nesta etapa.

## Limitações e pendências

Aprovação visual do usuário pendente. Defeito operacional L-2 permanece fora deste escopo; nenhuma trava foi flexibilizada. Firmware continua sem validação física. IA real não foi carregada ou validada nesta entrega. Nenhuma próxima etapa foi iniciada.
