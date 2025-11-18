import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs } from '../graphql/typeDefs';
import * as bookService from '../services/bookService';
import * as authorService from '../services/authorService';

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
    createBook: async (_: any, args: { input: { title: string; description?: string; authorId: string } }) => {
      return await bookService.createBook(args.input.title, args.input.description || "", args.input.authorId);
    },
    
    createBooks: async (_: any, args: { inputs: Array<{ title: string; description?: string; authorId: string }> }) => {
      const inputs = args.inputs.map(input => ({
        title: input.title,
        description: input.description || "",
        authorId: input.authorId,
      }));
      return await bookService.createBooks(inputs);
    },
    
    updateBook: async (_: any, args: { id: string; input: { title?: string; description?: string; authorId?: string } }) => {
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
    author: async (book: any) => {
      if (!book.authorId) return null;
      return await authorService.getAuthor(book.authorId);
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
