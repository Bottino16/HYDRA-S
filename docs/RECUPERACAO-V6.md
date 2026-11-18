# Recuperação da composição anterior à V6

Data: 18/11/2026. V6 rejeitada pelo usuário; somente a camada visual dessa entrega foi retirada. Nenhuma V7 aplicada ao sistema.

## Auditoria e recuperação seletiva

- `275113c`: somente `public/arthur.html` (importação), `public/maquete.js` (wrappers e textos) e `public/overview-v6.css` (estilos).
- `77dedd6`: somente teste da estrutura das estações V6.
- `c9c2249`: relatório histórico da V6, mantido como registro e sinalizado como rejeitado.
- Referência aprovada recuperada: `2310075`, imediatamente anterior à V6. Não foram encontrados diffs misturados ou alterações locais nos arquivos recuperados.

`public/arthur.html` e `public/maquete.js` foram recuperados exatamente dessa referência, com comparação Git sem diferenças. Isso retira apenas a inclusão da folha V6, os wrappers flow-station/flow-destination e as duas mudanças de texto. `public/overview-v6.css` foi removido. Não houve reset, reescrita de histórico ou reversão de commits independentes.

O teste adicional foi adaptado: deixa de exigir colunas V6 e passa a verificar a sequência original Rio/B1/Poço/B2/Caixa/B3/Plantação, ausência dos wrappers e da folha V6, seis botões únicos, legado preservado, valor digitado retido e estado atualizado pela telemetria. Nenhuma exigência operacional foi reduzida.

## Preservação

Permanecem Water Experience aprovada, controles unificados, conversor avançado da Bomba 3, ausência da grade operacional duplicada, Análise Ambiental V5, Sidebar V2, Login V2, Histórico Premium V2 e demais áreas. Backend, APIs, auth, permissões, banco, Ollama, firmware, protocolo e regras das bombas não foram alterados. O documento não rastreado `docs/RELATORIO-IA-2E.md` ficou intocado.

## Testes

```powershell
node --test --test-concurrency=1 test/water-experience.test.js test/overview-v2.test.js test/ui-navigation.test.js test/environment-v5.test.js test/auth.test.js test/device-api.test.js test/history-ui.test.js test/assistant-ui.test.js
```

**57 aprovados, zero falhas**, incluindo subtestes, cerca de 38,6 s. Log ignorado: `.data/recovery-v6-tests.txt`. `git diff --check` sem erros.

Prévia temporária em loopback 3101, memória e SIMULAÇÃO, com credenciais temporárias aleatórias. Login e composição recuperada conferidos no navegador; seis larguras medidas (360, 390, 768, 1024, 1440 e 1920), com três conjuntos operacionais e sem overflow horizontal. Tema alternado pela interface; nenhum erro de console capturado. Captura: `.data/recovery-desktop.jpg`.

Os comandos foram verificados pela suíte automatizada; não foram enviados manualmente no navegador. Prévia encerrada ao fim. MySQL e Ollama não foram iniciados ou modificados.

## Arquivos da recuperação

- `public/arthur.html`
- `public/maquete.js`
- `public/overview-v6.css` (removido)
- `test/water-experience.test.js`
- `docs/RELATORIO-VISAO-GERAL-V6.md` (nota histórica de rejeição)
- `docs/RECUPERACAO-V6.md` (este registro)

## Limitações e avaliação manual

Testes determinísticos não substituem avaliação estética. Hardware continua sem validação física; defeito L-2 permanece fora do escopo. A recuperação restaura o layout anterior, sem tentar corrigi-lo ou redesenhá-lo novamente.

Abra o painel habitual em SIMULAÇÃO, faça Ctrl+F5 e confira o circuito horizontal, os três controles dentro da Water Experience, o modo AUTO/MANUAL e a Análise Ambiental. Compare com a composição anterior aprovada. As propostas futuras estão em `docs/PROPOSTAS-V7.md` e em prévias conceituais independentes na conversa. A aplicação aguarda escolha e aprovação explícita antes de qualquer V7.
