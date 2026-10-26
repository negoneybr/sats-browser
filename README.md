# SATS Browser

Protótipo de navegador desktop com Electron/Chromium e tema gamer preto e vermelho. A rede social SATS abre como página inicial: https://desenvolvimento-da-rede-sats.vercel.app

## Recursos iniciais
- Páginas web dentro da janela do SATS Browser.
- Abas, navegação por endereço e pesquisa Google.
- Voltar, avançar, atualizar e botão Início (abre a rede social SATS).
- Favoritos locais básicos e sessão persistente.
- Links de atalhos para SATS, Google, YouTube, Discord, Steam e Twitch.

## Executar
Requer Node.js 20+ e npm:
```bash
npm install
npm start
```

Gerar instalador para o sistema atual:
```bash
npm run dist
```

## Importante
Este é um protótipo inicial ainda não testado em todos os sistemas. Antes de usar contas importantes, revise segurança e permissões. Ainda faltam recursos como downloads, histórico pesquisável, sincronização, atualizações automáticas e testes. No Chromebook, é necessário que o ambiente Linux e os requisitos gráficos do Electron estejam disponíveis.