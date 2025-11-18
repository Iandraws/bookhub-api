// Book types
export interface Book {
  id: string;
  title: string;
  description: string;
  authorIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface BookInput {
  title: string;
  description?: string;
  authorIds: string[];
}

export interface BookUpdateInput {
  title?: string;
  description?: string;
  authorIds?: string[];
}

export interface BookFilter {
  title?: string;
  authorId?: string;
}

export interface BookSort {
  field: 'title' | 'createdAt';
  direction: 'ASC' | 'DESC';
}

export interface BooksConnection {
  items: Book[];
  total: number;
}

// Author types
export interface Author {
  id: string;
  name: string;
  createdAt: string;
}

export interface AuthorInput {
  name: string;
}

export interface AuthorUpdateInput {
  name: string;
}

export interface AuthorFilter {
  name?: string;
}

export interface AuthorsConnection {
  items: Author[];
  total: number;
}

// GraphQL Context and Arguments
export interface GraphQLContext {
  // Add context properties if needed
}

export interface ListBooksArgs {
  filter?: BookFilter;
  sort?: BookSort;
  limit?: number;
  offset?: number;
}

export interface GetBookArgs {
  id: string;
}

export interface ListAuthorsArgs {
  filter?: AuthorFilter;
  limit?: number;
  offset?: number;
}

export interface GetAuthorArgs {
  id: string;
}

export interface SearchBooksArgs {
  query: string;
}

export interface CreateBookArgs {
  input: BookInput;
}

export interface CreateBooksArgs {
  inputs: BookInput[];
}

export interface UpdateBookArgs {
  id: string;
  input: BookUpdateInput;
}

export interface DeleteBookArgs {
  id: string;
}

export interface CreateAuthorArgs {
  input: AuthorInput;
}

export interface UpdateAuthorArgs {
  id: string;
  input: AuthorUpdateInput;
}

export interface DeleteAuthorArgs {
  id: string;
}

// HTTP Event types for Lambda
export interface LambdaEvent {
  rawPath?: string;
  path?: string;
  requestContext?: {
    http?: {
      method: string;
    };
  };
  httpMethod?: string;
  headers: Record<string, string>;
  body?: string;
}

export interface LambdaContext {
  // Add Lambda context properties if needed
}

// DynamoDB scan parameters
export interface ScanParams {
  TableName: string;
}