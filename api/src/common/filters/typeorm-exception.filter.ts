import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

/**
 * Catches TypeORM QueryFailedError and maps PostgreSQL constraint violations
 * to appropriate HTTP responses with descriptive messages.
 *
 * PostgreSQL error codes mapped:
 *   23505 → unique_violation     → 422 Unprocessable Entity
 *   23503 → foreign_key_violation → 422 Unprocessable Entity
 *   others → 500 Internal Server Error
 *
 * Without this filter, these would bubble up as 500.
 */
@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const driverError = exception.driverError as {
      code?: string;
      detail?: string;
      table?: string;
    };

    switch (driverError?.code) {
      case '23505': {
        // Unique violation — extract field + value from detail
        const detail = driverError.detail ?? '';
        const match = detail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
        const field = match?.[1] ?? 'field';
        const value = match?.[2] ?? 'value';
        response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: `Duplicate value: ${field} "${value}" already exists`,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
        break;
      }

      case '23503': {
        // Foreign key violation
        const detail = driverError.detail ?? '';
        response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: `Referenced resource not found: ${detail}`,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
        break;
      }

      default:
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
          path: request.url,
        });
    }
  }
}
