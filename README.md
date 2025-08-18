# 📚 Dicionário API

API desenvolvida em NestJS para gerenciar usuários, palavras, favoritos e histórico de consultas.

## 📑 Sumário

- [Sobre](#-sobre)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Rodando o Projeto](#-rodando-o-projeto)
- [Endpoints](#-endpoints)
<hr/>

## 📖 Sobre

## Sobre o Projeto

Esta API foi projetada para fornecer uma interface prática e centralizada de acesso a um dicionário em inglês. O usuário pode criar uma conta e realizar login com suas credenciais para ter acesso às funcionalidades disponíveis. Uma vez autenticado, é possível navegar pela lista de palavras do dicionário, explorar detalhes individuais de cada uma delas e consultar seus significados de forma simples e rápida.

Além da navegação básica, a API registra automaticamente as palavras que já foram visualizadas, construindo um histórico pessoal de buscas. Esse histórico pode ser consultado a qualquer momento, permitindo ao usuário retomar facilmente termos já pesquisados. Também é possível marcar palavras como favoritas, criando assim uma coleção personalizada de termos mais relevantes, com a flexibilidade de adicionar e remover favoritos conforme desejar.

Internamente, a API atua como um proxy da [Words API](https://dictionaryapi.dev/). Essa abordagem garante que toda a comunicação do front-end aconteça exclusivamente através da API desenvolvida, mantendo a arquitetura desacoplada, segura e de fácil manutenção. Dessa forma, o projeto entrega não apenas uma ferramenta de consulta a palavras, mas também uma camada adicional de organização e personalização da experiência do usuário.

<hr/>

## 🚀 Tecnologias Utilizadas

- **[NestJS](https://nestjs.com/)** – Framework Node.js para construção de APIs escaláveis e modulares
- **[TypeScript](https://www.typescriptlang.org/)** – Superset do JavaScript com tipagem estática
- **[Prisma](https://www.prisma.io/)** – ORM moderno para modelagem e acesso ao banco de dados
- **[Express](https://expressjs.com/)** – Servidor HTTP que serve como base para o NestJS
- **[Zod](https://zod.dev/)** – Biblioteca de validação de esquemas e tipos
- **[Jest](https://jestjs.io/)** – Framework de testes para garantir qualidade e robustez do código
- **[PostgreSQL](https://www.postgresql.org/)** – Banco de dados relacional para armazenamento persistente
- **[Redis](https://redis.io/)** – Armazenamento em cache para otimização de performance
- **[JWT (JSON Web Token)](https://jwt.io/)** – Autenticação segura baseada em tokens
- **[Swagger](https://swagger.io/)** – Documentação interativa da API
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js/)** – Hashing seguro de senhas
- **[Husky](https://typicode.github.io/husky/)** - Automação de hooks de Git para manter a qualidade do código antes de commits e pushes.
- **[Commitizen](http://commitizen.github.io/cz-cli/)** - Padronização de mensagens de commit seguindo boas práticas.
- **[Docker](https://www.docker.com/)** – Containerização da aplicação para facilitar o deploy, testes e desenvolvimento em ambientes isolados.
- **[GitHub Actions](https://github.com/features/actions)** – CI/CD para rodar testes automáticos e publicar imagens Docker automaticamente no Docker Hub.

<hr/>

## ⚙️ Instalação

Clone o repositório:

```bash
git clone https://github.com/escbarros/FloraAPI
cd FloraAPI
```

Instale as depenências:

```bash
npm install
```

<hr/>

## 🔧 Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

DATABASE_URL="postgresql://flora_user:flora_password@localhost:5432/flora_db?schema=public"
JWT_SECRET=<HASH>

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=300
```

Inicie os bancos de dados

```bash
docker-compose up -d postgres redis
npx prisma migrate dev --name init
npx prisma generate
```

<hr/>

## Rodando o projeto

**1.API**
É possivel rodar de duas formas:

**1.1. No terminal (localmente)**:
Você pode rodar a aplicação localmente, subindo apenas os serviços de apoio (PostgreSQL e Redis) em containers e executando a API no seu terminal:

```bash
docker-compose up -d postgres redis
npm run start
```

**1.2. Usando containers (Docker)**:
Você pode rodar toda a aplicação (API, banco de dados e cache) em containers, facilitando o deploy e a padronização do ambiente:

```bash
docker-compose up -d
```

<hr/>

## Endpoints

> 💡 **Nota:** Todos os endpoints podem ser testados de forma interativa diretamente na interface do **Swagger UI**, que geralmente está disponível no endereço `/api` da aplicação.

### Auth

<details closed>
<summary><strong>[POST] /auth/signup</strong></summary>
Registra um novo usuário no sistema, retornando os dados do usuário e um token de autenticação (JWT).
<br/><br/>

**Request Body**
O corpo da requisição deve ser um objeto JSON contendo os dados para o cadastro do novo usuário.

| Campo      | Tipo   | Descrição                                          | Exemplo            |
| :--------- | :----- | :------------------------------------------------- | :----------------- |
| `name`     | string | **Obrigatório.** Nome completo do usuário.         | `John Doe`         |
| `email`    | string | **Obrigatório.** Endereço de e-mail único.         | `user@example.com` |
| `password` | string | **Obrigatório.** Senha com no mínimo 6 caracteres. | `password123`      |

<br>

**Exemplo de corpo da requisição:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Responses**

Aqui estão as possíveis respostas para esta requisição.

✅ **201 Created**

Retornado quando o usuário é criado com sucesso.

**Exemplo de corpo da resposta:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi..."
}
```

❌ **400 Bad Request**

Retornado se os dados fornecidos na requisição forem inválidos (ex: e-mail em formato incorreto, senha muito curta, ou campos obrigatórios ausentes).

---

</details>
<details>
<summary><strong>[POST] /auth/signin</strong></summary>

Autentica um usuário existente com e-mail e senha, retornando os dados do usuário e um novo token de autenticação (JWT).
<br/>

**Request Body**

O corpo da requisição deve ser um objeto JSON contendo as credenciais do usuário.

| Campo      | Tipo   | Descrição                                        | Exemplo            |
| :--------- | :----- | :----------------------------------------------- | :----------------- |
| `email`    | string | **Obrigatório.** O e-mail cadastrado do usuário. | `user@example.com` |
| `password` | string | **Obrigatório.** A senha do usuário.             | `password123`      |

**Exemplo de corpo da requisição:**
<br>

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Responses**

Aqui estão as possíveis respostas para esta requisição.

✅ **200 OK**

Retornado quando as credenciais são válidas e o usuário é autenticado com sucesso.

**Exemplo de corpo da resposta:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi..."
}
```

❌ **400 Bad Request**

Retornado se os dados fornecidos na requisição forem inválidos (ex: e-mail em formato incorreto ou campos obrigatórios ausentes).

❌ **401 Unauthorized**

Retornado se as credenciais (e-mail ou senha) estiverem incorretas.

---

</details>

##

### Entries

<details>
<summary><strong>[GET] /en</strong></summary>

Busca por registros com base em uma palavra-chave, com suporte para paginação.

**Cabeçalho de Autenticação**

Este endpoint é protegido. Você deve fornecer um token JWT no cabeçalho `Authorization`.

| Header          | Descrição                             | Exemplo                        |
| :-------------- | :------------------------------------ | :----------------------------- |
| `Authorization` | Token de acesso do tipo Bearer (JWT). | `Bearer eyJhbGciOiJIUzI1Ni...` |

**Query Parameters**

Os parâmetros são enviados na URL para filtrar e paginar os resultados.

| Parâmetro | Tipo   | Descrição                             | Exemplo |
| :-------- | :----- | :------------------------------------ | :------ |
| `search`  | string | **Opcional.** Palavra-chave da busca. | `fire`  |
| `page`    | number | **Opcional.** Número da página.       | `1`     |
| `limit`   | number | **Opcional.** Resultados por página.  | `10`    |

**Exemplo de URL:**
`/en?search=fire&page=1&limit=10`

**Responses**

Aqui estão as possíveis respostas para esta requisição.

✅ **200 OK**

Retornado com a lista de resultados da busca, junto com as informações de paginação.

**Exemplo de corpo da resposta:**

```json
{
  "result": ["firebox", "fireshine", "pinfire", "firespout"],
  "totalDocs": 200,
  "page": 1,
  "totalPages": 20,
  "hasNext": true,
  "hasPrev": false
}
```

❌ **401 Unauthorized**

Retornado se o token de autenticação (JWT) não for fornecido, for inválido ou estiver expirado.

❌ **400 Bad Request**

Retornado se os parâmetros da query forem inválidos (ex: `page` ou `limit` não são números).

---

</details>

<details>
<summary><strong>[GET] /en/:word</strong></summary>

Obtém os detalhes de uma palavra específica, como suas definições e classe gramatical.

**Cabeçalho de Autenticação**

Este endpoint é protegido. Você deve fornecer um token JWT no cabeçalho `Authorization`.

| Header          | Descrição                             | Exemplo                        |
| :-------------- | :------------------------------------ | :----------------------------- |
| `Authorization` | Token de acesso do tipo Bearer (JWT). | `Bearer eyJhbGciOiJIUzI1Ni...` |

**Parâmetros da URL**

O parâmetro obrigatório deve ser incluído diretamente no caminho da URL.

| Parâmetro | Descrição                                 | Exemplo |
| :-------- | :---------------------------------------- | :------ |
| `{word}`  | **Obrigatório.** A palavra a ser buscada. | `fire`  |

**Exemplo de URL:**
`/en/fire`

**Responses**

Aqui estão as possíveis respostas para esta requisição.

✅ **200 OK**
Retornado com os detalhes da palavra solicitada.

**Exemplo de corpo da resposta:**

```json
{
  "word": "fire",
  "meanings": [
    {
      "partOfSpeech": "noun",
      "definitions": [
        "Combustion or burning, in which substances combine chemically with oxygen from the air and typically give out bright light, heat, and smoke.",
        "A strong passion or emotion."
      ]
    },
    {
      "partOfSpeech": "verb",
      "definitions": [
        "To discharge a gun or other weapon in order to propel a projectile.",
        "To dismiss (an employee) from a job."
      ]
    }
  ]
}
```

❌ **400 Bad Request**

Retornado se houver uma falha genérica ao buscar os detalhes da palavra.

❌ **401 Unauthorized**

Retornado se o token de autenticação (JWT) não for fornecido, for inválido ou estiver expirado.

❌ **404 Not Found**

Retornado se não forem encontradas definições para a palavra especificada.

---

</details>

<details>
<summary><strong>[POST] /en/:word/favorite</strong></summary>

Adiciona uma palavra específica à lista de favoritos do usuário autenticado.

**Cabeçalho de Autenticação**

Este endpoint é protegido. Você deve fornecer um token JWT no cabeçalho `Authorization`.

| Header          | Descrição                             | Exemplo                      |
| :-------------- | :------------------------------------ | :--------------------------- |
| `Authorization` | Token de acesso do tipo Bearer (JWT). | `Bearer eyJhbGciOiUzI1Ni...` |

**Parâmetros da URL**

O parâmetro obrigatório deve ser incluído diretamente no caminho da URL.

| Parâmetro | Descrição                                    | Exemplo |
| :-------- | :------------------------------------------- | :------ |
| `{word}`  | **Obrigatório.** A palavra a ser favoritada. | `fire`  |

**Exemplo de URL:**
`/en/fire/favorites`

### **Responses**

Aqui estão as possíveis respostas para esta requisição.

#### ✅ **204 No Content**

Retornado quando a palavra é adicionada aos favoritos com sucesso. **Nenhum conteúdo** é enviado no corpo desta resposta.

#### ❌ **400 Bad Request**

Retornado se houver uma falha genérica ao tentar favoritar a palavra.

#### ❌ **401 Unauthorized**

Retornado se o token de autenticação (JWT) não for fornecido, for inválido ou estiver expirado.

#### ❌ **404 Not Found**

Retornado se a palavra especificada não for encontrada no sistema.

---

</details>

<details>
<summary><strong>[DELETE] /en/:word/unfavorite</strong></summary>

Remove uma palavra da lista de favoritos do usuário autenticado.

**Cabeçalho de Autenticação**

Este endpoint é protegido. Você deve fornecer um token JWT no cabeçalho `Authorization`.

| Header          | Descrição                             | Exemplo                      |
| :-------------- | :------------------------------------ | :--------------------------- |
| `Authorization` | Token de acesso do tipo Bearer (JWT). | `Bearer eyJhbGciOiUzI1Ni...` |

**Parâmetros da URL**

O parâmetro obrigatório deve ser incluído diretamente no caminho da URL.

| Parâmetro | Descrição                                                | Exemplo |
| :-------- | :------------------------------------------------------- | :------ |
| `{word}`  | **Obrigatório.** A palavra a ser removida dos favoritos. | `fire`  |

**Exemplo de URL:**
`/en/fire/unfavorite`

**Responses**

Aqui estão as possíveis respostas para esta requisição.

✅ **204 No Content**

Retornado quando a palavra é removida dos favoritos com sucesso. **Nenhum conteúdo** é enviado no corpo desta resposta.

❌ **401 Unauthorized**

Retornado se o token de autenticação (JWT) não for fornecido, for inválido ou estiver expirado.

❌ **404 Not Found**

Retornado se a palavra não for encontrada na lista de favoritos do usuário ou se a palavra não existir no sistema.

---

</details>

##

### User

<details>
<summary><strong>[GET] /user/me</strong></summary>

Recupera as informações de perfil do usuário autenticado.

**Cabeçalho de Autenticação**

Este endpoint é protegido. Você deve fornecer um token JWT no cabeçalho `Authorization`.

| Header          | Descrição                             | Exemplo                      |
| :-------------- | :------------------------------------ | :--------------------------- |
| `Authorization` | Token de acesso do tipo Bearer (JWT). | `Bearer eyJhbGciOiUzI1Ni...` |

**Responses**

Aqui estão as possíveis respostas para esta requisição.

✅ **200 OK**
Retornado com as informações de perfil do usuário.

**Exemplo de corpo da resposta:**

```json
{
  "id": "e0e6a620-43a3-435d-b7f2-802c26f9770c",
  "email": "mail@example.com",
  "name": "John Doe"
}
```

❌ **400 Bad Request**

Retornado se houver uma falha genérica ao buscar os detalhes do perfil.

❌ **401 Unauthorized**

Retornado se o token de autenticação (JWT) não for fornecido, for inválido ou estiver expirado.

❌ **404 Not Found**

Retornado se o usuário associado ao token não for encontrado no sistema.

---

</details>
<details>
<summary><strong>[GET] /user/me/history</strong></summary>

Recupera o histórico de palavras pesquisadas pelo usuário autenticado, com suporte para paginação.

**Cabeçalho de Autenticação**

Este endpoint é protegido. Você deve fornecer um token JWT no cabeçalho `Authorization`.

| Header          | Descrição                             | Exemplo                      |
| :-------------- | :------------------------------------ | :--------------------------- |
| `Authorization` | Token de acesso do tipo Bearer (JWT). | `Bearer eyJhbGciOiUzI1Ni...` |

**Query Parameters**

Os parâmetros são enviados na URL para paginar os resultados.

| Parâmetro | Tipo   | Descrição                            | Exemplo |
| :-------- | :----- | :----------------------------------- | :------ |
| `page`    | number | **Opcional.** Número da página.      | `1`     |
| `limit`   | number | **Opcional.** Resultados por página. | `10`    |

**Exemplo de URL:**
`/user/me/history?page=1&limit=10`

**Responses**

Aqui estão as possíveis respostas para esta requisição.

✅ **200 OK**
Retornado com o histórico de palavras do usuário, paginado.

**Exemplo de corpo da resposta:**

```json
{
  "result": [
    {
      "word": "firebox",
      "added": "2023-01-01T00:00:00Z"
    },
    {
      "word": "fireshine",
      "added": "2023-01-02T00:00:00Z"
    },
    {
      "word": "pinfire",
      "added": "2023-01-03T00:00:00Z"
    }
  ],
  "totalDocs": 30,
  "page": 1,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": false
}
```

❌ **400 Bad Request**

Retornado se os parâmetros da query forem inválidos (ex: `page` não é um número) ou se houver uma falha genérica.

❌ **401 Unauthorized**

Retornado se o token de autenticação (JWT) não for fornecido, for inválido ou estiver expirado.

❌ **404 Not Found**

Retornado se não for encontrado um histórico para o usuário.

---

</details>
<details>
<summary><strong>[GET] /user/me/favorites</strong></summary>

Recupera a lista de palavras favoritas do usuário autenticado, com suporte para paginação.

**Cabeçalho de Autenticação**

Este endpoint é protegido. Você deve fornecer um token JWT no cabeçalho `Authorization`.

| Header          | Descrição                             | Exemplo                      |
| :-------------- | :------------------------------------ | :--------------------------- |
| `Authorization` | Token de acesso do tipo Bearer (JWT). | `Bearer eyJhbGciOiUzI1Ni...` |

**Query Parameters**

Os parâmetros são enviados na URL para paginar os resultados.

| Parâmetro | Tipo   | Descrição                            | Exemplo |
| :-------- | :----- | :----------------------------------- | :------ |
| `page`    | number | **Opcional.** Número da página.      | `1`     |
| `limit`   | number | **Opcional.** Resultados por página. | `10`    |

**Exemplo de URL:**
`/user/me/favorites?page=1&limit=10`

**Responses**

Aqui estão as possíveis respostas para esta requisição.

✅ **200 OK**
Retornado com a lista de palavras favoritas do usuário, paginada.

**Exemplo de corpo da resposta:**

```json
{
  "result": [
    {
      "word": "firebox",
      "added": "2023-01-01T00:00:00Z"
    },
    {
      "word": "fireshine",
      "added": "2023-01-02T00:00:00Z"
    }
  ],
  "totalDocs": 2,
  "page": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

❌ **400 Bad Request**

Retornado se os parâmetros da query forem inválidos (ex: `page` não é um número) ou se houver uma falha genérica.

❌ **401 Unauthorized**

Retornado se o token de autenticação (JWT) não for fornecido, for inválido ou estiver expirado.

❌ **404 Not Found**

Retornado se o usuário não tiver nenhuma palavra favorita.

</details>
