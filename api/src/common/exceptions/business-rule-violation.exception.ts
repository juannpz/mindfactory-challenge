import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 422 Unprocessable Entity — domain/business rule violation.
 * Use this instead of BadRequestException when the request is syntactically
 * correct but breaks a business rule (e.g. invalid CUIT, domain mismatch).
 */
export class BusinessRuleViolationException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
