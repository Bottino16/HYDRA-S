# Fase 3.5 — Ajuste controlado para 256 tokens

13/11/2026. Somente SIMULAÇÃO. Firmware NÃO VALIDADO fisicamente.

## Auditoria e causa

A configuração local tinha `OLLAMA_NUM_PREDICT=128`, contexto 4096, teto geral `ASSISTANT_MAX_TOKENS=700` e timeout 60 s. O serviço aplica `min(teto geral, OLLAMA_NUM_PREDICT)`; portanto o limite efetivo era 128. O validador já aceita até 256: não foi necessário ampliá-lo.

O problema foi reproduzido com uma pergunta real sobre alface: o Ollama devolveu `done_reason=length`, `eval_count=128`, e a resposta terminou em “avaliação técn”. Assim, neste ensaio a causa confirmada foi esgotamento do limite do modelo, não timeout ou cancelamento.

Há também um teto defensivo de caracteres no SSE: `min(tokens efetivos × 12, 12000)`, incluindo os avisos prefixados. Era 1536 caracteres com 128 e passa a 3072 com 256. O adaptador tem ainda uma defesa de 12000 caracteres. Nenhum desses tetos precisou ser alterado; o limite por caracteres não foi o causador observado.

O sistema mantém a distinção existente:

- Término do Ollama com `done_reason=length` produz `limited=true`; o teto de caracteres também pode produzir esse aviso.
- Término normal produz `done` sem limite.
- Timeout é abortado no backend/adaptador e enviado como erro de tempo limite; não é sucesso limitado.
- Cancelamento do navegador usa o AbortController existente, libera a geração e mantém a resposta parcial identificada. Não aciona outro provedor.

## Ajustes feitos

1. **Somente no `.env` local ignorado:** `OLLAMA_NUM_PREDICT=128` → `256`.
2. `src/assistant/prompt.js`: uma frase curta orienta responder diretamente, em até três tópicos curtos, sem introdução longa e priorizando concluir. Português, regras de segurança, SIMULAÇÃO, incertezas, referências/RAG e proibição de comandos foram preservados integralmente.
3. `test/ollama.test.js`: verifica saída 256, envio de `num_predict`, janela 4096, preservação do prompt e respeito ao teto geral quando este for menor.

Mantidos: `OLLAMA_NUM_CTX=4096`, `ASSISTANT_MAX_TOKENS=700`, `ASSISTANT_TIMEOUT_SECONDS=60`, modelo `llama3.2:3b`, uma geração por vez e `keep_alive=0`. O padrão conservador versionado em `.env.example` não foi modificado: esta é uma configuração local autorizada. Nenhuma alteração em F-2, arquitetura, autenticação/permissões, banco, bombas, firmware, protocolo ou rede. Sem continuação automática nem remoção do aviso de limite. `.env` continua ignorado e não foi incluído no commit.

## Orçamento de contexto

Antes: `4096 − 128 − 256 = 3712` para a estimativa de entrada. Agora: `4096 − 256 − 256 = 3584`. A reserva de 256 para template/margem permanece.

O código usa bytes UTF-8 como estimativa conservadora, não tokenização exata. A entrada contém system prompt completo, pergunta sanitizada e contexto técnico; um trecho RAG de até 360 caracteres e até quatro mensagens anteriores só entram se couberem. O ajuste reserva mais saída e reduz o espaço para RAG/histórico; nunca corta instruções obrigatórias. A nova orientação curta também ocupa parte da entrada. Perguntas grandes podem continuar sendo recusadas antes da geração. Contexto não foi ampliado.

## Testes automatizados

`node --test --test-concurrency=1`: **82 testes; 79 aprovados, zero falhas, três ignorados**. Inclui o teste novo, limites, streaming, timeout/cancelamento, erros sem fallback, autenticação/CSRF, isolamento, Markdown/XSS, navegação F-1/F-2 e bombas/travas/ACK. Saída local em `.data/tests-ollama-256.txt`.

As três integrações MySQL não foram executadas por ausência de banco de ensaio. Não foi acessado/migrado o MySQL da apresentação. Não houve testes físicos, instalação ou download.

## Ensaio real

Ollama 0.40.16 já disponível no loopback. Aplicação efêmera em memória, conta/sessão/CSRF temporários e fonte SIMULAÇÃO. Quatro perguntas sequenciais, sem sobrepor gerações. Mesmo system prompt atualizado em ambas as configurações. O teste interceptou apenas os frames locais para registrar o término nativo; não mudou o adaptador versionado.

