# DT-1 — integração visual do Digital Twin Premium

Referência visual: protótipo aprovado no commit `f24fd6a`, em `docs/prototipos/digital-twin-premium/`. Entrega restrita à Visão Geral. SIMULAÇÃO; firmware **NÃO VALIDADO fisicamente**. DT-2, DT-3 e L-2 não foram iniciadas.

## Auditoria e estratégia

A composição anterior era construída por `public/maquete.js`, com quatro nós de reservatório/solo intercalados com três módulos de comando. A mesma função `render(state)` validava conexão, valores, boias, alertas, modo e saídas. Os comandos estavam em listeners únicos de Ligar/Desligar e AUTO/MANUAL, usando `sdaRequest`, sem estado otimista.

A integração preserva esse caminho. A geometria do protótipo foi extraída para um componente exclusivamente visual. Ele monta as três composições responsivas, move os nós dos comandos existentes e espelha os textos e atributos já produzidos pelo renderer. Não faz consultas, cálculos de telemetria, inscrições em sockets ou acionamentos.

Comparação textual com a referência anterior confirmou handlers de bombas e modo idênticos. O corpo de `render(state)` continua idêntico, exceto pela chamada final `digitalTwin.sync()`, que atualiza a apresentação. Os desenhos antigos foram removidos do código de construção e do DOM; não existe uma segunda maquete alternativa escondida. Pequenos nós de leitura/escala originais permanecem ocultos para preservar os contratos e a validação do renderer, sem duplicar controles ou apresentações visuais. As descrições acessíveis dos SVGs recebem as leituras atuais.

### Contratos preservados

| Elementos/contratos | Responsabilidade |
| --- | --- |
| `#circuit-level-0` a `#circuit-level-3`, `.vessel-fill`, `.soil-relative-fill` | Nós de leitura/escala validados pelo renderer existente. |
| `#float-0` a `#float-4` | Cinco boias, inclusive ausência de dados e contradições. |
| `#pump-card-1` a `#pump-card-3`, `.pump-start`, `.pump-stop`, `.pump-feedback` | Mesmos três módulos operacionais, seis botões e listeners. |
| Campos de duração e seus nomes acessíveis | Valores, limites e validações existentes. |
| `.mode-switch`, `aria-pressed` | Modo confirmado pela telemetria existente. |
| `.legacy-manual`, `#tempo-manual` | Conversor recolhível da Bomba 3, sem duplicar comando. |
| `#controller-alerts`, `.controller-safety` | Máscara de alertas e limites recebidos. |
| `sdaReady`, `sdaRequest`, `estado_sistema`, `disconnect` | Sessão, caminho HTTP seguro e inscrições originais. |

## Integração visual

- Mesmo rio curvo, poço em corte, caixa elevada, cultivo em cinco fileiras e tubulações do protótipo.
- Mesmas posições e transformações das ilustrações nas composições horizontal, tablet e vertical.
- Três módulos compactos abaixo da cena, na mesma superfície; nenhum controle duplicado.
- Seletor de modo, mensagens reais, conversor avançado e avisos de segurança preservados.
- Leituras, “Sem dados”, confirmação e identificação da fonte vêm exclusivamente do renderer atual. Não existe seletor de exemplos ou estado ilustrativo na aplicação.
- Não foram adicionadas animações ou efeitos de movimento. A regra de movimento reduzido permanece. Profundidade e cores são estáticas.
- Os SVGs usam IDs prefixados para não conflitar com outros gráficos/ícones.

## Diferenças necessárias em relação ao protótipo

1. O aviso original de SIMULAÇÃO/memória continua no topo, acrescentando altura em relação à abertura ilustrativa do protótipo.
2. Uma faixa técnica mostra as cinco boias reais. O protótipo não as apresentava individualmente; elas não poderiam desaparecer.
3. O seletor tem os botões reais “Modo AUTO”/“Modo MANUAL”, modo confirmado e feedback de comando. Mensagens longas ganham uma linha própria no celular.
4. Os módulos mantêm rótulos de duração, limites, permissões, feedback e conversor reais; não usam os controles desativados do protótipo.
5. Indicadores superiores conservam as classes de estado existentes, incluindo suas cores de alerta.
6. A Sidebar Premium V2 e a Análise Ambiental V5 são as originais, não as representações estáticas da página de protótipo.
7. Os números são os recebidos da simulação, não os valores fixos das capturas aprovadas. Zero verdadeiro continua válido.

