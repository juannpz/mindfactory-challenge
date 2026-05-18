import { ApiProperty } from '@nestjs/swagger';

/** Respuesta de un sujeto. */
export class SujetoResponseDto {
  @ApiProperty({ example: 1 })
  spo_id!: number;

  @ApiProperty({ example: '20123456783' })
  spo_cuit!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  spo_denominacion!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at!: Date;
}
