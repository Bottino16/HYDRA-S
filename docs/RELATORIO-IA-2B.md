# IA-2B — recuperação de conhecimento

## Escopo e causa confirmada

Implementada somente a recuperação lexical. O código anterior descartava pH, comparava prefixos nos dois sentidos, não reconhecia calibrar/calibração e atribuía o mesmo peso a termos genéricos e específicos. Cabeçalhos, fontes e URLs participavam da seleção. Empates de pontuação máxima por parágrafo eram resolvidos pelo nome do arquivo, com evidências irrelevantes para alface, calibração e pH.

O baseline foi capturado antes da alteração e commitado em eccbede. Os mesmos 12 enunciados, incluindo o apóstrofo tipográfico da terceira pergunta, foram repetidos. Os fixtures guardam identificador, título e texto integral recuperado antes/depois.

## Alterações

- pH é preservado; acentos e equivalências explícitas de plural/calibração são normalizados, sem prefixos arbitrários. Excesso de água é associado a encharcamento, sem transformar qualquer excesso em excesso hídrico.
- Termos específicos pesam mais que água/solo/umidade; raridade no corpus e correspondência no título influenciam o ranking. Empates usam cobertura, peso do título e ID estável; parágrafos empatados mantêm a ordem original.
- Assuntos específicos reconhecidos precisam ocorrer no título e no corpo. Perguntas de umidade ideal são direcionadas a documentos de manejo da irrigação. A política é conservadora e pode perder textos pertinentes com títulos genéricos; o vocabulário é explícito, não uma classificação semântica universal.
- Cabeçalhos ajudam somente no ranking. Fontes/bibliografia, entradas de URL e rodapé editorial são excluídos da evidência. Fontes sem cabeçalho Markdown também são excluídas. IDs e títulos são mantidos.
- Sem evidência suficiente, retorna lista vazia. Isso indica lacuna da base, não inexistência de resposta científica.
- Mantidos até 32 termos de consulta, 50 arquivos de 64 KiB, três documentos, dois parágrafos/1.600 caracteres por documento; README e symlinks não entram. Sem dependências novas ou alterações nos sete documentos agronômicos.

## Comparação das 12 perguntas

A ordem abaixo é a ordem de recuperação. O contexto local continua selecionando somente o primeiro documento. “Nenhum” não força uma fonte genérica.

| Nº | Pergunta | Antes | Depois |
|---|---|---|---|
| 1 | Qual é a umidade ideal para alface? | `excesso-falta-agua.md`, `irrigacao-culturas.md` (cabeçalho), `materia-organica.md` | `irrigacao-culturas.md` |
| 2 | Por que calibrar um sensor capacitivo de umidade? | `ph-nutrientes.md`, `excesso-falta-agua.md`, `materia-organica.md` | `sensor-capacitivo-calibracao.md` |
| 3 | Se minha caixa d’água está cheia, isso significa que minha plantação está encharcada? | `excesso-falta-agua.md` (cabeçalho), `sensor-capacitivo-calibracao.md`, `textura-drenagem.md` | nenhum |
| 4 | Minha caixa está cheia | nenhum | nenhum |
| 5 | 70% é uma umidade ideal universal? | `materia-organica.md`, `excesso-falta-agua.md`, `irrigacao-culturas.md` | `irrigacao-culturas.md` |
| 6 | Como funciona o HYDRA-S? | `materia-organica.md`, `sensor-capacitivo-calibracao.md`, `umidade-capacidade-campo.md` | nenhum |
| 7 | Que bomba leva água do rio ao poço? | `excesso-falta-agua.md` (cabeçalho), `textura-drenagem.md`, `umidade-capacidade-campo.md` | nenhum |
| 8 | Posso regar? | nenhum | nenhum |
| 9 | Sensor de umidade | `excesso-falta-agua.md`, `materia-organica.md`, `ph-nutrientes.md` | `sensor-capacitivo-calibracao.md` |
| 10 | Qual irrigação para tomate e milho? | `irrigacao-culturas.md` (cabeçalho) | nenhum |
| 11 | Qual o pH do meu solo? | `irrigacao-culturas.md`, `materia-organica.md`, `ph-nutrientes.md` (cabeçalho) | `ph-nutrientes.md` |
| 12 | Quais são as fontes? | `excesso-falta-agua.md` (cabeçalho), `irrigacao-culturas.md`, `materia-organica.md` (cabeçalho) | nenhum |

