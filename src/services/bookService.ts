import { docClient } from "../db/dynamoClient";
import { v4 as uuid } from "uuid";
import { ScanCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const BOOKS_TABLE = process.env.BOOKS_TABLE || "Books";

const getCurrentTimestamp = () => new Date().toISOString();

export const listBooks = async (filter?: any, sort?: any, limit?: number, offset?: number) => {
  try {
    const scanParams: any = { TableName: BOOKS_TABLE };
    
    const data = await docClient.send(new ScanCommand(scanParams));
    
    let items = data.Items || [];
    
    if (filter?.title) {
      items = items.filter((item: any) => 
        item.title.toLowerCase().includes(filter.title.toLowerCase())
      );
    }
    
    if (filter?.authorId) {
      items = items.filter((item: any) => 
        item.authorIds && item.authorIds.includes(filter.authorId)
      );
    }
    
    if (sort?.field && sort?.direction) {
      items.sort((a: any, b: any) => {
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

export const getBook = async (id: string) => {
  const data = await docClient.send(new GetCommand({ TableName: BOOKS_TABLE, Key: { id } }));
  return data.Item;
};

export const createBook = async (title: string, description: string, authorIds: string[]) => {
  const id = uuid();
  const now = getCurrentTimestamp();
  const item = { id, title, description, authorIds, createdAt: now, updatedAt: now };
  await docClient.send(new PutCommand({ TableName: BOOKS_TABLE, Item: item }));
  return item;
};

export const createBooks = async (books: Array<{ title: string; description: string; authorIds: string[] }>) => {
  const createdBooks = await Promise.all(
    books.map(book => createBook(book.title, book.description, book.authorIds))
  );
  return createdBooks;
};

export const updateBook = async (id: string, input: { title?: string; description?: string; authorIds?: string[] }) => {
  const existingBook = await getBook(id);
  if (!existingBook) return null;
  
  const now = getCurrentTimestamp();
  const updatedItem = {
    ...existingBook,
    ...input,
    updatedAt: now
  };
  
  await docClient.send(new PutCommand({ TableName: BOOKS_TABLE, Item: updatedItem }));
  return updatedItem;
};

export const deleteBook = async (id: string) => {
  await docClient.send(new DeleteCommand({ TableName: BOOKS_TABLE, Key: { id } }));
  return true;
};

export const deleteAllBooks = async () => {
  const data = await docClient.send(new ScanCommand({ TableName: BOOKS_TABLE }));
  const items = data.Items || [];
  
  await Promise.all(
    items.map((item: any) => 
      docClient.send(new DeleteCommand({ TableName: BOOKS_TABLE, Key: { id: item.id } }))
    )
  );
  
  return true;
};

export const searchBooks = async (query: string) => {
  const data = await docClient.send(new ScanCommand({ TableName: BOOKS_TABLE }));
  const items = data.Items || [];
  
  const searchQuery = query.toLowerCase();
  return items.filter((item: any) => 
    item.title.toLowerCase().includes(searchQuery) ||
    (item.description && item.description.toLowerCase().includes(searchQuery))
  );
};
