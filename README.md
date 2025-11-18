# BookHub API

GraphQL API for managing books and authors. Built with TypeScript and deployed on AWS Lambda with DynamoDB.

## Live Endpoint

```
https://ntajwaq5ga.execute-api.eu-central-1.amazonaws.com/graphql
```

## Overview

BookHub provides a GraphQL interface for books and authors management with filtering, sorting, pagination, and search capabilities.

## Technology Stack

- TypeScript 5.9.3
- GraphQL Yoga 5.0.0
- Node.js 20 on AWS Lambda
- AWS DynamoDB
- AWS SDK

## Features

- GraphQL queries and mutations
- Pagination with limit and offset
- Filtering and sorting
- Full-text search
- Batch operations
- CRUD operations
- Auto-generated timestamps

## Setup

### Installation

```bash
npm install
```

### Local Development

```bash
npm start
```

## Queries

### List Books

```graphql
{
  listBooks(limit: 10, offset: 0) {
    items {
      id
      title
      description
      author {
        id
        name
      }
    }
    total
  }
}
```

### Get Single Book

```graphql
{
  getBook(id: "book-id") {
    id
    title
    description
    author {
      id
      name
    }
  }
}
```

### Search Books

```graphql
{
  searchBooks(query: "great") {
    id
    title
    description
  }
}
```

### Filter Books

```graphql
{
  listBooks(filter: { title: "great" }) {
    items {
      id
      title
    }
    total
  }
}
```

### Sort Books

```graphql
{
  listBooks(sort: { field: "title", direction: ASC }) {
    items {
      id
      title
    }
    total
  }
}
```

### List Authors

```graphql
{
  listAuthors(limit: 10, offset: 0) {
    items {
      id
      name
    }
    total
  }
}
```

### Get Author

```graphql
{
  getAuthor(id: "author-id") {
    id
    name
  }
}
```

### Health Check

```graphql
{
  health
}
```

## Mutations

### Create Book

```graphql
mutation {
  createBook(input: {
    title: "The Hobbit"
    description: "An adventure novel"
    authorId: "author-1"
  }) {
    id
    title
    createdAt
  }
}
```

### Create Multiple Books

```graphql
mutation {
  createBooks(inputs: [
    { title: "Book 1", description: "Desc 1", authorId: "author-1" }
    { title: "Book 2", description: "Desc 2", authorId: "author-2" }
  ]) {
    id
    title
    createdAt
  }
}
```

### Update Book

```graphql
mutation {
  updateBook(id: "book-id", input: {
    title: "Updated Title"
    description: "Updated description"
  }) {
    id
    title
    updatedAt
  }
}
```

### Delete Book

```graphql
mutation {
  deleteBook(id: "book-id")
}
```

### Delete All Books

```graphql
mutation {
  deleteAllBooks
}
```

### Create Author

```graphql
mutation {
  createAuthor(input: {
    name: "Stephen King"
  }) {
    id
    name
    createdAt
  }
}
```

### Update Author

```graphql
mutation {
  updateAuthor(id: "author-id", input: {
    name: "Updated Name"
  }) {
    id
    name
  }
}
```

### Delete Author

```graphql
mutation {
  deleteAuthor(id: "author-id")
}
```

## Testing

### cURL

```bash
curl -X POST https://ntajwaq5ga.execute-api.eu-central-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
```

### PowerShell

```powershell
$endpoint = "https://ntajwaq5ga.execute-api.eu-central-1.amazonaws.com/graphql"
$query = '{ listBooks(limit: 10) { items { id title } total } }'
$body = @{"query" = $query} | ConvertTo-Json
Invoke-RestMethod -Uri $endpoint -Method Post -Headers @{"Content-Type"="application/json"} -Body $body
```

### Postman

Import the included Postman collection:
- File: `BookHub-API.postman_collection.json`
- Contains 25+ pre-configured requests

## Project Structure

```
src/
├── handlers/
│   └── graphqlHandler.ts       # Lambda handler
├── graphql/
│   └── typeDefs.ts             # GraphQL schema
├── services/
│   ├── bookService.ts          # Book operations
│   └── authorService.ts        # Author operations
└── db/
    └── dynamoClient.ts         # DynamoDB client
```

## Database

### Tables

- `bookhub-api-books-dev` - Books table
- `bookhub-api-authors-dev` - Authors table

### Configuration

- Billing: PAY_PER_REQUEST
- Partition Key: id (UUID)

## Deployment

### Prerequisites

- AWS Account
- Node.js 20
- Serverless Framework

### Deploy

```bash
npm install
npx serverless deploy --stage dev
```

### View Logs

```bash
npx serverless logs -f graphql --stage dev
```

## Types

### Book

```graphql
type Book {
  id: ID!
  title: String!
  description: String
  author: Author!
  createdAt: String
  updatedAt: String
}
```

### Author

```graphql
type Author {
  id: ID!
  name: String!
  createdAt: String
}
```

### Pagination

```graphql
type BooksConnection {
  items: [Book!]!
  total: Int!
}

type AuthorsConnection {
  items: [Author!]!
  total: Int!
}
```

## Filtering

### Books Filter

```graphql
filter: {
  title: "string"
  authorId: "ID"
}
```

### Authors Filter

```graphql
filter: {
  name: "string"
}
```

## Sorting

```graphql
sort: {
  field: "title"
  direction: "ASC"
}
```

## Performance

- Health check: ~50ms
- List books: ~100-150ms
- Search: ~150-200ms
- Create: ~80-120ms
- Batch create: ~150-200ms

## Error Handling

All errors return in standard GraphQL format:

```json
{
  "errors": [
    {
      "message": "Error description",
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR"
      }
    }
  ]
}
```

## Environment Variables

```
BOOKS_TABLE=bookhub-api-books-dev
AUTHORS_TABLE=bookhub-api-authors-dev
```

## Build

```bash
npx tsc --noEmit
```

## Notes

- IDs are auto-generated UUIDs
- Timestamps use ISO 8601 format
- All operations are asynchronous
- Database connections managed automatically

## License

MIT
