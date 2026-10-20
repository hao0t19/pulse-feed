import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'validation_failed', details: err.flatten() });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
}
