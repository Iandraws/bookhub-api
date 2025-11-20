export const typeDefs = `
  type Book {
    id: ID!
    title: String!
    description: String
    authors: [Author!]!
    createdAt: String
    updatedAt: String
  }

  type Author {
    id: ID!
    name: String!
    books: [Book!]!
    createdAt: String
  }

  type BooksConnection {
    items: [Book!]!
    total: Int!
  }

  type AuthorsConnection {
    items: [Author!]!
    total: Int!
  }

  enum SortDirection {
    ASC
    DESC
  }

  input BookFilterInput {
    title: String
    authorId: ID
    authorName: String
    description: String
  }

  input BookSortInput {
    field: String!
    direction: SortDirection!
  }

  input AuthorFilterInput {
    name: String
  }

  input CreateBookInput {
    title: String!
    description: String
    authorIds: [ID!]!
  }

  input UpdateBookInput {
    title: String
    description: String
    authorIds: [ID!]
  }

  input CreateAuthorInput {
    name: String!
  }

  input UpdateAuthorInput {
    name: String!
  }

  type Query {
    health: String!
    getBook(id: ID!): Book
    listBooks(filter: BookFilterInput, sort: BookSortInput, limit: Int, offset: Int): BooksConnection!
    getAuthor(id: ID!): Author
    listAuthors(filter: AuthorFilterInput, limit: Int, offset: Int): AuthorsConnection!
    searchBooks(query: String!): [Book!]!
  }

  type Mutation {
    createBook(input: CreateBookInput!): Book!
    createBooks(inputs: [CreateBookInput!]!): [Book!]!
    updateBook(id: ID!, input: UpdateBookInput!): Book
    deleteBook(id: ID!): Boolean!
    createAuthor(input: CreateAuthorInput!): Author!
    updateAuthor(id: ID!, input: UpdateAuthorInput!): Author
    deleteAuthor(id: ID!): Boolean!
    deleteAllBooks: Boolean!
    deleteAllAuthors: Boolean!
  }
`;
