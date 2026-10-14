# Money20/20 Capture

PWA offline-first para iPhone: captura sem login, backend, créditos de IA ou chamadas externas. Aplicação estática com IndexedDB, Service Worker e MediaRecorder. A stack React/TypeScript/Dexie/Workbox/JSZip era uma sugestão no plano; este MVP implementa os mesmos contratos com JavaScript modular e APIs nativas, sem instalação de dependências nem build.

## Usar no iPhone

1. Publique a pasta `dist` via GitHub Pages, conforme abaixo.
2. Abra a URL HTTPS no Safari e espere **Aplicativo disponível offline**.
3. Compartilhar → Adicionar à Tela de Início. Abra pelo ícone e confira novamente a confirmação offline.
4. Crie reuniões, insights, oportunidades ou palestras. Campos livres são opcionais: uma nota só com áudio é aceita. Alterações do formulário e anexos são salvos como rascunho automaticamente após 400 ms; **Salvar registro** envia o registro à biblioteca. Um rascunho é recuperado na próxima abertura. O aplicativo mantém um rascunho por instalação.
5. Grave com o app aberto e a tela desbloqueada. Ao sair do app, a gravação é encerrada quando o navegador entrega o evento de visibilidade. Interrupções abruptas ou encerramento pelo sistema podem impedir a finalização; ouça o áudio após gravar. Também é possível importar áudios do app Arquivos.
6. Faça um backup diário. No iPhone, o aplicativo tenta compartilhar o ZIP com **Salvar em Arquivos** quando suportado; caso contrário, usa download. Confirme que o arquivo foi salvo: o navegador não informa com certeza se um download chegou ao destino.

O IndexedDB pertence à origem e ao contexto do navegador. Não presuma compartilhamento entre o Safari, instalação na tela inicial, outros dispositivos ou URLs diferentes. O armazenamento persistente é solicitado, mas pode ser negado. Dados não são criptografados pelo app. Backup ZIP contém os dados e anexos e deve ser guardado no destino aprovado pela empresa. A hospedagem recebe apenas o código estático; não recebe automaticamente registros.

## Cinco telas

- **Início:** atalhos de captura, quantidade de registros e aviso de registros fora do último backup.
- **Captura:** assunto, empresa/pessoa, notas, dimensões Negócios/Eficiência/Estratégia, tags, prioridade, fotos, áudio e follow-up.
- **Biblioteca:** consulta e edição offline, busca textual, filtro de tipo/empresa/data local, IDs estáveis.
- **Follow-ups:** ação, responsável, prazo, prioridade e status, com conclusão/reabertura.
- **Backup:** pacote completo, restauração validada, exportação por intervalo de datas e solicitação de persistência.

## Executar localmente

Requer Node.js 22 ou superior, sem dependências.

```sh
node tools/serve.mjs
node --test tests/*.test.mjs
```

Abra `http://127.0.0.1:4173/money2020-capture/`. O servidor simula um subdiretório do GitHub Pages. A abertura direta de `index.html` não habilita Service Worker. O endereço local no computador não é uma URL instalável no seu iPhone; use HTTPS publicado.

## Preparar/publicar no GitHub Pages

1. Crie um repositório `money2020-capture` no seu GitHub. Não inclua registros reais, backups ou anexos pessoais no repositório. Repositórios públicos tornam o código público.
2. Envie **o conteúdo desta pasta**, incluindo `.github/workflows/pages.yml`, para a raiz do repositório, na branch `main`. Pelo terminal, após configurar sua autenticação:

```sh
git init
git add .
git commit -m "Implement Money20/20 offline capture"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/money2020-capture.git
git push -u origin main
```

3. No repositório: **Settings → Pages → Source → GitHub Actions**.
4. Execute o workflow **Publish Money20/20 Capture** em Actions se necessário. Ele roda os testes e só publica quando passam. Pull requests executam os testes sem publicar.
5. Use a URL devolvida pelo workflow, normalmente `https://SEU-USUARIO.github.io/money2020-capture/`.

Não há repositório remoto configurado ou publicação executada nesta entrega. Todos os caminhos são relativos para funcionar sob o subdiretório do Pages. Em uma atualização futura, incremente a versão do cache em `dist/sw.js`. O novo Service Worker aguarda o fechamento das abas antigas; reabra o aplicativo para usar uma versão consistente. Dados IndexedDB são preservados.

Workflow conforme [documentação oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). O áudio escolhe formato com `MediaRecorder.isTypeSupported`, conforme a [API do WebKit](https://webkit.org/blog/11353/mediarecorder-api/).

## Pacotes ZIP

- `manifest.json`: versão, data, quantidade de registros e inventário dos anexos.
- `records.json`: registros estruturados com IDs, datas, dimensões e follow-ups.
- `records.csv`: leitura tabular UTF-8 com BOM; células que poderiam virar fórmulas são protegidas.
- `followups.csv`: pendências, responsáveis, prazos, prioridades e status.
- `photos/<record-id>/...` e `audio/<record-id>/...`: arquivos binários originais.
- `capture.json`: envelope completo usado pelo restaurador, incluindo o rascunho em backups.
- `draft/`: anexos do rascunho, quando houver; IDs de um registro editado podem coincidir com os do rascunho sem colisão de caminhos.
- `Infra-On-Chain.md` e `LEIA-ME.txt`: incluídos na exportação para o projeto.

O ZIP usa método STORE, sem compressão, para reduzir complexidade e trabalhar offline. O restaurador aceita ZIPs originais deste aplicativo, valida caminhos, CRC de todos os arquivos, esquema, IDs, datas e anexos antes de escrever; a importação acontece em uma única transação IndexedDB. Um ID existente é substituído após confirmação, mesmo se a versão importada for mais antiga. Registros ausentes do pacote são mantidos. Um rascunho importado substitui o atual. Exportações também são restauráveis, mas não incluem rascunho. Faça backup antes de restaurar uma versão antiga.

Limites do MVP: 100 MB por arquivo, 450 MB de anexos por pacote, 512 MB por ZIP importado, 10 mil registros por importação. Geração/importação usam memória; o limite técnico não garante capacidade de um iPhone com pouca memória. Exporte por dia para volumes maiores. Fotos não são recomprimidas. HEIC depende do suporte do navegador para pré-visualização; o arquivo original permanece no backup. Não há transcrição automática nem sincronização entre aparelhos.

## Importar no Infra On-Chain

Exporte o período desejado, salve e extraia o ZIP em Arquivos. No projeto Infra On-Chain do ChatGPT, anexe `Infra-On-Chain.md` e/ou `records.json`, seguido das fotos e áudios relevantes, conforme os formatos e limites aceitos na sua conta. Não dependa da leitura direta de ZIP pelo ChatGPT. IDs permitem reconhecer registros já importados; a deduplicação no projeto é um processo manual, não uma integração automática.

Sugestão de pedido: “Analise os registros do Money20/20, identifique as dez descobertas mais relevantes para a Nomad, consolide oportunidades de negócio e eficiência e prepare recomendações executivas com evidências. Preserve os IDs; diferencie notas de campo, hipóteses e fatos verificados.”

## Validação

Consulte `TESTES.md` para resultados e roteiro de homologação no iPhone. Testes de Service Worker em Node usam uma simulação de Cache API com os arquivos reais do pacote; isso não substitui testes no Safari/iOS.
