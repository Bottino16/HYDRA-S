# HYDRA-S Digital Twin — concepção e protótipo visual

**19/11/2026 · Somente protótipo independente. Aguardando aprovação visual.**

Nenhuma interface operacional foi modificada. Não há integração com API, sessão, banco, controlador, Ollama ou comandos das bombas. O firmware continua **NÃO VALIDADO fisicamente**. Tudo é ilustrativo e rotulado como tal. “Digital Twin” é o nome do conceito visual, não uma afirmação de equivalência física validada.

## Diagnóstico da tela atual

Inspeção: `public/arthur.html`, `public/maquete.js`, `public/overview-v41.css`, `public/water-experience.css` e `public/sidebar-premium.css`. A versão recuperada mantém corretamente os comandos unificados, mas ainda apresenta os reservatórios em quatro zonas independentes, com bases e alturas distintas. Os motores ficam em outra faixa, ligados por pequenos traços verticais. As tubulações não explicam o percurso com continuidade. Títulos, notas e divisórias sucessivas fragmentam a abertura; diversos textos auxiliares são muito pequenos.

A V6 rejeitada não foi reutilizada: não há quatro cápsulas altas envolvendo reservatório e bomba. Também não foram aplicadas as propostas anteriores A/B/C ao painel.

## Conceito desenvolvido

Uma paisagem técnica em 2.5D: curso de água curvo com margens e vegetação; poço com corte de solo em camadas e coluna d'água; caixa elevada com suporte e reservatório cilíndrico; cinco fileiras e trinta plantas em perspectiva. Tubulações estáticas conectam o rio, o poço, a caixa e o cultivo, com três motores reconhecíveis sobre as conexões.

A cena usa SVG nativo e CSS, sem WebGL, bibliotecas 3D, imagens geradas, CDN ou fontes externas. Gradientes e sombras contidas distinguem água, solo e metal. As ilustrações são conceituais: dimensões, forma dos reservatórios e tubulações não reproduzem um circuito físico conferido.

O cabeçalho é compacto, a telemetria fica em uma faixa fina e a maquete ocupa a principal área visual. Logo abaixo, na mesma superfície, ficam três módulos baixos com função, percurso, estado, duração, ações e feedback. Não existe segundo conjunto de comandos. O espaço avançado da Bomba 3 aparece como disclosure ilustrativo; seu conversor real não foi alterado.

## Arquivos isolados

- `index.html`: página do protótipo, sem scripts da aplicação.
- `prototype.css`: identidade, três composições responsivas, temas e movimento reduzido.
- `prototype.js`: construção das ilustrações e interações exclusivamente locais de apresentação.
- `comparacao.html` e `comparacao.css`: galeria antes/depois com enquadramentos equivalentes.
- `check-prototype.cjs`: verificações determinísticas de isolamento e estados.
- `capturas/`: dez capturas reais do navegador, incluindo páginas completas.

Esses arquivos ficam em `docs/prototipos/`, fora de `public/`, e não foram incluídos no Express. A Sidebar V2 está apenas representada estaticamente para dar contexto. O menu original não foi modificado. A área inferior de Análise Ambiental é um marcador visual ilustrativo de continuidade, não um redesign ou substituto da V5 existente. Login, Histórico e demais áreas continuam intocados.

## Ver o resultado

Abra `index.html` diretamente no navegador. Para comparar, abra `comparacao.html`. Todos os recursos necessários estão nesta pasta e podem funcionar offline.

Se preferir servir a prévia pelo terminal, na raiz do projeto:

```powershell
python -m http.server 3102 --bind 127.0.0.1 --directory docs/prototipos/digital-twin-premium
```

Abra `http://127.0.0.1:3102/`. Encerre esse servidor com Ctrl+C. Esse comando serve somente a pasta do protótipo em loopback; não inicia o HYDRA-S e não abre acesso pela LAN. Não requer instalar dependências.

O seletor “Ver estado ilustrativo” alterna exemplos visuais: desligadas, B2 ligada, B3 em espera, B3 bloqueada e ausência de dados das bombas. Não representa telemetria real. Os botões Ligar/Desligar e os campos de duração estão desativados. O seletor de modo é uma representação estática. O tema pode ser alternado pelo menu.

## Responsividade e capturas

| Largura de viewport | Composição |
| --- | --- |
| 1440 px | Cena horizontal ampla; três módulos compactos na mesma seção. |
| 768 px | Cena própria em duas faixas para preservar rótulos; não é apenas a versão desktop encolhida. |
| 390 px | Curso vertical contínuo, com etapas alternadas e ilustrações reposicionadas; comandos em sequência abaixo. |

Foram conferidos os três tamanhos, nos temas claro e escuro. Na verificação do tema claro, o conteúdo mediu 375/753/1425 px para viewports de 390/768/1440 px, respectivamente, sem overflow horizontal. A cena ativa mudou corretamente entre mobile/tablet/desktop. Nenhuma interseção foi detectada entre os retângulos dos rótulos SVG visíveis nesses três tamanhos. Isso é uma verificação geométrica, não uma comprovação de qualidade estética.

