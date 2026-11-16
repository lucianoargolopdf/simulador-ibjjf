SIMULADO ONLINE IBJJF - 500 QUESTÕES (PÁGINAS 4 A 38)
======================================================

Estrutura da pasta pronta para hospedagem (cPanel, Hostinger, Vercel, Netlify, GitHub Pages, etc.):

1. index.html          -> Página principal da prova online (20 questões aleatórias por vez, botões Enviar Prova, Criar Nova Prova e Ver Resultados + análise de erros).
2. gabarito.html       -> Página separada contendo o gabarito oficial comentado das 500 questões.
3. database.js         -> Banco de dados em JavaScript com as 500 questões e respostas.
4. banco_de_dados.json -> Banco de dados estruturado em formato JSON (para integrações futuras).
5. styles.css          -> Folha de estilos responsiva padronizada para Mobile e Desktop.
6. app.js              -> Motor do simulado, sorteio de 20 questões, correção automática e histórico local.

COMO PUBLICAR NA SUA HOSPEDAGEM:
- Basta enviar todos os arquivos desta pasta para o diretório público do seu servidor (ex: public_html ou www) e acessar o domínio normalmente. Não requer banco de dados externo ou configuração de servidor.