As perguntas de reservatório/fluxo/funcionamento não têm cobertura explicativa específica nos documentos atuais. O texto de culturas fala de alface, não fundamenta uma recomendação específica para tomate e milho. “Posso regar?” não contém assunto/evidência suficiente. A pergunta de fontes sem assunto também não recupera uma bibliografia como explicação.

## Evidências explicativas selecionadas

Os trechos abaixo vêm dos arquivos existentes, sem acrescentar conteúdo agronômico. Referências externas não foram revalidadas nesta etapa.

### Qual é a umidade ideal para alface?

**irrigacao-culturas.md**: Alface e folhas têm raízes relativamente superficiais e são sensíveis a estresse hídrico. O manejo deve considerar fase da cultura, clima e solo. Não há percentual universal na escala de um sensor não calibrado. Gotejamento bem manejado pode reduzir perdas. Compare culturas e ajuste frequência e aplicação com avaliação técnica, sem transportar receitas de outra região.

### Por que calibrar um sensor capacitivo de umidade?

**sensor-capacitivo-calibracao.md**: Sensores capacitivos precisam de calibração adequada ao solo, pois os atributos do material afetam a resposta. No HYDRA-S, os pontos seco e úmido criam uma escala relativa; isso não garante medição volumétrica. Compare com método de referência e amostras representativas com apoio técnico. Sem Arduino, apenas simule: não considere os valores provisórios uma calibração real.

### 70% é uma umidade ideal universal?

**irrigacao-culturas.md**: Alface e folhas têm raízes relativamente superficiais e são sensíveis a estresse hídrico. O manejo deve considerar fase da cultura, clima e solo. Não há percentual universal na escala de um sensor não calibrado. Gotejamento bem manejado pode reduzir perdas. Compare culturas e ajuste frequência e aplicação com avaliação técnica, sem transportar receitas de outra região.

### Sensor de umidade

**sensor-capacitivo-calibracao.md**: Sensores capacitivos precisam de calibração adequada ao solo, pois os atributos do material afetam a resposta. No HYDRA-S, os pontos seco e úmido criam uma escala relativa; isso não garante medição volumétrica. Compare com método de referência e amostras representativas com apoio técnico. Sem Arduino, apenas simule: não considere os valores provisórios uma calibração real.

### Qual o pH do meu solo?

**ph-nutrientes.md**: pH e disponibilidade de nutrientes precisam de avaliação própria: o sensor capacitivo não os mede. A análise de solo ajuda a orientar correção e adubação conforme cultura e condições locais. Não aplicar doses de corretivos, fertilizantes ou agrotóxicos a partir de uma leitura de umidade; procure agrônomo e laboratório.

## Consumidores e contexto

Inspecionados Knowledge.search, AssistantService, contextFor, fitLocalRequest e o adaptador Ollama. O serviço continua colocando documentos em JSON como DADOS NÃO CONFIÁVEIS, redigindo dados pessoais e ajustando as fontes ao conjunto efetivamente enviado após o orçamento local. Não foi alterado o prompt de sistema nem o contexto/histórico.

O teste com contexto sintético recente em SIMULAÇÃO verifica as 12 perguntas: entrada até 3.584 bytes segundo a estimativa conservadora existente (4.096 - 256 de saída - 256 de reserva), no máximo um documento, ID correspondente ao primeiro recuperado e texto explicativo sem cabeçalhos. O fitter continua partindo de até 360 caracteres e reduzindo em blocos de 24 caracteres. Isso resolve a passagem de títulos isolados pela recuperação, sem exigir mudança em local-context.js; ainda pode haver corte no meio de frase. Não se afirma que um trecho curto sustente toda afirmação futura do modelo.

