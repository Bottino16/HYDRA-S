# HYDRA-S — login com hero e jornada de scroll

## Diagnóstico e conceito

A versão anterior mostrava branding e formulário simultaneamente, como um login convencional. A ilustração e o título eram estáticos; não existia abertura dedicada, indicação de continuidade ou sequência narrativa. O novo conceito é: Inteligência para cultivar. Consciência para cada gota.

A página agora organiza três momentos: identidade HYDRA-S em abertura ampla; percurso visual da água até o cultivo; acesso à instalação. O conteúdo menciona irrigação inteligente e economia de água como propósito, sem prometer percentuais de economia ou validação física.

## Alterações

- public/login.html: três seções sem novas rotas, hero textual, indicação de scroll, links para continuar e acessar diretamente, seção intermediária com SVG local e seção de login separada. data-logo-slot no cabeçalho reserva a estrutura para inserir a logo oficial como imagem local, com largura/altura limitadas; ao substituir o símbolo decorativo, manter a identidade textual acessível ao lado.
- public/login-premium.css: composição vertical, fundos aquáticos, arcos suaves, responsividade, temas, foco, rolagem suave, movimento discreto no indicador e transições por opacidade/deslocamento. Foi reescrito o arquivo específico do login, preservando os estilos compartilhados.
- public/login-experience.js: IntersectionObserver revela conteúdos decorativos/editoriais uma vez. Sem bibliotecas, tarefas contínuas ou listeners de scroll. Formulário nunca é escondido pela animação; documentos funcionam sem esse script ou sem suporte ao observador. Preferência de movimento reduzido desabilita animações e rolagem suave; mudanças da preferência liberam todos os elementos observados. Saída da página encerra a observação.
- test/login-experience.test.js: três testes direcionados.
- docs/RELATORIO-LOGIN-HERO.md: esta entrega.

Os campos, IDs, labels, autocomplete, script login.js, fluxo CSRF, prevenção de duplicidade, erros e carregamento foram mantidos. Nenhuma alteração em backend, sessão, permissões, banco, IA, firmware, protocolo ou lógica das bombas. Nenhuma biblioteca ou dependência adicionada. Sem scroll obrigatório, snap, bloqueio de rolagem ou captura de teclado.

## Testes

Comando: node --test --test-concurrency=1 test/access-ui.test.js test/login-experience.test.js

Nove testes aprovados, nenhuma falha. Os seis anteriores cobrem payload/CSRF, carregamento, erro seguro, envio duplicado, fluxo simulado de sucesso, indisponibilidade e temas/administração. Os três novos verificam sequência/âncoras/contratos, fallback sem animação, observação/revelação e movimento reduzido inicial e alterado.

Conferência real no navegador local: hero, links de continuidade, seção intermediária e acesso; temas claro e escuro. Larguras conferidas: 360, 390, 768, 1024 e 1440px, sem rolagem horizontal nos pontos medidos. Refinado o tablet para colunas equilibradas na seção de acesso. Foco visível confirmado ao passar de usuário para senha com Tab. No celular, o login fica abaixo do hero e a ilustração intermediária continua disponível. A inspeção visual não é uma auditoria formal de acessibilidade.

Não foi submetido login real, alterada conta ou exercitado MySQL. Autenticação real manual, teclado virtual, zoom, navegadores diferentes e preenchimento automático continuam para avaliação do usuário. Movimento reduzido foi verificado em testes determinísticos e regras CSS; não alterei a preferência do Windows. Não medi FPS ou consumo de RAM/GPU nem iniciei o Ollama.

Capturas locais não versionadas: .data/login-hero-desktop.jpg (abertura final) e .data/login-hero-access.jpg (acesso). git diff --check sem erros. O arquivo não versionado docs/RELATORIO-IA-2E.md já existente foi preservado fora dos commits.

## Commits

- e327355: abertura hero e jornada vertical.
- 69cbd04: revelação leve, movimento reduzido e testes.
- Commit final: refinamento de conteúdo/tablet e relatório; consultar git log -1.

## Avaliação manual

1. Com o servidor existente em SIMULAÇÃO, abrir http://localhost:3000/login.html e pressionar Ctrl+F5. Se necessário, iniciar com npm start usando o ambiente local já configurado.
2. Conferir abertura em ambos os temas. Clicar em Role para continuar, observar a revelação e seguir para o acesso.
3. No desktop, testar Acessar sistema para pular direto ao formulário. Pelo teclado, usar o primeiro link Ir para o login; conferir foco e digitação.
4. Entrar com a conta existente e confirmar o painel. Não é necessário alterar configuração, banco ou Ollama para avaliar a apresentação.
5. No celular físico, conferir teclado virtual, rolagem livre e mensagens. Em alturas pequenas, a página pode crescer naturalmente; não existe corte obrigatório por viewport.
6. Avaliar com redução de movimento ativada no próprio dispositivo: conteúdos devem permanecer disponíveis, sem transições ou rolagem suave.

Pendente a logo oficial e sua avaliação estética. Nenhuma próxima tela ou correção operacional L-2 foi iniciada. Exclusivamente SIMULAÇÃO; firmware NÃO VALIDADO fisicamente.
