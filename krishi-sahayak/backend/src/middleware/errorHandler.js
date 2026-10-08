import { ZodError } from 'zod';
import { failure } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';
export function notFound(req, res) { void req; return failure(res, 'The requested page or resource was not found', 404); }
export function errorHandler(error, req, res, next) {
  void next;
  if (error instanceof ZodError) return failure(res, 'Please check the submitted information', 422, error.flatten());
  if (error instanceof AppError) return failure(res, error.message, error.status);
  if (error.type === 'entity.parse.failed') return failure(res, 'Request body is not valid JSON', 400);
  if (error.status === 413) return failure(res, 'The request is too large', 413);
  if (env.production) console.error('Unhandled API request error:', error.name || 'Error');
  else console.error(error);
  return failure(res, 'Something went wrong. Please try again later.', 500);
}
