

import { AUTH_ERRORS } from './errors';

export const validateApiKey = (headers: Record<string, string> | Headers): void => {
  let apiKey: string | null;
  if (headers instanceof Headers) {
    apiKey = headers.get('x-api-key') || headers.get('X-Api-Key');
  } else {
    apiKey = headers['x-api-key'] || headers['X-Api-Key'] || null;
  }

  if (!apiKey) {
    throw AUTH_ERRORS.MISSING_API_KEY();
  }

  if (apiKey !== process.env.API_KEY) {
    throw AUTH_ERRORS.INVALID_API_KEY();
  }
};