Capturas da galeria:

- Desktop: `antes-desktop.jpg` × `proposta-desktop.jpg`, ambos em viewport de 1440 × 1100 px e recorte idêntico de **1400 × 1000 px**, sem redimensionar imagens.
- Celular: `antes-celular.jpg` × `proposta-celular.jpg`, ambos em viewport de 390 × 1000 px, começando no topo; arquivos de **375 × 961 px**, conforme área capturada pelo navegador.
- Tablet: `proposta-tablet.jpg`, viewport de 768 × 1100 px.
- Complementos: circuito vertical inteiro, controles com exemplo de espera e páginas completas.

As páginas completas de celular foram capturadas com a mesma largura de 375 px: referência atual com 4302 px de altura e protótipo com 3020 px. A diferença inclui cabeçalho e áreas ilustrativas inferiores; não é uma promessa de redução equivalente após integração com todos os dados e mensagens reais.

## Movimento e segurança da representação

- Ondas são decorativas, não demonstram fluxo medido.
- Tubulações não recebem animação direcional.
- O halo de bomba ligada só aparece no exemplo explicitamente escolhido como confirmado.
- Espera e bloqueio continuam exibindo a bomba como desligada.
- Plantas são fixas e não mudam saúde/crescimento conforme umidade ou estado das bombas.
- Existe regra `prefers-reduced-motion`; a preferência do SO não foi emulada durante os testes.
- Transições de níveis reais ficam apenas planejadas: na integração deverão ocorrer somente entre valores recentes e válidos; ausência de dados não pode virar zero.

## Verificações executadas

```powershell
node --check docs/prototipos/digital-twin-premium/prototype.js
node --test --test-concurrency=1 docs/prototipos/digital-twin-premium/check-prototype.cjs test/water-experience.test.js test/environment-v5.test.js
```

**13 testes aprovados, zero falhas**: três do protótipo e dez das verificações existentes de Water Experience/Análise Ambiental. Última execução aproximadamente 6,5 s. Log local ignorado: `.data/twin-prototype-tests.txt`.

As verificações cobrem comandos desativados, política CSP `connect-src 'none'`, ausência de código de chamadas operacionais, estados locais de espera/bloqueio/desconhecimento, IDs únicos, cultivo estático e apenas três conjuntos de controles. No navegador, também foram exercitados o seletor de estados, temas, menu móvel e fechamento por Escape. Nenhum erro de console foi capturado.

Não foi rodada a suíte completa, pois não houve alteração na aplicação. Os testes existentes são verificações pertinentes, não uma nova validação de firmware ou qualidade agronômica. Não foi carregado o Ollama nem acessado o MySQL. A referência atual foi aberta numa instância temporária isolada em memória e SIMULAÇÃO, sem persistência de configurações, para fotografar o antes. As prévias temporárias foram encerradas após a verificação.

## Limitações

O protótipo não valida geometria ou dimensões de hardware, vazão, irrigação, estados físicos, performance em aparelhos reais ou teclado virtual. O tema claro é demonstrativo e ainda depende da avaliação visual. A navegação é um cenário estático, sem as rotas reais, isolamento de foco completo ou autenticação. Não deve ser copiada sobre a Sidebar V2.

As boias e os alertas reais não estão modelados individualmente neste estudo de composição. Na integração, as cinco boias, alertas, máscara, limites e feedback existentes deverão ser reapresentados sem omissão, preferencialmente em faixa técnica legível e expansível. O painel real permanece com todos eles. A falha operacional L-2 não foi investigada ou corrigida.

## Plano de integração — NÃO EXECUTADO

1. Aprovação visual da cena nos três tamanhos, incluindo posição dos controles, contraste e extensão do mobile. Ajustes continuam no protótipo até essa aprovação.
2. Extrair a ilustração em uma camada visual isolada no frontend e substituir somente a área de apresentação existente. Reutilizar Sidebar V2, telemetria e Análise Ambiental originais; não copiar as representações estáticas desta página.
3. Reposicionar os três nós de controle existentes, sem recriar listeners, alterar IDs, duplicar comandos ou reescrever `sdaRequest`. Preservar conversor avançado, modo, CSRF, permissões, fila, travas, ACK e feedback. Vincular os três desenhos responsivos a uma única fonte de estado e a um único conjunto de controles.
4. Conectar leituras com validação de tipo, faixa, validade e conexão; preservar zero verdadeiro e “Sem dados”. Reapresentar as cinco boias e todos os avisos de segurança. Remover valores ilustrativos, seletor de exemplos e todos os estados fictícios.
5. Executar regressões de auth, navegação, comandos, modo e simulação; conferir desktop/tablet/mobile, dois temas, foco, mensagens longas e movimento reduzido. Commits pequenos por camada. Nenhuma alteração operacional ou L-2 será incluída implicitamente.

**Parar neste protótipo. Nenhuma integração está autorizada ou iniciada nesta entrega.**
