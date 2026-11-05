import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/api-response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error('Unhandled Application Error:', err);

  // Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 'A record with this unique field already exists', 409);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found in database', 404);
      return;
    }
    sendError(res, `Database error: ${err.message}`, 500);
    return;
  }

  // Prisma Initialization / Connection Error
  if (err instanceof Prisma.PrismaClientInitializationError) {
    sendError(
      res,
      'Database connection failed. Please ensure PostgreSQL is running and reachable.',
      503
    );
    return;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid authorization token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Authorization token has expired', 401);
    return;
  }

  // Standard or custom errors
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  sendError(res, message, statusCode);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
}

