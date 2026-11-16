# IA-2C.2 — revisão do conhecimento agronômico

## Resultado e escopo

Revisados os sete documentos agronômicos existentes, com seções curtas, ressalvas junto das afirmações e fontes primárias consultadas em 16/11/2026. Não foram criados documentos agronômicos extras. Os nove documentos técnicos da IA-2C.1 permanecem byte a byte inalterados.

Nenhuma mudança em src/, firmware/, public/, banco, .env, permissões, modelo, streaming, continuação, instruções de sistema, algoritmo RAG ou orçamento local. Tudo continua exclusivamente em SIMULAÇÃO e o firmware NÃO VALIDADO fisicamente. Não foi carregado Ollama nem foi avaliada resposta real do modelo; não houve instalação, acesso MySQL ou ensaio físico.

## Revisão por documento

| Arquivo em knowledge/ | Aprofundamento e correção de ambiguidade |
|---|---|
| umidade-capacidade-campo.md | Capacidade de campo versus saturação; murcha permanente como referência; água disponível na profundidade radicular e diferença entre grandezas físicas e escala relativa. Não esperar murcha para irrigar nem impor prazo fixo de drenagem. |
| sensor-capacitivo-calibracao.md | Princípio indireto, comparação com referência e alcance limitado do estudo IRRIGAP. Dois extremos provisórios não validam sensor ou equação de outro equipamento. |
| irrigacao-culturas.md | Alface, tomate e milho em parágrafos próprios: fases sensíveis, solo/clima, falta/excesso e ausência de percentual ideal universal. Sem criar limites de perfis ou minutos/lâminas. |
| excesso-falta-agua.md | Murcha também pode acompanhar dano radicular por excesso; observar solo e drenagem, sem diagnóstico de doença por aparência. |
| textura-drenagem.md | Textura versus estrutura; infiltração versus drenagem; perfil e camadas restritivas, sem deduzir drenagem pela areia superficial. |
| materia-organica.md | Agregação e ciclagem; mineralização e imobilização, sem converter teor em dose imediata de adubo. |
| ph-nutrientes.md | Acidez/alcalinidade e disponibilidade versus quantidade; análise, amostragem e interpretação regional. Ausência de análise não é pH neutro. |

As afirmações antigas eram sobretudo resumidas/incompletas; não foi encontrada justificativa para inventar faixas numéricas ou substituir calibração por uma porcentagem geral. Mantida a distinção entre ciência geral e comportamento específico do projeto.

## Fontes verificadas e afirmações sustentadas

Leitura das páginas originais abaixo e do PDF Embrapa; síntese própria em português, sem reproduzir tabelas, coeficientes ou recomendações regionais quantitativas. As mesmas referências estão nas seções Fontes de referência dos documentos e são excluídas pelo recuperador da evidência explicativa.

