import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Respuesta de un automotor con los datos de su dueño actual.
 */
export class AutomotorResponseDto {
  @ApiProperty({ example: 1 })
  atr_id!: number;

  @ApiProperty({ example: 'ABC123' })
  atr_dominio!: string;

  @ApiPropertyOptional({ example: '1HGCM82633A123456' })
  atr_numero_chasis?: string;

  @ApiPropertyOptional({ example: 'K24A-1234567' })
  atr_numero_motor?: string;

  @ApiPropertyOptional({ example: 'Rojo' })
  atr_color?: string;

  @ApiProperty({ example: 202103 })
  atr_fecha_fabricacion!: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  atr_fecha_alta_registro!: Date;

  @ApiPropertyOptional({
    example: '20123456783',
    description: 'CUIT del dueño actual',
  })
  dueno_cuit?: string;

  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Denominación del dueño actual',
  })
  dueno_denominacion?: string;
}
