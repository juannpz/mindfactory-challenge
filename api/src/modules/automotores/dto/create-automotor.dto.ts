import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  Length,
  Matches,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

/** DTO para crear un automotor con su dueño. */
export class CreateAutomotorDto {
  @ApiProperty({
    description: 'Dominio (patente) del vehículo',
    example: 'ABC123',
    pattern: '^[A-Z]{3}\\d{3}$|^[A-Z]{2}\\d{3}[A-Z]{2}$',
  })
  @IsString()
  @Matches(/^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/, {
    message: 'Invalid domain format. Expected AAA999 or AA999AA',
  })
  atr_dominio!: string;

  @ApiPropertyOptional({
    description: 'Número de chasis',
    example: '1HGCM82633A123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  atr_numero_chasis?: string;

  @ApiPropertyOptional({
    description: 'Número de motor',
    example: 'K24A-1234567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  atr_numero_motor?: string;

  @ApiPropertyOptional({ description: 'Color del vehículo', example: 'Rojo' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  atr_color?: string;

  @ApiProperty({
    description: 'Fecha de fabricación en formato YYYYMM',
    example: 202103,
    minimum: 190001,
    maximum: 299912,
  })
  @IsInt()
  @Min(190001)
  @Max(299912)
  atr_fecha_fabricacion!: number;

  @ApiProperty({
    description: 'CUIT del dueño (11 dígitos)',
    example: '20123456783',
  })
  @IsString()
  @Length(11, 11)
  cuit_dueno!: string;
}