| Fonte original consultada | Sustenta | Documentos |
|---|---|---|
| [FAO — Soil and Water, capítulo 2](https://www.fao.org/4/r4082e/r4082e03.htm), seções 2.1–2.4 | Conceitos de textura, estrutura, saturação e água disponível. | Umidade; textura. |
| [FAO — Glossary of Soil Moisture Terms](https://www.fao.org/4/Y4690E/y4690e04.htm) | Definição de murcha permanente; ressalva de drenagem variável. Não importar 48 horas como regra universal. | Umidade. |
| [Embrapa — Costa, Correia e Bassoi, 2014, PDF original](https://www.alice.cnptia.embrapa.br/bitstream/doc/1004787/1/Bassoi2014.pdf), resumo e Materiais e Métodos; [registro Alice](https://www.alice.cnptia.embrapa.br/handle/doc/1004787?locale=pt_BR) | Calibração local do IRRIGAP e comparação com referência. Não valida hardware HYDRA-S. | Sensor; umidade. |
| [USU Extension — Leafy Greens: Irrigation](https://extension.usu.edu/vegetableguide/leafy-greens/irrigation) | Alface: raízes superficiais, fases sensíveis, frequência por solo. | Culturas. |
| [USU Extension — Management: Irrigation](https://extension.usu.edu/vegetableguide/management/irrigation), Critical Periods e solo/infiltração | Tomate: fases; influência de solo/clima e excesso nas hortaliças. | Culturas; textura. |
| [Nebraska Extension — G1850, Irrigation Management for Corn](https://extensionpubs.unl.edu/publication/g1850/na/html/view), Growth Stages/Soil Textures | Milho: sensibilidade reprodutiva, textura e manejo hídrico. | Culturas. |
| [UMN Extension — Flooded corn](https://extension.umn.edu/agriculture/crop-production/corn/flooded-corn), Growth and development | Restrição radicular e absorção sob saturação. | Culturas. |
| [Ontario Crop IPM — Drainage](https://cropipm.omafra.gov.on.ca/en-ca/soil-diagnostics/drainage) | Perfil, compactação, subsolo e sinais inespecíficos de encharcamento. | Textura; excesso/falta; pH. |
| [Iowa State Extension — Why is my houseplant wilting?](https://yardandgarden.extension.iastate.edu/faq/why-my-houseplant-wilting) | Murcha tem causas distintas. A rotina de rega de vasos dessa página não foi generalizada a culturas de campo. | Excesso/falta. |
| [UMN Extension — Soil organic matter in cropping systems](https://extension.umn.edu/natural-resources/conservation/agricultural-soil-and-water/soil-organic-matter-in-cropping-systems), Benefits/Decomposition | Agregação, decomposição e ciclagem. | Matéria orgânica. |
| [UMN Extension — Soil testing for lawns and gardens](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/soil-testing-for-lawns-and-gardens) | Amostragem e atributos laboratoriais; métodos de interpretação. | Matéria orgânica; pH. |
| [Maryland Extension — Understanding Your Soil Test Report](https://www.extension.umd.edu/resource/understanding-your-soil-test-report), Soil pH | Relação entre acidez e disponibilidade; exigências distintas das plantas. Sem importar doses do guia. | pH. |
| Fontes internas: firmware/sda/Sensors.h, Config.h e sda.ino; src/simulated-board.js, src/device-link.js e src/assistant/context.js | Escala relativa, telemetria implementada, sem dados e fonte simulada. | Ressalvas específicas do HYDRA-S, sem atribuí-las aos estudos. |

As URLs propostas da FAO crop-information/tomato/en/ e maize/en/ responderam 404; a página completa Ontario irrigation-scheduling-tomatoes respondeu 403. Não foram usadas como referências lidas. Para tomate foi usada USU; para milho, Nebraska/UMN. Ontario Crop IPM Drainage é outra página, acessível e lida. Não houve tentativa de contornar bloqueios.

## Recuperação antes/depois

Baseline capturado antes das edições no commit 2e28add. A tabela mostra todos os candidatos em ordem; candidato secundário pode ter apenas pertinência parcial. O contexto local continua usando somente uma parte do primeiro.

| Pergunta | Antes | Depois |
|---|---|---|
| Qual é a umidade ideal para alface? | `irrigacao-culturas.md` | `irrigacao-culturas.md` |
| Como irrigar tomate? | nenhum | `irrigacao-culturas.md` |
| Como irrigar milho? | nenhum | `irrigacao-culturas.md` |
| Por que calibrar um sensor capacitivo de umidade? | `sensor-capacitivo-calibracao.md` | `sensor-capacitivo-calibracao.md` |
| O que é capacidade de campo? | `umidade-capacidade-campo.md`, `hydra-consumo-estimativa.md`, `hydra-percurso-bombas.md` | `umidade-capacidade-campo.md`, `sensor-capacitivo-calibracao.md`, `hydra-consumo-estimativa.md` |
| O que é ponto de murcha permanente? | `umidade-capacidade-campo.md`, `excesso-falta-agua.md` | `umidade-capacidade-campo.md`, `excesso-falta-agua.md` |
| Como identificar excesso de água? | `excesso-falta-agua.md`, `hydra-caixa-solo.md` | `excesso-falta-agua.md`, `hydra-caixa-solo.md`, `irrigacao-culturas.md` |
| Como identificar falta de água? | `excesso-falta-agua.md`, `hydra-caixa-solo.md`, `hydra-modos-protecoes.md` | `excesso-falta-agua.md`, `hydra-caixa-solo.md`, `hydra-modos-protecoes.md` |
| Como a textura afeta a drenagem? | `textura-drenagem.md`, `excesso-falta-agua.md`, `hydra-caixa-solo.md` | `textura-drenagem.md`, `excesso-falta-agua.md`, `hydra-caixa-solo.md` |
| O que é matéria orgânica? | `materia-organica.md` | `materia-organica.md`, `ph-nutrientes.md`, `textura-drenagem.md` |
| Qual o pH do meu solo? | `ph-nutrientes.md` | `ph-nutrientes.md` |
| Como o pH afeta nutrientes? | `ph-nutrientes.md` | `ph-nutrientes.md` |
| Qual é a diferença entre o nível da caixa e a umidade do solo? | `hydra-caixa-solo.md`, `hydra-cinco-boias.md`, `hydra-percurso-bombas.md` | `hydra-caixa-solo.md`, `hydra-cinco-boias.md`, `hydra-percurso-bombas.md` |
| Qual irrigação para tomate e milho? | nenhum | `irrigacao-culturas.md` |
| Posso regar? | nenhum | nenhum |
| Qual a umidade ideal para feijão? | nenhum | nenhum |
| Qual a capacidade física em litros do tanque? | `umidade-capacidade-campo.md`, `hydra-percurso-bombas.md`, `hydra-caixa-solo.md` | `umidade-capacidade-campo.md`, `hydra-percurso-bombas.md`, `sensor-capacitivo-calibracao.md` |

Além dos 17 enunciados de comparação, a matriz atual cobre pH ideal para café, cacto e texto fora do tema: 19 casos determinísticos no corpus completo. Feijão/cacto, Posso regar? e texto sem correspondência retornam vazio. Café recupera somente orientação geral de pH, sem faixa específica; é cobertura insuficiente para uma recomendação por cultura, não uma resposta validada.

## Evidência de culturas e limite de contexto preservado

Contexto sintético: SIMULAÇÃO recente, perfil Alface/45, solo 35, temperatura 28, umidade do ar 60, níveis 80/35/100 e bombas desligadas. São valores de teste, não observações físicas.

### Qual é a umidade ideal para alface?

Documento: irrigacao-culturas.md. Primeiro parágrafo recuperado:

> Alface tem raízes relativamente superficiais. Não há percentual universal de umidade ideal na escala de um sensor não calibrado. Falta de água no estabelecimento, expansão das folhas e até a colheita prejudica a cultura. Irrigação considera clima e solo: em solo leve, aplicações menores e mais frequentes podem ser necessárias. Excesso de água também prejudica qualidade e aeração.

Trecho efetivamente enviado no cenário sintético (288 caracteres; estimativa 3575/3584):

> Alface tem raízes relativamente superficiais. Não há percentual universal de umidade ideal na escala de um sensor não calibrado. Falta de água no estabelecimento, expansão das folhas e até a colheita prejudica a cultura. Irrigação considera clima e solo: em solo leve, aplicações menores

### Como irrigar tomate?

Documento: irrigacao-culturas.md. Primeiro parágrafo recuperado:

> Tomate não tem percentual ideal universal de umidade sem calibração e avaliação local. Irrigação deve atender florescimento, pegamento e crescimento dos frutos, sensíveis à falta de água. Considerar solo, chuva e demanda atmosférica; solo com menor reserva disponível tende a exigir maior frequência. Excesso de água pode reduzir qualidade e aeração radicular. Não há minutos fixos de bomba para tomate nesta base.

Trecho efetivamente enviado no cenário sintético (288 caracteres; estimativa 3560/3584):

> Tomate não tem percentual ideal universal de umidade sem calibração e avaliação local. Irrigação deve atender florescimento, pegamento e crescimento dos frutos, sensíveis à falta de água. Considerar solo, chuva e demanda atmosférica; solo com menor reserva disponível tende a exigir maior

### Como irrigar milho?

Documento: irrigacao-culturas.md. Primeiro parágrafo recuperado:

> Milho não tem percentual ideal universal de umidade em sensor não calibrado. Irrigação deve considerar a sensibilidade à falta de água no pendoamento, emissão de estigmas e polinização. O uso de água cresce com folhas e raízes; chuva, reserva do solo e fase importam. Solo arenoso pode exigir reposição mais frequente. Excesso de água restringe raízes e absorção de nutrientes. Não há lâmina diária fixa para milho nesta base.

Trecho efetivamente enviado no cenário sintético (312 caracteres; estimativa 3584/3584):

> Milho não tem percentual ideal universal de umidade em sensor não calibrado. Irrigação deve considerar a sensibilidade à falta de água no pendoamento, emissão de estigmas e polinização. O uso de água cresce com folhas e raízes; chuva, reserva do solo e fase importam. Solo arenoso pode exigir reposição mais freq

### Qual irrigação para tomate e milho?

Documento: irrigacao-culturas.md. Primeiro parágrafo recuperado:

> Tomate não tem percentual ideal universal de umidade sem calibração e avaliação local. Irrigação deve atender florescimento, pegamento e crescimento dos frutos, sensíveis à falta de água. Considerar solo, chuva e demanda atmosférica; solo com menor reserva disponível tende a exigir maior frequência. Excesso de água pode reduzir qualidade e aeração radicular. Não há minutos fixos de bomba para tomate nesta base.

Trecho efetivamente enviado no cenário sintético (288 caracteres; estimativa 3577/3584):

> Tomate não tem percentual ideal universal de umidade sem calibração e avaliação local. Irrigação deve atender florescimento, pegamento e crescimento dos frutos, sensíveis à falta de água. Considerar solo, chuva e demanda atmosférica; solo com menor reserva disponível tende a exigir maior


Atenção: a consulta conjunta tomate e milho recupera ambos no documento, mas o corte local pode levar somente o início do tomate ao modelo. Não foi escondida essa limitação nem alterado o orçamento. Perguntas individuais selecionam primeiro o parágrafo da cultura pedida, incluindo ressalva contra percentual universal no cenário testado. Em contextos maiores, não há garantia de conservar a mesma quantidade de informação.

## Testes e regressões

- Testes direcionados: node --test test/knowledge.test.js test/knowledge-system.test.js test/knowledge-agronomy.test.js — 13 aprovados, zero falhas; quatro testes novos abrangem 19 enunciados, organização dos trechos, fontes e contexto recente/vencido.
- Suíte completa: npm test — 124 testes, 121 aprovados, zero falhas e três opcionais MySQL ignorados; duração 109,5 segundos. Nenhum teste de MySQL real foi executado.
- Inclui regressões de sessão/CSRF/permissões, isolamento, privacidade, prompt injection, streaming, cancelamento, timeout, continuação, ACK/travas simuladas e interfaces anteriores. Não equivale a validação física, visual manual ou agronômica do modelo.
- git diff --check sem erros; arquivos de produção, algoritmo, instruções e documentos técnicos sem alterações.

- Os nove documentos técnicos não foram editados; as seis perguntas obrigatórias da IA-2C.1 e seus tópicos adicionais continuam aprovados.
- Asserção antiga de ausência para tomate+milho foi substituída por exigência do documento correto com evidência de ambas as culturas; negativo trocado por feijão, ainda não coberto. Alteração necessária pela cobertura agora autorizada, sem remover teste de ausência.
- Os dois testes históricos IA-2B agora leem textos congelados em rag-ia2b-corpus.json, capturados antes da revisão, mantendo as 12 expectativas antigas. Antes, copiavam os arquivos atuais pelos nomes antigos; isso deixaria de testar o corpus original após revisão. Testes do corpus completo continuam separados e incluem conteúdos novos.
- Foi detectado durante o teste que uma pergunta de pH priorizava o segundo parágrafo, perdendo a introdução no contexto curto. Ajustado somente o conteúdo: pH e nutrientes no solo constam no primeiro parágrafo, preservando a evidência central sem alterar ranking.
- Uma seção genérica repetindo alface/tomate/milho competia com os parágrafos específicos; retirados nomes redundantes dessa seção, mantendo o conteúdo explicativo. Perguntas individuais agora começam no parágrafo correto.
- Não se exige que uma pergunta genérica sobre matéria orgânica recupere todos os três parágrafos: o recuperador seleciona no máximo dois. A ressalva sobre ausência de medição está documentada, mas pode não integrar o trecho dessa pergunta. Isso segue como limitação de seleção/contexto.

## Limitações conhecidas e pendências

**IA-2D, somente após aprovação:** corrigir null convertido em zero no limite do perfil; revisar corte do contexto em frases, retenção de ressalvas e fontes e instruções que identifiquem evidência insuficiente. A consulta conjunta de culturas é um caso de aceitação importante. Nada disso foi implementado aqui.

**IA-2E, proposta para aprovação:** avaliação qualitativa real e matriz de paráfrases, com memória segura, examinando conclusão agronômica, extrapolação e citação. A melhoria dos documentos não comprova precisão do llama3.2:3b. Reavaliar escopo da etapa quando autorizada.

A limitação lexical capacidade física em litros do tanque → capacidade de campo persiste. Café, não reconhecido como âncora específica, recebe conteúdo geral de pH; o recuperador não sinaliza automaticamente que falta evidência para a cultura. Não foi alterado algoritmo nem criada solução documental artificial para mascarar essas limitações; correção de recuperação exige autorização separada. Não se afirma que toda pergunta sem evidência retorna vazio.

O Ollama real não foi carregado por prudência com o histórico de memória insuficiente. Não há métricas novas de RAM/VRAM, qualidade ou latência de geração. Validação real da IA-1 e ensaios físicos continuam pendentes. Firmware NÃO VALIDADO.

## Arquivos e commits

Sete knowledge/*.md agronômicos revisados; test/knowledge.test.js; test/knowledge-system.test.js; novo test/knowledge-agronomy.test.js; fixtures rag-ia2b-corpus.json, rag-ia2c2-before.json e rag-ia2c2-cases.json; este relatório. O índice e os nove knowledge/hydra-*.md não foram alterados.

- 2e28add — corpus congelado e captura anterior.
- c3c72bd — revisão dos sete documentos e fontes.
- 6e5dee2 — recuperação agronômica, ressalvas e regressões.
- Commit de relatório: consultar git log -1 nesta entrega.

## Conferência manual sem modelo

1. Na raiz do projeto: node --test test/knowledge.test.js test/knowledge-system.test.js test/knowledge-agronomy.test.js.
2. Abra os sete documentos e consulte os links nas seções de fontes; revise a matriz acima.
3. Execute, por exemplo: node -e "console.log(new (require('./src/assistant/knowledge').Knowledge)('knowledge').search('Como irrigar milho?'))".
4. Avalie evidências e limitações antes de autorizar IA-2D/IA-2E. Não é preciso iniciar backend, MySQL ou Ollama para esses testes.

Somente IA-2C.2 executada; aguardando aprovação.