| Teto | Pergunta | Tempo HTTP/SSE | Tokens gerados | Término nativo | Limitada | GET estado durante geração |
|---|---|---:|---:|---|---|---:|
| 128 | Umidade ideal para alface | 16,765 s | 128 | `length` | Sim | 200 / 8 ms |
| 256 | Umidade ideal para alface | 17,411 s | 125 | `stop` | Não | 200 / 8 ms |
| 256 | Por que calibrar sensor capacitivo | 21,530 s | 114 | `stop` | Não | 200 / 5 ms |
| 256 | Identificar excesso de água | 22,007 s | 235 | `stop` | Não | 200 / 10 ms |

As três respostas com 256 terminaram com frase completa, sem timeout/erro ou fallback. O transporte entregou os deltas e evento final existentes. Não foi medido tempo até o primeiro token. A rota de estado respondeu durante cada geração, mas isso **não certifica responsividade visual do navegador**.

RAM livre mínima amostrada: 314 MiB na referência 128; 503, 599 e 692 MiB nas três execuções 256. VRAM máxima amostrada: **2591 / 4096 MiB**, com utilização de GPU chegando a 100% em amostras. Não houve interrupção por memória; o ensaio tinha proteção amostrada abaixo de 180 MiB livres. Amostragem não garante capturar o pico.

Esses são ensaios funcionais, não benchmark isolado: telemetria/contexto, cache, aplicativos e carga dos testes automatizados variaram. Os tokens de entrada observados foram 936, 960, 943 e 875. A segunda resposta gerou menos tokens apesar do teto maior; não há garantia determinística de tamanho ou redução de RAM. A pequena diferença 16,765 → 17,411 s não deve ser generalizada. Modelo descarregado por resposta também inclui custo de carregamento.

Dados brutos e script efêmero ficaram apenas em `.data/ollama-limit-results.json` e `.data/bench-controlled.js`, ignorados pelo Git. Nenhuma credencial foi exibida.

## Qualidade: pendência importante

**Conclusão textual não significa correção agronômica.** A resposta sobre alface evitou um percentual universal e terminou coerentemente, mas fez afirmação sobre ausência de calibração não comprovada pelo contexto e não usou o formato de referência `[documento.md]` exigido pelo prompt.

A resposta sobre sensor chamou a leitura de “capacidade de campo relativa”, contradizendo as instruções e a base `knowledge/sensor-capacitivo-calibracao.md`, que define uma escala relativa sem garantir medição volumétrica. A resposta sobre excesso de água inventou um critério de caixa acima de 80% como sinal de excesso na plantação: **esse critério não existe no sistema e não diagnostica a zona radicular**. Não é uma recomendação validada. A base `knowledge/excesso-falta-agua.md` orienta observar umidade da zona radicular e drenagem e investigar sintomas inespecíficos.

Não foram escondidas nem tratadas como aprovadas essas respostas. Não houve comando de bomba nas perguntas. O ajuste resolveu o corte nos três exemplos, mas não corrige por si só a confiabilidade do modelo local. Validar/reformular orientação/RAG e medir aderência requer uma etapa específica posterior; não foi realizada nova arquitetura ou alteração automática de recomendações.

256 foi suficiente nestes exemplos. **384 não foi aplicado**; o validador atual inclusive limita a configuração a 256. Se voltarem cortes por `length`, propor ensaio separado e autorizado de 384, revisando orçamento/validador antes. Não há motivo demonstrado para alterar o timeout de 60 s.

## Reiniciar e avaliar

O processo que já estava aberto mantém sua configuração antiga até reiniciar. Conclua/interrompa a resposta atual e use Ctrl+C no terminal do HYDRA-S. Como o modo é memória, conversas e contas temporárias daquele processo serão descartadas.

```powershell
Set-Location 'C:\Users\felip\OneDrive\Desktop\HYDRA-S'
$cred = Get-Credential -UserName 'master_hydra' -Message 'Senha temporária do MASTER'
$env:ADMIN_PASSWORD = $cred.GetNetworkCredential().Password
try { npm start } finally {
    Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    $cred = $null
}
```

Use o `.env` temporário já preparado; não rodar setup, migração ou reset. Abra `http://localhost:3000/login.html`, entre e abra Assistente do Solo. Confira Ollama/modelo e SIMULAÇÃO. Faça uma pergunta por vez, teste Interromper e alternância de seção. Registre a frase final, eventual aviso de limite e duração. Não usar os erros agronômicos descritos acima como orientação real.

Os testes reais foram pelo backend, sem uma nova revisão visual do navegador. Verificação manual da F-2 e responsividade real permanece com o usuário. Aguardar aprovação antes de novas mudanças ou F-3.
