---
description: Referência de implementação para o DMS com arquitetura, validações e critérios de aceite.
name: dms-reference
argument-hint: tarefa, recurso ou endpoint a ser implementado
agent: agent
---

# Referência de desenvolvimento do DMS

Use este prompt como guia para implementar, revisar ou corrigir código no Document Management System.

## Objetivo

Crie ou ajuste recursos do backend e do frontend respeitando a arquitetura, os requisitos da especificação e as restrições do projeto.

## Stack e contexto

- Backend: Node.js + Express + CommonJS
- Frontend: React + Vite + ESM
- Testes: runner nativo do Node (`node:test`) com `node:assert`
- Armazenamento local: `backend/storage` usando `multer` com `diskStorage`
- Metadados em memória nesta fase
- Nenhum provedor externo de upload ou armazenamento

## Arquitetura obrigatória

Siga este fluxo de dependência:

`routes -> controllers -> services -> repositories`

- `backend/src/routes/`: registra endpoints e delega ao controller
- `backend/src/controllers/`: trata entrada/saída HTTP e validação básica
- `backend/src/services/`: implementa regras de negócio e autorização
- `backend/src/repositories/`: cuida de persistência em memória e filesystem local

## Regras de implementação

- Use nomes descritivos em inglês para símbolos do código
- Mensagens ao usuário e comentários devem estar em português
- Mantenha funções pequenas, com responsabilidade única
- Trate erros nos limites do sistema, especialmente HTTP e filesystem
- Não exponha caminhos físicos do arquivo na API
- Mantenha o comportamento em conformidade com a especificação em `docs/specs/dms-spec.md`
- Preserve o armazenamento local e evite dependências externas
- Use variáveis de ambiente para configuração, seguindo os princípios 12-Factor

## Contratos esperados

- `POST /upload`: exige `multipart/form-data`, campo `file` e cabeçalho `X-User-Id`
- `GET /documents`: lista documentos, com filtro opcional por usuário
- `GET /documents/:id/download`: baixa o arquivo e valida propriedade do usuário
- `GET /health`: responde `200` com `{ "status": "ok" }`

## Validações e critérios de aceite

- Upload sem arquivo ou sem usuário deve falhar com `400`
- Documento inexistente deve falhar com `404`
- Documento de outro usuário deve falhar com `403`
- Arquivo acima do limite deve falhar com `413`
- O retorno público nunca deve expor `storedName` ou `storagePath`
- Novo código deve ter testes automatizados na pasta `backend/test`
- Cada funcionalidade implementada deve cobrir ao menos dois cenários: sucesso e falha

## Testes obrigatórios

- Use `node:test` e `node:assert`
- Escreva testes em `backend/test`
- Cubra casos principais de sucesso e erro
- Use filesystem temporário e limpe artefatos após execução
- Não dependa de serviços externos ou bancos de dados

## Saída esperada

Ao finalizar o trabalho, entregue:

1. Código funcional alinhado à arquitetura do projeto
2. Testes automatizados para os cenários principais
3. Validação via `cd backend && npm test`
4. Feedback claro sobre qualquer limitação ou risco identificado
