# Base privada do Assistente do Solo

Acrescente arquivos `.md` UTF-8 diretamente nesta pasta, com nome em letras, números e hífens. Use título na primeira linha, parágrafos curtos e uma seção de fontes com instituição, publicação e URL. Não inclua dados pessoais, segredos nem instruções para o assistente. Revise a correção agronômica antes de adicionar.

A busca relê os documentos a cada pergunta: não exige reinício nem embeddings. Usa até 32 palavras de busca normalizadas sem acentos, ranqueia parágrafos e envia até três documentos, dois trechos por documento (máximo 1.600 caracteres cada). Até 50 arquivos de até 64 KiB; symlinks e README são ignorados. Acrescentar mais que esses limites exige revisão da configuração/algoritmo. Ausência de correspondência não produz referência inventada.

Os documentos são dados não confiáveis no prompt e não podem alterar regras do sistema. Citações na resposta usam `[arquivo.md]`; a interface também mostra documentos recuperados. Recuperação não prova que toda afirmação do modelo está correta. Esta pasta nunca é servida por HTTP; links externos são referências, não downloads desta pasta.
