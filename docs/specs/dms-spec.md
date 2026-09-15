# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para upload, consulta e download de documentos, com metadados associados a usuários e armazenamento exclusivamente no filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de documentos via `multipart/form-data`.
- Armazenamento local em `backend/storage` usando `multer` com `diskStorage`.
- Metadados mantidos em memória durante a execução.
- Listagem e download por identificador.
- Associação simples entre documento e usuário pelo cabeçalho `X-User-Id`.
- Interface React para upload, listagem e download.

### Fora do escopo

- Armazenamento externo, cloud storage ou serviços de terceiros.
- Banco de dados persistente.
- Autenticação completa, versionamento, exclusão ou edição de documentos.
- Busca avançada, categorização, pré-visualização ou conversão de arquivos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um documento no campo `file`. |
| RF-02 | O sistema gera um identificador único e registra nome original, tamanho, data e dono. |
| RF-03 | O sistema grava o arquivo no filesystem local e seus metadados em memória. |
| RF-04 | O usuário pode listar documentos, opcionalmente filtrados por `X-User-Id`. |
| RF-05 | O usuário pode baixar um documento pelo identificador. |
| RF-06 | Upload sem arquivo ou sem usuário deve ser rejeitado. |
| RF-07 | Documentos inexistentes retornam erro `404`; documentos de outro usuário retornam `403`. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos gravados exclusivamente com `multer.diskStorage` em diretório local. |
| RNF-02 | Metadados mantidos em memória e perdidos ao reiniciar o processo. |
| RNF-03 | Configuração por variáveis de ambiente, seguindo 12-Factor. |
| RNF-04 | Backend em Node.js, Express e CommonJS; frontend em React e Vite. |
| RNF-05 | Fluxo backend: `routes -> controllers -> services -> repositories`. |
| RNF-06 | O identificador público não expõe o caminho físico do arquivo. |

## 5. Modelo de dados

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador público único. |
| `originalName` | string | Nome original do arquivo. |
| `size` | number | Tamanho em bytes. |
| `uploadedAt` | string | Data/hora em ISO 8601. |
| `owner` | string | Identificador do usuário dono. |
| `storedName` | string | Nome físico interno do arquivo. |
| `storagePath` | string | Caminho físico interno, nunca exposto na API. |

## 6. Contratos de API

### `POST /upload`

Entrada: `multipart/form-data`, campo obrigatório `file` e cabeçalho `X-User-Id`.

Sucesso: `201 Created`, com JSON dos campos públicos do documento:

```json
{
  "id": "document-id",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-15T12:00:00.000Z",
  "owner": "user-123"
}
```

Erros: `400` para entrada inválida, `413` para arquivo acima de `MAX_FILE_SIZE` e `500` para falhas de persistência.

### `GET /documents`

Entrada: cabeçalho opcional `X-User-Id`. Retorna `200 OK` com um array de metadados públicos; sem documentos, retorna `[]`.

### `GET /documents/:id/download`

Entrada: parâmetro `id` e cabeçalho opcional `X-User-Id`. Retorna `200 OK` com o conteúdo binário e o nome original no download. Retorna `403` para outro dono e `404` quando o documento ou arquivo não existir.

### `GET /health`

Retorna `200 OK` e `{ "status": "ok" }`.

## 7. Decisões arquiteturais

- `routes/` registra endpoints e middleware.
- `controllers/` trata HTTP e validação de entrada/saída.
- `services/` concentra regras de negócio e ownership.
- `repositories/` controla filesystem e metadados em memória.
- O frontend organiza componentes em `components/` e chamadas HTTP em `services/`, usando `fetch` pelo prefixo `/api`.

## 8. Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local dos arquivos. |
| `MAX_FILE_SIZE` | `10485760` | Limite de upload em bytes. |

## 9. Plano de execução

1. Criar repositórios de metadados e arquivos locais.
2. Criar serviço de documentos com upload, listagem, ownership e download.
3. Criar controllers e rotas com `multer.diskStorage`.
4. Integrar o backend ao app e cobrir os endpoints com testes nativos do Node.
5. Criar serviço HTTP e componentes React para upload, listagem e download.
6. Integrar a tela principal e validar o proxy `/api`.
7. Executar testes do backend, build do frontend e validação ponta a ponta.

A implementação deve permanecer restrita ao armazenamento local e não deve adicionar provedores externos.