Os volumes de água desenhados são conceituais, não uma escala de leitura; essa limitação aparece na interface. A revisão aprofundada de máscaras, preenchimentos e estados dinâmicos fica para uma autorização DT-2. A cena não demonstra vazão, irrigação física ou saúde das plantas. O cultivo permanece fixo.

## Arquivos modificados

- `public/digital-twin.js`: novo componente visual com as ilustrações aprovadas e sincronização de apresentação.
- `public/digital-twin.css`: estilos restritos à área, temas e layouts responsivos.
- `public/arthur.html`: inclusão dos dois assets, com o script visual antes de `maquete.js`.
- `public/maquete.js`: retirada dos desenhos antigos, textos do cabeçalho e montagem/sincronização visual.
- `test/water-experience.test.js`, `test/dashboard.test.js`, `test/overview-v2.test.js`, `test/frontend-sections.test.js`, `test/protocol.test.js`: carregamento da nova dependência visual e verificações pertinentes.
- `docs/capturas-dt-1/` e este relatório.

Backend, APIs, banco/migrações, autenticação/CSRF/permissões, firmware/protocolo, lógica/limites/fila/ACK, Ollama, Login, Sidebar, Histórico, Configurações e Análise Ambiental não foram alterados. O arquivo pendente `docs/RELATORIO-IA-2E.md` permaneceu intocado e fora dos commits.

## Testes automatizados

```powershell
node --test --test-concurrency=1 test/water-experience.test.js test/overview-v2.test.js test/dashboard.test.js test/frontend-sections.test.js test/environment-v5.test.js test/auth.test.js test/device-api.test.js test/history-ui.test.js test/assistant-ui.test.js test/settings-ui.test.js test/access-ui.test.js test/login-experience.test.js test/ui-navigation.test.js test/ui-polish.test.js test/protocol.test.js
```

Resultado final: **95 testes aprovados, zero falhas**, incluindo subtestes, em aproximadamente 58,1 s. Log local ignorado pelo Git: `.data/dt1-tests.txt`.

Cobertura: autenticação/autorização, comandos e duração, confirmação recusada, ACK sem antecipar estado, bloqueios/erro escapado, CLIENTE somente leitura, conversor, modo, leituras zero/ausentes/inválidas, boias e contradições, desconexão, unicidade, navegação/formulários/streaming, telas preservadas e geometria do protótipo.

### Testes antigos adaptados e justificativas

- Os cinco arquivos de testes carregam `digital-twin.js` antes de `maquete.js`, como o HTML real. As asserções de operação não foram enfraquecidas.
- Water Experience: doze folhas do desenho antigo foram substituídas pela verificação das trinta plantas do protótipo; preservada a exigência de cultivo estático.
- Water Experience: a ordem intercalada de cartões antigos foi substituída pela verificação da faixa de boias e do deck com as três bombas, mantendo unicidade, legado e preservação de valores.
- Dashboard: a contagem global de quatro SVGs foi substituída pela verificação das três cenas responsivas e ausência das ilustrações antigas. Os indicadores originais continuam sendo os mesmos nós, com IDs únicos.
- Foram acrescentados testes de espelhamento de leituras/estado sem antecipar ACK, ausência de exemplos, IDs únicos e igualdade das geometrias/transformações com o protótipo aprovado.

## Verificação no navegador

Instância isolada em `127.0.0.1:3101`, DB_MODE=memory, SIMULATE=true, clima offline e credenciais temporárias aleatórias. Não houve mudança no `.env`, MySQL, firewall ou Ollama. A prévia foi encerrada após as verificações.

