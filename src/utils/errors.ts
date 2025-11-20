import { GraphQLError } from 'graphql';

export class APIError extends GraphQLError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, {
      extensions: {
        code,
        http: { status: statusCode }
      }
    });
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string) {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 'BAD_USER_INPUT', 400);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class InternalError extends APIError {
  constructor(message: string) {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
  }
}

// Specific API Key Errors
export const AUTH_ERRORS = {
  MISSING_API_KEY: () => new AuthenticationError('Missing API key. Please provide x-api-key header.'),
  INVALID_API_KEY: () => new AuthenticationError('Invalid API key provided.'),
  UNAUTHORIZED: () => new AuthenticationError('Unauthorized access.')
};

// Book/Author specific errors
export const BUSINESS_ERRORS = {
  BOOK_NOT_FOUND: (id: string) => new NotFoundError(`Book with ID "${id}" not found.`),
  AUTHOR_NOT_FOUND: (id: string) => new NotFoundError(`Author with ID "${id}" not found.`),
  DUPLICATE_BOOK_TITLE: (title: string) => new ConflictError(`A book with title "${title}" already exists.`),
  INVALID_AUTHOR_ID: (id: string) => new ValidationError(`Invalid author ID: "${id}".`),
  EMPTY_TITLE: () => new ValidationError('Book title cannot be empty.'),
  EMPTY_AUTHOR_NAME: () => new ValidationError('Author name cannot be empty.')
};

// Database errors
export const DB_ERRORS = {
  CONNECTION_FAILED: () => new InternalError('Database connection failed.'),
  OPERATION_FAILED: (operation: string) => new InternalError(`Database ${operation} operation failed.`),
  TABLE_NOT_FOUND: (table: string) => new InternalError(`Table "${table}" not found.`)
};