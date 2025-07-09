# Cadastro NF

## Descrição
O projeto "Cadastro NF" é uma aplicação leve de front-end desenvolvida com HTML e Vue 2, que permite validar notas fiscais através de webhooks. A aplicação possui uma interface simples e intuitiva, onde o usuário pode inserir uma nota fiscal e verificar sua validade.

## Estrutura do Projeto
```
cadastro-nf
├── index.html       # Contém a estrutura HTML da aplicação
├── app.js           # Lógica JavaScript da aplicação
├── style.css        # Estilos CSS para responsividade
└── README.md        # Documentação do projeto
```

## Funcionalidades
- Campo de input para inserir a "Nota Fiscal".
- Botão "Validar" que envia a nota fiscal para o webhook do ambiente selecionado.
- Exibição de mensagens de validação (válida ou não encontrada) em cores distintas.
- Seção de configurações para alternar entre os ambientes de Testes e Produção.
- Armazenamento das notas válidas no `localStorage` para persistência.
- Opção para limpar o cache.

## Endpoints Webhook
- **Ambiente de Testes:** `https://8aa26aca4b79.ngrok-free.app/webhook-test/cadastro`
- **Ambiente de Produção:** `https://8aa26aca4b79.ngrok-free.app/webhook/cadastro`

## Instruções de Uso
1. Clone o repositório ou baixe os arquivos.
2. Abra o arquivo `index.html` em um navegador.
3. Insira uma nota fiscal no campo de input.
4. Selecione o ambiente desejado (Testes ou Produção).
5. Clique no botão "Validar" para verificar a nota fiscal.
6. O resultado da validação será exibido abaixo do botão.

## Tecnologias Utilizadas
- HTML
- Vue 2 (via CDN)
- CSS

## Contribuições
Sinta-se à vontade para contribuir com melhorias ou correções.