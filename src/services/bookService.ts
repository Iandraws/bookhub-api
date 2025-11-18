import { docClient } from "../db/dynamoClient";
import { v4 as uuid } from "uuid";
import { ScanCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { Book, BookFilter, BookSort, BooksConnection, BookInput, BookUpdateInput, ScanParams } from '../types';

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
    
    if (filter?.authorId) {
      items = items.filter((item: Book) => 
        item.authorIds && item.authorIds.includes(filter.authorId!)
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
    console.error('Error listing books:', error);
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
  const id = uuid();
  const now = getCurrentTimestamp();
  const item: Book = { id, title, description, authorIds, createdAt: now, updatedAt: now };
  await docClient.send(new PutCommand({ TableName: BOOKS_TABLE, Item: item }));
  return item;
};

export const createBooks = async (books: BookInput[]): Promise<Book[]> => {
  const createdBooks = await Promise.all(
    books.map(book => createBook(book.title, book.description || '', book.authorIds))
  );
  return createdBooks;
};

export const updateBook = async (id: string, input: BookUpdateInput): Promise<Book | null> => {
  const existingBook = await getBook(id);
  if (!existingBook) return null;
  
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
