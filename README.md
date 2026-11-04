# 📚 Traça — Sebo Online

**Todo livro merece um próximo leitor.**

O Traça é uma aplicação de sebo online desenvolvida como projeto acadêmico. A plataforma permite que usuários comprem e anunciem livros usados, encontrem bibliotecas de outros vendedores e gerenciem seus próprios anúncios.

O projeto é composto por uma API REST desenvolvida em Laravel e um aplicativo mobile desenvolvido com Expo e React Native.

---

## 🎯 Objetivo do projeto

Criar uma plataforma para facilitar a compra e venda de livros usados, permitindo que pessoas deem uma nova vida aos livros que já leram e encontrem novas histórias para suas estantes.

## ✨ Funcionalidades

### 🔐 Autenticação e perfil
- Cadastro de usuários.
- Login e logout.
- Autenticação por token.
- Visualização e edição dos dados do perfil.

### 📚 Catálogo de livros
- Listagem de livros disponíveis.
- Visualização dos detalhes de cada livro.
- Consulta das informações do vendedor.
- Busca de livros no catálogo.

### 🏷️ Gerenciamento de anúncios
- Cadastro de livros para venda.
- Inclusão de foto utilizando a câmera ou galeria do celular.
- Edição dos próprios anúncios.
- Exclusão dos próprios anúncios.
- Visualização dos anúncios do usuário.
- Controle de estoque.

### 👤 Biblioteca dos vendedores
- Acesso ao perfil público de um vendedor.
- Visualização dos livros anunciados por cada vendedor.
- Consulta das informações disponíveis dos livros.

### 🛒 Carrinho e pedidos
- Adição e remoção de livros do carrinho.
- Persistência local dos itens do carrinho.
- Finalização de pedidos por meio de checkout simulado.
- Validação de estoque no backend.
- Histórico de compras.

> **Observação:** o checkout é simulado para fins acadêmicos. O projeto não realiza cobranças ou pagamentos reais.

---

## 🛠️ Tecnologias utilizadas

### Backend
- PHP
- Laravel 12
- Laravel Sanctum
- Eloquent ORM
- Form Requests
- API Resources
- PHPUnit / Pest

### Aplicativo mobile
- React Native
- Expo
- Expo Router
- TypeScript
- Axios
- React Hook Form
- Zod
- React Query
- AsyncStorage
- Expo SecureStore

### Banco de dados
- Banco de dados configurado pelo Laravel através do arquivo `.env`.
- Migrations para criação e atualização das tabelas.

### Ferramentas
- Git e GitHub
- Visual Studio Code
- Expo Go

---

## 📂 Estrutura do projeto

O backend Laravel fica na raiz do repositório, enquanto o aplicativo mobile está na pasta `mobile/`.

```text
sebo-online/
│
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   └── Resources/
│   └── Models/
│
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/
│
├── routes/
│   ├── api.php
│   └── web.php
│
├── tests/
│   └── Feature/
│
├── mobile/
│   ├── app/
│   ├── features/
│   │   ├── auth/
│   │   ├── carrinho/
│   │   ├── livros/
│   │   └── vendedores/
│   ├── services/
│   └── tests/
│
├── public/
├── resources/
├── storage/
├── composer.json
└── README.md
```

---

## ⚙️ Como executar o projeto

### 1. Pré-requisitos

- PHP 8.2 ou superior.
- Composer.
- Node.js e npm.
- Banco de dados configurado para o Laravel.
- Expo Go no celular ou emulador compatível.

### 2. Configuração do backend

Na pasta principal do projeto, execute:

```bash
composer install
```

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

No Windows, também é possível criar o arquivo manualmente copiando `.env.example` e renomeando a cópia para `.env`.

Configure no arquivo `.env` os dados do banco de dados e a URL da aplicação.

Gere a chave da aplicação:

```bash
php artisan key:generate
```

Execute as migrations:

```bash
php artisan migrate
```

Inicie o servidor:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

A API ficará disponível em:

```text
http://localhost:8000/api
```

### 3. Configuração do aplicativo mobile

Entre na pasta mobile:

```bash
cd mobile
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` dentro da pasta `mobile/` com a variável:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

**Importante:** se estiver utilizando um celular físico, substitua `localhost` pelo endereço IP local do computador que está executando o Laravel.

Exemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api
```

O celular e o computador precisam estar conectados à mesma rede, e o servidor Laravel deve estar acessível pela rede local.

Inicie o Expo:

```bash
npx expo start
```

Depois, abra o aplicativo pelo Expo Go ou utilize um emulador.

---

## 🌐 API REST

A API é responsável por validar as informações, controlar os dados e disponibilizar as funcionalidades para o aplicativo mobile.

### Principais endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/livros` | Lista os livros disponíveis |
| GET | `/api/livros/{id}` | Exibe os detalhes de um livro |
| POST | `/api/livros` | Cadastra um livro autenticado |
| PUT/PATCH | `/api/livros/{id}` | Atualiza um anúncio próprio |
| DELETE | `/api/livros/{id}` | Exclui um anúncio próprio |
| GET | `/api/meus-livros` | Lista os anúncios do usuário |
| GET | `/api/vendedores/{id}` | Consulta a biblioteca pública de um vendedor |
| POST | `/api/pedidos` | Finaliza um pedido |
| GET | `/api/pedidos` | Consulta o histórico de pedidos |
| GET | `/api/pedidos/{id}` | Consulta os detalhes de um pedido |

As operações que dependem de autenticação exigem uma sessão válida.

### Senha e recuperação por e-mail

- `PATCH /api/password` altera a senha da conta autenticada. Envie `current_password`, `password` e `password_confirmation`.
- `POST /api/forgot-password` solicita um link de recuperação pelo broker nativo do Laravel.
- `POST /api/reset-password` recebe `email`, `token`, `password` e `password_confirmation`.

Para entregar mensagens de recuperação, configure no ambiente do Laravel um mailer real (`MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SCHEME`, credenciais SMTP quando necessárias, `MAIL_FROM_ADDRESS` e `MAIL_FROM_NAME`). Configure também `FRONTEND_URL` com a origem acessível do Expo Web, sem caminho, por exemplo a origem de desenvolvimento `http://localhost:8081`. Essa origem é adicionada ao CORS e aos domínios stateful do Sanctum. Não use `log` ou `array` para entrega: o endpoint retorna indisponibilidade em vez de afirmar que enviou a mensagem.

O link enviado abre `/redefinir-senha` no frontend e inclui o token e o e-mail. Em celular físico, `FRONTEND_URL` precisa ser acessível pelo dispositivo; `localhost` apontaria para o próprio celular.

As imagens ficam no disco público em `storage/app/public` e são expostas por `public/storage`. A API gera as URLs com o host da requisição, para que o endereço de imagens use o mesmo host de rede que o aplicativo está acessando.

---

## 🧪 Testes

O projeto possui testes automatizados no backend e no aplicativo mobile.

### Backend

Na raiz do projeto:

```bash
php artisan test
```

### Mobile

Dentro da pasta `mobile/`:

```bash
npm test
```

Para verificar os tipos do TypeScript:

```bash
npx tsc --noEmit
```

---

## 🔒 Segurança e regras de negócio

- Senhas armazenadas com hash.
- Autenticação utilizando Laravel Sanctum.
- Validação dos dados recebidos pela API.
- Usuários podem editar e excluir apenas os próprios anúncios.
- Pedidos são processados no backend.
- O backend valida o estoque antes de concluir um pedido.
- O preço utilizado no pedido é validado pelo servidor.
- A compra do próprio anúncio é impedida.
- O carrinho possui persistência local no aplicativo.

---

## 📱 Telas do aplicativo

O aplicativo contempla os seguintes fluxos:

1. Login.
2. Cadastro.
3. Catálogo de livros.
4. Detalhes do livro.
5. Cadastro de anúncio.
6. Edição de anúncio.
7. Perfil do usuário.
8. Biblioteca pública do vendedor.
9. Meus anúncios.
10. Carrinho.
11. Checkout e confirmação do pedido.
12. Histórico de compras.

---

## 🚀 Melhorias futuras

- Aprimoramento da identidade visual e experiência de navegação.
- Melhorias na busca e nos filtros do catálogo.
- Publicação da API em ambiente de produção.
- Implementação de novas funcionalidades conforme a evolução do projeto.

---

## 📄 Licença

Projeto acadêmico desenvolvido para fins educacionais.

---

**Traça — Sebo Online**

*Sua estante tem histórias esperando alguém.*
