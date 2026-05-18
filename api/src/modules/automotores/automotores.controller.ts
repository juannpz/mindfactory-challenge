import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AutomotoresService } from './automotores.service';
import { CreateAutomotorDto } from './dto/create-automotor.dto';
import { UpdateAutomotorDto } from './dto/update-automotor.dto';
import { AutomotorResponseDto } from './dto/automotor-response.dto';

/** Endpoints REST para /api/automotores. */
@ApiTags('Automotores')
@Controller('/api/automotores')
export class AutomotoresController {
  constructor(private readonly automotoresService: AutomotoresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los automotores con su dueño actual' })
  findAll(): Promise<AutomotorResponseDto[]> {
    return this.automotoresService.findAll();
  }

  @Get(':dominio')
  @ApiOperation({
    summary: 'Obtener detalle de un automotor con su dueño actual',
  })
  @ApiParam({ name: 'dominio', example: 'ABC123' })
  findByDominio(
    @Param('dominio') dominio: string,
  ): Promise<AutomotorResponseDto> {
    return this.automotoresService.findByDominio(dominio);
  }

  @Post()
  @ApiOperation({
    summary: 'Alta de automotor + asignación de dueño por CUIT',
    description:
      'Valida dominio, CUIT y fecha. Cierra vínculo activo previo si existe. ' +
      'Crea Objeto_De_Valor si no existe.',
  })
  @ApiCreatedResponse({ type: AutomotorResponseDto })
  create(@Body() dto: CreateAutomotorDto): Promise<AutomotorResponseDto> {
    return this.automotoresService.create(dto);
  }

  @Put(':dominio')
  @ApiOperation({
    summary: 'Actualizar datos del automotor y/o reasignar dueño',
    description:
      'Si cambia el CUIT, cierra el vínculo anterior y crea uno nuevo.',
  })
  @ApiParam({ name: 'dominio', example: 'ABC123' })
  update(
    @Param('dominio') dominio: string,
    @Body() dto: UpdateAutomotorDto,
  ): Promise<AutomotorResponseDto> {
    return this.automotoresService.update(dominio, dto);
  }

  @Delete(':dominio')
  @ApiOperation({
    summary: 'Eliminar automotor y su Objeto_De_Valor en cascada',
  })
  @ApiParam({ name: 'dominio', example: 'ABC123' })
  remove(@Param('dominio') dominio: string): Promise<void> {
    return this.automotoresService.remove(dominio);
  }
}
