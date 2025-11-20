import { docClient } from "../db/dynamoClient";
import { v4 as uuid } from "uuid";
import { ScanCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { BUSINESS_ERRORS, DB_ERRORS } from '../utils/errors';
import { Logger } from '../utils/logger';
import { Book, BookFilter, BookSort, BooksConnection, BookInput, BookUpdateInput, ScanParams, Author } from '../types';

const BOOKS_TABLE = process.env.BOOKS_TABLE || "Books";

const getCurrentTimestamp = () => new Date().toISOString();

export const listBooks = async (filter?: BookFilter, sort?: BookSort, limit?: number, offset?: number): Promise<BooksConnection> => {
  try {
    const scanParams: ScanParams = { TableName: BOOKS_TABLE };
    
    const data = await docClient.send(new ScanCommand(scanParams));
    
    let items: Book[] = (data.Items as Book[]) || [];
    
    if (filter?.title) {
      items = items.filter((item: Book) => 
        item.title.toLowerCase().includes(filter.title!.toLowerCase())
      );
    }
    
    if (filter?.description) {
      items = items.filter((item: Book) => 
        item.description && item.description.toLowerCase().includes(filter.description!.toLowerCase())
      );
    }
    
    if (filter?.authorId) {
      items = items.filter((item: Book) => 
        item.authorIds && item.authorIds.includes(filter.authorId!)
      );
    }
    
    if (filter?.authorName) {
      const AUTHORS_TABLE = process.env.AUTHORS_TABLE || 'Authors';
      const authorData = await docClient.send(new ScanCommand({ TableName: AUTHORS_TABLE }));
      const authors: Author[] = (authorData.Items as Author[]) || [];
      
      const matchingAuthorIds = authors
        .filter(author => author.name.toLowerCase().includes(filter.authorName!.toLowerCase()))
        .map(author => author.id);
      
      items = items.filter((item: Book) => 
        item.authorIds && item.authorIds.some(authorId => matchingAuthorIds.includes(authorId))
      );
    }
    
    if (sort?.field && sort?.direction) {
      items.sort((a: Book, b: Book) => {
        const aVal = a[sort.field];
        const bVal = b[sort.field];
        
        if (sort.direction === 'ASC') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    const total = items.length;
    const pageLimit = limit ?? 10;
    const pageOffset = offset ?? 0;
    const start = Math.max(0, pageOffset);
    const end = start + pageLimit;
    
    return {
      items: items.slice(start, end),
      total
    };
  } catch (error) {
    Logger.error('Failed to list books', { operation: 'listBooks' }, error as Error);
    return {
      items: [],
      total: 0
    };
  }
};

export const getBook = async (id: string): Promise<Book | null> => {
  const data = await docClient.send(new GetCommand({ TableName: BOOKS_TABLE, Key: { id } }));
  return (data.Item as Book) || null;
};

export const createBook = async (title: string, description: string, authorIds: string[]): Promise<Book> => {
  if (!title || title.trim().length === 0) {
    throw BUSINESS_ERRORS.EMPTY_TITLE();
  }

  const existingBooks = await searchBooks(title);
  const titleExists = existingBooks.some((book: Book) => 
    book.title.toLowerCase() === title.toLowerCase()
  );
  
  if (titleExists) {
    throw BUSINESS_ERRORS.DUPLICATE_BOOK_TITLE(title);
  }

  const id = uuid();
  const now = getCurrentTimestamp();
  const item: Book = { id, title, description, authorIds, createdAt: now, updatedAt: now };
  
  try {
    await docClient.send(new PutCommand({ TableName: BOOKS_TABLE, Item: item }));
    return item;
  } catch (error) {
    Logger.error('Failed to create book', { operation: 'createBook', title }, error as Error);
    throw DB_ERRORS.OPERATION_FAILED('create');
  }
};

export const createBooks = async (books: BookInput[]): Promise<Book[]> => {
  const titles = books.map(book => book.title.toLowerCase());
  const duplicatesInBatch = titles.filter((title, index) => titles.indexOf(title) !== index);
  
  if (duplicatesInBatch.length > 0) {
    throw new Error(`Duplicate titles in batch: ${duplicatesInBatch.join(', ')}`);
  }
  
  for (const book of books) {
    const existingBooks = await searchBooks(book.title);
    const titleExists = existingBooks.some((existing: Book) => 
      existing.title.toLowerCase() === book.title.toLowerCase()
    );
    
    if (titleExists) {
      throw new Error(`A book with the title "${book.title}" already exists`);
    }
  }
  
  const createdBooks = await Promise.all(
    books.map(book => {
      const id = uuid();
      const now = getCurrentTimestamp();
      const item: Book = { 
        id, 
        title: book.title, 
        description: book.description || '', 
        authorIds: book.authorIds, 
        createdAt: now, 
        updatedAt: now 
      };
      return docClient.send(new PutCommand({ TableName: BOOKS_TABLE, Item: item })).then(() => item);
    })
  );
  return createdBooks;
};

export const updateBook = async (id: string, input: BookUpdateInput): Promise<Book | null> => {
  const existingBook = await getBook(id);
  if (!existingBook) return null;
  
  if (input.title && input.title.toLowerCase() !== existingBook.title.toLowerCase()) {
    const existingBooks = await searchBooks(input.title);
    const titleExists = existingBooks.some((book: Book) => 
      book.title.toLowerCase() === input.title!.toLowerCase() && book.id !== id
    );
    
    if (titleExists) {
      throw new Error(`A book with the title "${input.title}" already exists`);
    }
  }
  
  const now = getCurrentTimestamp();
  const updatedItem: Book = {
    ...existingBook,
    ...input,
    updatedAt: now
  };
  
  await docClient.send(new PutCommand({ TableName: BOOKS_TABLE, Item: updatedItem }));
  return updatedItem;
};

export const deleteBook = async (id: string): Promise<boolean> => {
  await docClient.send(new DeleteCommand({ TableName: BOOKS_TABLE, Key: { id } }));
  return true;
};

export const deleteAllBooks = async (): Promise<boolean> => {
  const data = await docClient.send(new ScanCommand({ TableName: BOOKS_TABLE }));
  const items: Book[] = (data.Items as Book[]) || [];
  
  await Promise.all(
    items.map((item: Book) => 
      docClient.send(new DeleteCommand({ TableName: BOOKS_TABLE, Key: { id: item.id } }))
    )
  );
  
  return true;
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  const data = await docClient.send(new ScanCommand({ TableName: BOOKS_TABLE }));
  const items: Book[] = (data.Items as Book[]) || [];
  
  const searchQuery = query.toLowerCase();
  return items.filter((item: Book) => 
    item.title.toLowerCase().includes(searchQuery) ||
    (item.description && item.description.toLowerCase().includes(searchQuery))
  );
};

export const getBooksByAuthorId = async (authorId: string): Promise<Book[]> => {
  try {
    const data = await docClient.send(new ScanCommand({ TableName: BOOKS_TABLE }));
    const items: Book[] = (data.Items as Book[]) || [];
    
    return items.filter((book: Book) => 
      book.authorIds && book.authorIds.includes(authorId)
    );
  } catch (error) {
    Logger.error('Failed to get books by author ID', { operation: 'getBooksByAuthorId', authorId }, error as Error);
    return [];
  }
};
