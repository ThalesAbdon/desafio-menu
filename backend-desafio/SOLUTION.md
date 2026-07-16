# Solução — API de Menu

Documentação da implementação do desafio de gestão de menus. Este arquivo não
substitui o `readme.md` original (instruções do processo seletivo), apenas
documenta as decisões técnicas tomadas nesta solução.

## Como rodar

1. `npm install`
2. Copie `.env.example` para `.env` e preencha as variáveis (`MONGO_HOST`, `MONGO_PORT`, `MONGO_DATABASE`, `HOST`, `PORT`)
3. `docker compose up -d` — sobe o MongoDB localmente
4. `npm run start` — sobe o servidor com hot-reload via nodemon
5. `npm test` — roda a suíte de testes unitários (Jest)

## Endpoints

| Método | Rota                  | Descrição                                  |
| ------ | ---------------------- | ------------------------------------------- |
| POST   | `/api/v1/menu`         | Cria um item de menu                        |
| DELETE | `/api/v1/menu/:id`     | Remove um item (e seus descendentes)        |
| GET    | `/api/v1/menu`         | Retorna a árvore completa de menus          |
| GET    | `/health`              | Verifica se a API e a conexão com o Mongo estão de pé |

### POST /api/v1/menu
```json
// body
{ "name": "Televisores", "relatedId": "64f1c2b1e4b0a1a2b3c4d5e6" }

// 201
{ "id": "64f1c2b1e4b0a1a2b3c4d5e7" }
```
- `name` é obrigatório e único.
- `relatedId` é opcional. Se informado, precisa apontar para um item existente
  (retorna `400` caso contrário).

### DELETE /api/v1/menu/:id
Remove o item e, em cascata, todos os seus descendentes (ver decisão abaixo).
Retorna `200` com o `id` removido, ou `400` se o item não existir.

### GET /api/v1/menu
Retorna a árvore completa no formato aninhado (`submenus`), reconstruída a
partir dos documentos "flat" armazenados no Mongo.

## Arquitetura

```
routes → validation → controller → service → model
```

O boilerplate original usa *fat controller* (controller falando direto com o
model). Optei por extrair a lógica de negócio para uma camada `services/`,
porque a montagem da árvore (`buildTree`) e a coleta de descendentes
(`collectDescendantIds`) são regras de domínio puras (sem depender de
`req`/`res`), e isolá-las facilita teste unitário e reuso futuro.

## Decisões de design

- **`relatedId` como `String` referenciando o `_id` do Mongo.** O enunciado
  descreve o campo como `Number`, mas o Mongo gera `ObjectId`s por padrão.
  Modelei como `String` (o `toString()` do `ObjectId`) por ser a forma
  correta de referenciar documentos no Mongo, mantendo o mesmo papel descrito
  no enunciado (apontar para o item pai).
- **Delete em cascata.** O enunciado não define o comportamento ao apagar um
  item que possui filhos. Optei por remover a subárvore inteira, evitando
  itens órfãos (com `relatedId` apontando para um documento inexistente).
- **Validação de `relatedId` existente na criação.** Ao criar um item com
  `relatedId`, a API verifica se o item pai realmente existe antes de
  persistir, evitando órfãos já na criação (não só na exclusão).
- **Índice em `relatedId`.** Como toda leitura da árvore depende de agrupar
  por esse campo, um índice ajuda a performance à medida que o menu cresce.
- **Error handler centralizado + async wrapper.** O Express 4 não captura
  automaticamente rejeições de promises dentro de handlers `async`; um
  wrapper (`middlewares/async-handler.ts`) encaminha esses erros para um
  middleware de erro único (`middlewares/error-handler.ts`), evitando que uma
  falha derrube o processo silenciosamente.
- **Testes unitários da camada de serviço.** `buildTree` e
  `collectDescendantIds` são funções puras, cobertas por testes que validam
  aninhamento infinito, isolamento entre irmãos e coleta correta de
  descendentes — sem precisar de banco de dados nem mocks de HTTP.
- **Docker só para o MongoDB, não para a API.** O `docker-compose.yml` sobe
  apenas o banco; a API roda localmente via `npm run start`, aproveitando
  hot-reload (nodemon) e debug direto no editor sem a fricção de volumes e
  rebuilds de container a cada mudança. Para um cenário de produção ou de
  onboarding sem Node instalado na máquina, o próximo passo seria um
  Dockerfile multi-stage para a API e adicioná-la ao compose.
