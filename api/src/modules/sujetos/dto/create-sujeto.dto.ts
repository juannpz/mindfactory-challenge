import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

/** DTO para crear un sujeto (persona/entidad). */
export class CreateSujetoDto {
  @ApiProperty({
    description: 'CUIT de 11 dígitos',
    example: '20123456783',
  })
  @IsString()
  @Length(11, 11, { message: 'CUIT must be exactly 11 digits' })
  @Matches(/^\d{11}$/, { message: 'CUIT must contain only digits' })
  spo_cuit!: string;

  @ApiProperty({
    description: 'Denominación (nombre o razón social)',
    example: 'Juan Pérez',
  })
  @IsString()
  @Length(1, 160)
  spo_denominacion!: string;
}
