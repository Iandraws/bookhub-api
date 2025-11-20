import { docClient } from "../db/dynamoClient";
import { v4 as uuid } from "uuid";
import { ScanCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from '../utils/logger';
import { Author, AuthorFilter, AuthorsConnection, AuthorUpdateInput } from '../types';

const AUTHORS_TABLE = process.env.AUTHORS_TABLE || "Authors";

const getCurrentTimestamp = () => new Date().toISOString();

export const listAuthors = async (filter?: AuthorFilter, limit?: number, offset?: number): Promise<AuthorsConnection> => {
  try {
    const data = await docClient.send(new ScanCommand({ TableName: AUTHORS_TABLE }));
    
    let items: Author[] = (data.Items as Author[]) || [];
    
    if (filter?.name) {
      items = items.filter((item: Author) =>
        item.name.toLowerCase().includes(filter.name!.toLowerCase())
      );
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
    Logger.error('Failed to list authors', { operation: 'listAuthors' }, error as Error);
    return {
      items: [],
      total: 0
    };
  }
};

export const getAuthor = async (id: string): Promise<Author | null> => {
  try {
    const data = await docClient.send(new GetCommand({ TableName: AUTHORS_TABLE, Key: { id } }));
    return (data.Item as Author) || null;
  } catch (error) {
    Logger.error('Failed to get author', { operation: 'getAuthor', authorId: id }, error as Error);
    return null;
  }
};

export const createAuthor = async (name: string): Promise<Author> => {
  const id = uuid();
  const now = getCurrentTimestamp();
  const item: Author = { id, name, createdAt: now };
  await docClient.send(new PutCommand({ TableName: AUTHORS_TABLE, Item: item }));
  return item;
};

export const updateAuthor = async (id: string, input: AuthorUpdateInput): Promise<Author | null> => {
  const existingAuthor = await getAuthor(id);
  if (!existingAuthor) return null;
  
  const updatedItem: Author = {
    ...existingAuthor,
    ...input
  };
  
  await docClient.send(new PutCommand({ TableName: AUTHORS_TABLE, Item: updatedItem }));
  return updatedItem;
};

export const deleteAuthor = async (id: string): Promise<boolean> => {
  await docClient.send(new DeleteCommand({ TableName: AUTHORS_TABLE, Key: { id } }));
  return true;
};