## Arquivos

- src/assistant/knowledge.js: seleção e ranking.
- knowledge/README.md: instruções técnicas da recuperação e limites reais do contexto.
- test/knowledge.test.js: regressões, normalização, exclusão de metadados, desempate, conteúdo adversarial e orçamento local.
- test/fixtures/rag-ia2b-baseline.json: captura anterior.
- test/fixtures/rag-ia2b-comparison.json: comparação com textos recuperados.
- docs/RELATORIO-IA-2B.md: esta entrega.

## Testes e desempenho

- node --test test/knowledge.test.js: 4 testes aprovados, incluindo todos os 12 casos e verificações múltiplas de variantes/ausência de evidências. Executado novamente após o último ajuste de bibliografia.
- node --test --test-concurrency=1 test/assistant.test.js test/ollama.test.js test/assistant-continuation.test.js: 32 aprovados (51,8 s), com streaming, cancelamento, timeout, limites, isolamento, CSRF, prompt injection, privacidade e continuação manual.
- npm test: 115 testes, 112 aprovados, zero falhas e três testes opcionais MySQL ignorados (119,7 s). Nenhum teste MySQL foi executado. Inclui regressões de interface F-1 a F-6, simulação, ACK/travas, sessão e autorização; não é validação física do firmware.
- git diff --check: sem problemas de whitespace.
- Testes existentes não foram alterados para enfraquecer expectativas; apenas foi acrescentado test/knowledge.test.js.

As 12 buscas depois da correção consumiram aproximadamente 31,5 ms no processo de comparação (amostra única, sob carga concorrente de testes; não é benchmark de produção). Não foi carregado Ollama nem medido RAM/VRAM do modelo. Não foram instalados programas, baixados modelos, alterado .env ou acessado MySQL. Nenhuma validação visual foi necessária: não há alteração de interface.

## Pendências autorizáveis separadamente

- IA-2C: ampliar/revisar cobertura agronômica e funcionamento real do HYDRA-S, reservatórios e fluxo das bombas. Não há documentos novos nesta entrega.
- IA-2D: corrigir a conversão de null para zero em Number(profile.limite_umidade), com testes de ausência de dados; permanece inalterada.
- IA-2D: avaliar montagem/truncamento do contexto em fronteiras de frases, preservação das evidências e validação dos IDs citados no texto gerado. Metadados corretos não provam fundamentação da resposta.
- Vocabulário lexical finito, títulos descritivos obrigatórios para assuntos específicos e exigência conservadora de todos os assuntos reconhecidos podem reduzir recall em perguntas compostas. Cobrir isso sem forçar fontes irrelevantes exige avaliação futura.
- Validação real da IA-1/qualidade das respostas continua pendente de memória suficiente. Testes mock não comprovam precisão do llama3.2:3b nem resistência absoluta do modelo a prompt injection.
- Firmware NÃO VALIDADO fisicamente; somente SIMULAÇÃO. Falha operacional anteriormente relatada da bomba de irrigação permanece fora do escopo.

## Commits

- eccbede — captura anterior das 12 perguntas.
- e15bd8b — correção do ranking, evidência e testes.
- 72bb4fd — bibliografias sem cabeçalho Markdown e regressão.
- Commit de documentação: consultar git log -1 ao abrir esta entrega.

## Avaliação manual sem carregar o modelo

1. No terminal na raiz do HYDRA-S, execute node --test test/knowledge.test.js.
2. Confira os 12 pares completos em test/fixtures/rag-ia2b-comparison.json e a tabela acima.
3. Para uma consulta isolada, execute: node -e "console.log(new (require('./src/assistant/knowledge').Knowledge)('knowledge').search('Qual o pH do meu solo?'))".
4. Avalie pertinência e lacunas antes de autorizar IA-2C/IA-2D. Não é necessário iniciar servidor, banco ou Ollama.

Aguardando avaliação; nenhuma etapa seguinte foi iniciada.
