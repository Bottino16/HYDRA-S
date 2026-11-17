# HYDRA-S — Login Premium V2

## Diagnóstico e direção de arte

A V1 usava revelação por IntersectionObserver uma única vez. O scroll não desenhava o percurso, não mudava a ilustração e não revertia estados. A apresentação tinha marca forte, mas nenhum elemento de água dominante nem narrativa dos quatro componentes. O acesso do cabeçalho também desaparecia no mobile, sem uma alternativa de acesso direto dentro do hero.

A V2 adota Cada gota tem um propósito, com marca textual, gota vetorial ampla, iluminação aquática e três momentos: abertura, jornada ilustrativa e autenticação. A futura logo continua reservada no componente data-logo-slot; não foi criada uma logo definitiva. O SVG da jornada identifica Rio, Poço, Caixa e Plantação e declara explicitamente que é conceitual, sem telemetria ou vazão medida.

## Movimento e implementação

- Entrada inicial coordenada por CSS: marca, duas linhas da frase, descrição, gota e convite. Duração máxima do efeito principal de 1,2 segundo, sem bloquear links, formulário ou teclado. Conteúdo reduzido continua visível durante a entrada.
- A seção intermediária mantém a cena em position:sticky por um trecho de rolagem natural. Altura total de 240svh no desktop e 230svh no celular; não há novas seções.
- Uma progressão normalizada de zero a um deriva da posição geométrica da seção. Controla stroke-dashoffset da rota SVG, posição da gota pelo getPointAtLength nativo, preenchimento dos dois reservatórios, crescimento da plantação e destaque das quatro etapas. A mesma função atua ao rolar para trás, sem disparar uma sequência automática independente.
- Leve deslocamento decorativo da gota do hero e entrada de até 22px no cartão de acesso. O cartão permanece com opacidade de pelo menos 0,9, sem ocultar controles; foco nos campos remove o deslocamento.
- Listener de scroll passivo e requestAnimationFrame sob demanda; eventos agrupados em um frame, leituras geométricas antes das escritas, sem loop contínuo ou biblioteca. O resize reavalia a cena.
- Foram avaliados recursos nativos: o navegador usado informa suporte a animation-timeline:scroll(). Escolheu-se CSS para entrada/sticky e JS mínimo para sincronizar o ponto real no SVG, preenchimentos e etapas por um único progresso, sem depender de suporte uniforme a timelines CSS. Não foi introduzida biblioteca.
- Pôster estático é o padrão. Sem JavaScript de animação, SVG compatível ou APIs necessárias, todos os componentes e o formulário continuam disponíveis. Com prefers-reduced-motion ou altura inferior a 540px, não há trecho fixo estendido. Mudança da preferência, saída e restauração pelo cache são tratadas. CSS também desliga animações e rolagem suave na preferência reduzida.
- Acessar sistema está presente no próprio hero, inclusive mobile, além do cabeçalho no desktop; âncoras e link de pular ao formulário mantêm o comportamento do navegador. Sem scroll hijacking, preventDefault, bloqueio de toque ou espera obrigatória.

## Arquivos alterados

- public/login.html: composição, textos autorizados e SVG em quatro etapas.
- public/login-premium.css: direção de arte, entrada e cena responsiva.
- public/login-experience.js: progressão reversível e ciclo de vida.
- test/login-experience.test.js: casos específicos atualizados para o novo contrato visual.
- docs/RELATORIO-LOGIN-PREMIUM-V2.md: relatório.

O teste antigo de unobserve foi substituído porque o efeito deixou de ser uma revelação única. Foram mantidas verificações de âncoras e formulário, acrescentando reversão, preenchimentos, agrupamento de frames, APIs ausentes, movimento reduzido e cache. A suíte access-ui não foi alterada.

Não houve alterações em login.js, temas compartilhados, backend, sessões, CSRF, permissões, banco, Ollama, bombas, firmware, protocolo ou outras telas. Nenhuma instalação, dependência nova ou modificação do .env.

