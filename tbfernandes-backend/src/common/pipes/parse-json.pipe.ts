import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Parses a value that arrives as JSON text, e.g. a JSON field of a multipart form or a JSON
 * query parameter (from the INFRA project). Objects already parsed pass through.
 */
@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('Corpo inválido: precisa ser um JSON.');
    }
  }
}
