import { PartialType } from '@nestjs/swagger';
import { CreateAutomotorDto } from './create-automotor.dto';

/**
 * DTO para actualizar un automotor.
 *
 * `PartialType` hace que TODOS los campos del DTO base sean opcionales.
 * Así un PUT puede enviar solo `atr_color` y solo eso se actualiza.
 */
export class UpdateAutomotorDto extends PartialType(CreateAutomotorDto) {}
