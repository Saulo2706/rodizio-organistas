# Rodízio de Organistas (Publicação para GitHub Pages)

Este repositório contém uma aplicação web simples para gerar rodízios de organistas. Foi feita para ser fácil de usar e hospedada via GitHub Pages.

O que inclui:
- index.html — interface amigável (desktop e tablet)
- rotation.js — algoritmo de seleção/rodízio
- app.js — lógica da interface, armazenamento local (localStorage)
- export.js — exporta .xlsx (usa SheetJS via CDN) ou CSV

Como publicar (o que eu faço quando você me autorizar):
- Eu envio estes arquivos para o repositório que você informar e crio um branch / pull request.
- Se preferir, eu publico diretamente no GitHub Pages (branch `gh-pages` ou via Action).
- Depois do deploy, eu envio o link público (ex.: https://USERNAME.github.io/REPO).

Observações:
- Atualmente os dados são salvos no navegador (localStorage). Se quiser salvar online (para que você e sua mãe acessem de qualquer computador), posso integrar com Firebase/Firestore (plano gratuito) e publicar no mesmo repositório.
- Se tiver um modelo Excel específico, envie que eu adapto a exportação para o layout que você usa.

Próximos passos:
1. Me autorize para que eu crie/publque o repositório em seu nome (se quiser que eu faça).
2. Ou crie o repositório você mesmo e faça o upload dos arquivos acima; em seguida ative Pages na branch gh-pages.
3. (Opcional) Envie o modelo Excel (upload no repo ou link compartilhado) para eu adaptar a exportação ao formato exato.
