import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs } from '../graphql/typeDefs';
import * as bookService from '../services/bookService';
import * as authorService from '../services/authorService';
import { docClient } from '../db/dynamoClient';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { validateApiKey } from '../utils/auth';
import {
  Book, Author, GraphQLContext, LambdaEvent, LambdaContext, ScanParams,
  ListBooksArgs, GetBookArgs, ListAuthorsArgs, GetAuthorArgs, SearchBooksArgs,
  CreateBookArgs, CreateBooksArgs, UpdateBookArgs, DeleteBookArgs,
  CreateAuthorArgs, UpdateAuthorArgs, DeleteAuthorArgs
} from '../types';

const resolvers = {
  Query: {
    health: () => "OK",
    
    listBooks: async (_: unknown, args: ListBooksArgs) => {
      return await bookService.listBooks(args.filter, args.sort, args.limit, args.offset);
    },
    
    getBook: async (_: unknown, args: GetBookArgs) => {
      return await bookService.getBook(args.id);
    },
    
    listAuthors: async (_: unknown, args: ListAuthorsArgs) => {
      return await authorService.listAuthors(args.filter, args.limit, args.offset);
    },
    
    getAuthor: async (_: unknown, args: GetAuthorArgs) => {
      return await authorService.getAuthor(args.id);
    },
    
    searchBooks: async (_: unknown, args: SearchBooksArgs) => {
      return await bookService.searchBooks(args.query);
    },
  },
  
  Mutation: {
    createBook: async (_: unknown, args: CreateBookArgs) => {
      return await bookService.createBook(args.input.title, args.input.description || "", args.input.authorIds);
    },
    
    createBooks: async (_: unknown, args: CreateBooksArgs) => {
      return await bookService.createBooks(args.inputs);
    },
    
    updateBook: async (_: unknown, args: UpdateBookArgs) => {
      return await bookService.updateBook(args.id, args.input);
    },
    
    deleteBook: async (_: unknown, args: DeleteBookArgs) => {
      return await bookService.deleteBook(args.id);
    },
    
    deleteAllBooks: async () => {
      return await bookService.deleteAllBooks();
    },
    
    createAuthor: async (_: unknown, args: CreateAuthorArgs) => {
      return await authorService.createAuthor(args.input.name);
    },
    
    updateAuthor: async (_: unknown, args: UpdateAuthorArgs) => {
      return await authorService.updateAuthor(args.id, args.input);
    },
    
    deleteAuthor: async (_: unknown, args: DeleteAuthorArgs) => {
      return await authorService.deleteAuthor(args.id);
    },
  },
  
  Book: {
    authors: async (book: Book) => {
      try {
        if (!book.authorIds || book.authorIds.length === 0) return [];
        const authors = await Promise.all(
          book.authorIds.map((id: string) => authorService.getAuthor(id))
        );
        return authors.filter((a: Author | null) => a !== null);
      } catch (error) {
        console.error('Error fetching authors:', error);
        return [];
      }
    },
  },
  
  Author: {
    books: async (author: Author) => {
      try {
        const BOOKS_TABLE = process.env.BOOKS_TABLE || 'bookhub-api-books-dev';
        const scanParams: ScanParams = { TableName: BOOKS_TABLE };
        const data = await docClient.send(new ScanCommand(scanParams));
        const allBooks: Book[] = (data.Items as Book[]) || [];
        return allBooks.filter((book: Book) => 
          book.authorIds && book.authorIds.includes(author.id)
        );
      } catch (error) {
        console.error('Error fetching books:', error);
        return [];
      }
    },
  },
};

const schema = createSchema({ typeDefs, resolvers });
const yoga = createYoga({ 
  schema,
  context: async ({ request }) => {
    // Validate API key using utility function
    validateApiKey(request.headers);
    
    return {};
  }
});

export const handler = async (event: LambdaEvent, context: LambdaContext) => {
  try {
    const path = event.rawPath || event.path || '/graphql';
    const method = event.requestContext?.http?.method || event.httpMethod || 'POST';
    const headers = event.headers || {};
    
    let body: string | undefined = undefined;
    if (event.body) {
      body = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    }

    const request = new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body,
    });

    const response = await yoga.fetch(request);
    const responseBody = await response.text();
    
    return {
      statusCode: response.status,
      headers: {
        'content-type': 'application/json',
        ...Object.fromEntries(response.headers),
      },
      body: responseBody,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        errors: [{ 
          message: 'Internal server error: ' + errorMessage,
          extensions: { code: 'INTERNAL_SERVER_ERROR' } 
        }],
      }),
    };
  }
};
