# Validação e homologação — 14/10/2026

## Automatizados

Executar `node --test tests/*.test.mjs`.

9 testes passaram: CRC conhecido, ZIP UTF-8/binários, restauração completa com rascunho editado e anexos, arquivos da exportação, nota só com áudio, rejeição de corrupção/truncamento/caminhos duplicados ou perigosos, rejeição de versões/IDs/anexos inválidos, proteção CSV e cache offline em subdiretório Pages. O teste do cache verifica que a atualização remove somente caches do próprio caminho e não interfere em outra instalação.

## iPhone real — pendente

## Verificação no navegador desktop

Confirmado no navegador integrado: instalação do Service Worker, recuperação de um rascunho após recarregar, abertura da aplicação com o servidor local desligado, salvamento de uma reunião sem título, consulta na biblioteca, conclusão de follow-up e geração/download de ZIP com o servidor desligado. O ZIP baixado foi relido pelo restaurador e preservou a nota e o status concluído. Desligar o servidor testa a indisponibilidade da origem, mas não equivale a ativar modo avião no iPhone. Áudio, câmera e instalação no iOS permanecem pendentes.

Executar antes de considerar o aplicativo homologado para o evento. Esta entrega não tem acesso a um iPhone real. Use dados de teste descartáveis e confirme a mesma URL/instalação a cada etapa.

| Teste | Procedimento | Resultado esperado | Estado |
|---|---|---|---|
| Instalação | Abrir URL HTTPS no Safari, aguardar confirmação offline, adicionar à tela inicial e abrir | Interface independente, sem login | Pendente |
| Modo avião | Ativar modo avião, fechar e abrir a PWA | Cinco telas acessíveis | Pendente |
| Captura | Criar nota só texto, só áudio e só foto | Salvar e localizar na biblioteca | Pendente |
| Rascunho | Digitar, esperar “Salvo neste dispositivo”, fechar e reabrir | Campos e anexos recuperados | Pendente |
| Edição | Abrir registro, alterar e salvar offline | Mesmo ID, sem duplicação | Pendente |
| Áudio | Gravar, parar, ouvir, fechar e reabrir | Reprodução completa após reabertura | Pendente |
| Interrupção | Bloquear tela, alternar aplicativo e receber chamada durante gravação | Interrupção tratada; conferir áudio salvo e eventuais perdas | Pendente |
| Permissão negada | Negar microfone e importar áudio por Arquivos | Erro compreensível; captura por texto continua | Pendente |
| Fotos | Câmera e fototeca; testar JPEG e HEIC | Arquivo preservado e prévia quando suportada | Pendente |
| Filtros | Filtrar por empresa, tipo, assunto e data | Apenas registros correspondentes | Pendente |
| Follow-ups | Definir responsável, prazo, prioridade e concluir | Status persiste após reabrir | Pendente |
| Backup offline | Gerar ZIP, Salvar em Arquivos, localizar e conferir tamanho | Pacote com JSON/CSV/anexos e rascunho | Pendente |
| Restauração | Importar mesmo ZIP duas vezes, depois em instalação limpa | IDs não duplicam; mídia reproduz | Pendente |
| Integridade | Importar um ZIP truncado | Recusa; biblioteca anterior preservada | Pendente |
| Períodos | Exportar um dia com fotos/áudios | Só registros daquele dia, sem rascunho | Pendente |
| Infra On-Chain | Extrair ZIP e anexar Markdown/JSON e mídia no projeto | Análise preserva IDs e referências | Pendente |
| Atualização | Incrementar cache/publicar, fechar todas as abas e reabrir | Versão nova sem perder registros | Pendente |

Não apagar dados do Safari antes de fazer um backup e conferir que o ZIP foi realmente salvo. O aplicativo não pode garantir preservação quando o sistema encerra a gravação ou remove armazenamento.