## Testes e evidências

1. node --test --test-concurrency=1 test/access-ui.test.js test/login-experience.test.js — 11 aprovados, zero falhas, 5,05 segundos.
2. node --test --test-concurrency=1 test/auth.test.js — 19 aprovados (incluindo subtestes), zero falhas, 17,16 segundos. Exercita login válido/inválido, CSRF, origem, cookies, isolamento, expiração, logout, sockets e telas. Usa usuários de teste em memória; o caso de indisponibilidade do MySQL aponta deliberadamente para a porta 1 e verifica fallback, sem migração ou gravação no MySQL operacional.
3. Navegador local: abertura e acesso, teclado com foco visível, temas claro/escuro; larguras 360, 390, 768, 1024, 1440 e 1920px conferidas. Sem overflow horizontal nos pontos medidos. Não significa que todos os estados foram inspecionados em cada combinação de largura e tema.
4. Scroll real pelo teclado: progresso de 0,0000 para 0,5926, movimento da gota até a Caixa e preenchimentos visíveis; PageUp retornou a 0,0000. No mobile, progresso de 0,6292 observado com cena fixa e sem overflow. Testes determinísticos também verificam o estado final 1,0000, plantação completa e volta para 0,2500.
5. Acesso direto confirmado no desktop e mobile com hash #login-area e formulário disponível; campos não dependem da apresentação. Nenhum login pessoal foi submetido pelo navegador. Os logins válidos/inválidos acima são dos testes HTTP isolados e dos testes de interface com fetch controlado.
6. Console da página sem erros registrados na conferência. git diff --check sem erros.

Capturas locais não versionadas: .data/login-v2-hero.jpg, .data/login-v2-journey.jpg e .data/login-v2-mobile.jpg. Não houve coleta de segredos ou envio de dados a serviços externos.

## Desempenho e limitações

Avaliação interativa no notebook, sem bloqueio observado nos comandos de navegação testados. Isso não é benchmark de FPS, consumo de RAM/VRAM ou validação de toque em aparelho físico. A implementação evita vídeo, canvas, filtros pesados, dependências, temporizadores contínuos e múltiplos listeners de scroll. O ensaio real de IA segue separado e não foi iniciado.

Movimento reduzido, falta de SVG e viewport curto foram validados deterministicamente e pelas regras CSS; não alterei as preferências do Windows ou desativei scripts no navegador. Pendentes: teclado virtual, acessibilidade formal, outros navegadores e avaliação manual de fluidez com a carga habitual de aplicativos. Logo oficial ainda pendente.

## Commits

- 56dd63d: composição cinematográfica e percurso SVG.
- 641bc05: scroll reversível, fallbacks e testes.
- Commit documental final: consultar git log -1.

## Roteiro de avaliação

1. Abrir http://localhost:3000/login.html e usar Ctrl+F5. Se necessário, iniciar npm start com o ambiente local existente em SIMULAÇÃO.
2. Conferir entrada da marca, frase e gota; testar Acessar sistema imediatamente, sem esperar.
3. Voltar ao topo, seguir Acompanhe o percurso e rolar lentamente para baixo e para cima: gota, linha, reservatórios e plantação devem acompanhar a posição.
4. Testar Ir para o acesso, Tab entre usuário/senha/Entrar e login com a conta existente.
5. Alternar temas e conferir celular/tablet. Em aparelho físico, avaliar teclado virtual e rolagem natural.
6. Com preferência de movimento reduzido no próprio dispositivo, confirmar pôster estático e acesso livre. A ausência da animação não deve impedir autenticação.

Somente Login Premium V2. Exclusivamente SIMULAÇÃO; firmware NÃO VALIDADO fisicamente. Nenhuma etapa operacional L-2 ou outra tela iniciada. O relatório IA-2E não versionado, já presente no início, foi preservado fora destes commits. Aguardar aprovação.
