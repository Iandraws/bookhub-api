import { docClient } from "../db/dynamoClient";
import { v4 as uuid } from "uuid";
import { ScanCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const AUTHORS_TABLE = process.env.AUTHORS_TABLE || "Authors";

const getCurrentTimestamp = () => new Date().toISOString();

export const listAuthors = async (filter?: any, limit?: number, offset?: number) => {
  const data = await docClient.send(new ScanCommand({ TableName: AUTHORS_TABLE }));
  
  let items = data.Items || [];
  
  if (filter?.name) {
    items = items.filter((item: any) =>
      item.name.toLowerCase().includes(filter.name.toLowerCase())
    );
  }
  
  const total = items.length;
  const start = offset || 0;
  const end = start + (limit || 10);
  
  return {
    items: items.slice(start, end),
    total
  };
};

export const getAuthor = async (id: string) => {
  try {
    const data = await docClient.send(new GetCommand({ TableName: AUTHORS_TABLE, Key: { id } }));
    return data.Item || null;
  } catch (error) {
    console.error('Error getting author:', error);
    return null;
  }
};

export const createAuthor = async (name: string) => {
  const id = uuid();
  const now = getCurrentTimestamp();
  const item = { id, name, createdAt: now };
  await docClient.send(new PutCommand({ TableName: AUTHORS_TABLE, Item: item }));
  return item;
};

export const updateAuthor = async (id: string, input: { name: string }) => {
  const existingAuthor = await getAuthor(id);
  if (!existingAuthor) return null;
  
  const updatedItem = {
    ...existingAuthor,
    ...input
  };
  
  await docClient.send(new PutCommand({ TableName: AUTHORS_TABLE, Item: updatedItem }));
  return updatedItem;
};

export const deleteAuthor = async (id: string) => {
  await docClient.send(new DeleteCommand({ TableName: AUTHORS_TABLE, Key: { id } }));
  return true;
};