- Larguras 360, 390, 768, 1024, 1440 e 1920 px conferidas nos dois temas, sem overflow horizontal.
- Cenas vertical em 360/390, adaptada em 768/1024 e horizontal em 1440/1920.
- Seis botões reais em todos os tamanhos, com altura mínima medida de 46 px.
- No tema claro, nenhuma interseção geométrica foi detectada entre os rótulos SVG visíveis nas seis larguras. Isso não substitui avaliação estética.
- Corrigidos conflitos de CSS legado que reduziam metadados móveis a 8–10 px: função final 17 px; percurso e estado 13 px.
- Foco visível confirmado por Tab do campo de duração ao botão Ligar.
- Modo MANUAL e comando Desligar Bomba 1 exercitados pelo caminho HTTP existente, com confirmação apresentada. Não foi acionada bomba para ligar pelo navegador; esse caminho é coberto pelos testes automatizados.
- Menu móvel e Escape conferidos. Uma duração digitada foi preservada ao alternar Histórico/Visão Geral, sem recriar controles.
- Nenhum erro de console foi capturado nas verificações concluídas.

Houve um timeout da ferramenta ao tentar enquadrar a área de controles móveis. A verificação foi retomada numa nova aba temporária e a captura foi concluída. Não foi identificada uma causa para o timeout e ele não foi tratado como prova de falha da aplicação.

### Capturas

- [Desktop integrado](capturas-dt-1/desktop.jpg)
- [Desktop — comandos reais](capturas-dt-1/desktop-controles.jpg)
- [Tema claro](capturas-dt-1/desktop-claro.jpg)
- [Celular — abertura](capturas-dt-1/celular-inicio.jpg)
- [Celular — circuito vertical](capturas-dt-1/celular-circuito.jpg)
- [Celular — controles](capturas-dt-1/celular-controles.jpg)

A comparação visual com as capturas do protótipo confirmou a mesma cena e distribuição dos módulos. O teste de geometria compara os caminhos e transformações diretamente com a fonte aprovada; não é uma comparação pixel a pixel, pois textos, leituras, boias e avisos reais diferem.

## Commits

- `4bb4dc3` — componentes e estilos da cena aprovada.
- `0720daa` — integração da cena e reutilização dos controles.
- `5aa0547` — testes de contratos e estados.
- `b6b3f0f` — legibilidade dos metadados diante do CSS legado.
- Commit documental seguinte — relatório, capturas e teste adicional de fidelidade geométrica.

## Roteiro manual

1. Inicie o sistema pelo procedimento habitual, mantendo `SIMULATE=true`. Se já estiver rodando, basta atualizar o navegador. Nenhuma configuração local foi sobrescrita nesta etapa.
2. Abra o login habitual, autentique-se e acesse a Visão Geral. Na configuração padrão: `http://localhost:3000/arthur.html`. Use Ctrl+F5 para recarregar os assets.
3. Confira rio, poço, caixa elevada, cultivo e as cinco boias. Compare os números da cena com os dados recebidos; a água desenhada é conceitual.
4. Com MASTER, confira os três módulos, duração, confirmação, mensagens e seletor. Não interprete pedido pendente como bomba ligada. Os bloqueios existentes, inclusive o defeito L-2 conhecido, não foram corrigidos.
5. Abra o avançado da Bomba 3: a conversão não envia comando; os limites continuam aplicados ao solicitar Ligar.
6. Com CLIENTE, confirme as permissões atuais de somente leitura nesta área.
7. Alterne seções, temas e tamanhos; use Tab/Shift+Tab, menu móvel e Escape. Confira também a Análise Ambiental abaixo.

## Limitações e pendências

Aprovação visual da integração pendente. Sem ensaios físicos, validação de firmware, geometria real do hardware ou medição de vazão. Safari, aparelhos reais, teclado virtual e preferência de movimento reduzido do SO não foram exercitados; a regra CSS e o roteiro ficam disponíveis. A suíte completa do repositório não foi executada, apenas a seleção pertinente acima.

DT-2/DT-3, animações novas, revisão profunda dos estados dinâmicos e L-2 continuam fora desta entrega. Nenhuma próxima etapa foi iniciada.
