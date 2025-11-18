import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs } from '../graphql/typeDefs';
import * as bookService from '../services/bookService';
import * as authorService from '../services/authorService';
import { docClient } from '../db/dynamoClient';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

// Valid API keys
const VALID_API_KEYS = ['bookhub-demo-key-12345', 'bookhub-prod-key-67890'];

const validateApiKey = (headers: any): boolean => {
  const apiKey = headers['x-api-key'] || headers['X-Api-Key'];
  return VALID_API_KEYS.includes(apiKey);
};

const resolvers = {
  Query: {
    health: () => "OK",
    
    listBooks: async (_: any, args: { filter?: any; sort?: any; limit?: number; offset?: number }) => {
      return await bookService.listBooks(args.filter, args.sort, args.limit, args.offset);
    },
    
    getBook: async (_: any, args: { id: string }) => {
      return await bookService.getBook(args.id);
    },
    
    listAuthors: async (_: any, args: { filter?: any; limit?: number; offset?: number }) => {
      return await authorService.listAuthors(args.filter, args.limit, args.offset);
    },
    
    getAuthor: async (_: any, args: { id: string }) => {
      return await authorService.getAuthor(args.id);
    },
    
    searchBooks: async (_: any, args: { query: string }) => {
      return await bookService.searchBooks(args.query);
    },
  },
  
  Mutation: {
    createBook: async (_: any, args: { input: { title: string; description?: string; authorIds: string[] } }) => {
      return await bookService.createBook(args.input.title, args.input.description || "", args.input.authorIds);
    },
    
    createBooks: async (_: any, args: { inputs: Array<{ title: string; description?: string; authorIds: string[] }> }) => {
      const inputs = args.inputs.map(input => ({
        title: input.title,
        description: input.description || "",
        authorIds: input.authorIds,
      }));
      return await bookService.createBooks(inputs);
    },
    
    updateBook: async (_: any, args: { id: string; input: { title?: string; description?: string; authorIds?: string[] } }) => {
      return await bookService.updateBook(args.id, args.input);
    },
    
    deleteBook: async (_: any, args: { id: string }) => {
      return await bookService.deleteBook(args.id);
    },
    
    deleteAllBooks: async () => {
      return await bookService.deleteAllBooks();
    },
    
    createAuthor: async (_: any, args: { input: { name: string } }) => {
      return await authorService.createAuthor(args.input.name);
    },
    
    updateAuthor: async (_: any, args: { id: string; input: { name: string } }) => {
      return await authorService.updateAuthor(args.id, args.input);
    },
    
    deleteAuthor: async (_: any, args: { id: string }) => {
      return await authorService.deleteAuthor(args.id);
    },
  },
  
  Book: {
    authors: async (book: any) => {
      try {
        if (!book.authorIds || book.authorIds.length === 0) return [];
        const authors = await Promise.all(
          book.authorIds.map((id: string) => authorService.getAuthor(id))
        );
        return authors.filter((a: any) => a !== null);
      } catch (error) {
        console.error('Error fetching authors:', error);
        return [];
      }
    },
  },
  
  Author: {
    books: async (author: any) => {
      try {
        const BOOKS_TABLE = process.env.BOOKS_TABLE || 'bookhub-api-books-dev';
        const scanParams: any = { TableName: BOOKS_TABLE };
        const data = await docClient.send(new ScanCommand(scanParams));
        const allBooks = data.Items || [];
        return allBooks.filter((book: any) => 
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
const yoga = createYoga({ schema });

export const handler = async (event: any, context: any) => {
  try {
    const path = event.rawPath || event.path || '/graphql';
    const method = event.requestContext?.http?.method || event.httpMethod || 'POST';
    const headers = event.headers || {};
    
    // Validate API key
    if (!validateApiKey(headers)) {
      return {
        statusCode: 401,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          errors: [{ 
            message: 'Unauthorized: Missing or invalid API key. Please provide x-api-key header.',
            extensions: { code: 'UNAUTHORIZED' } 
          }],
        }),
      };
    }
    
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
