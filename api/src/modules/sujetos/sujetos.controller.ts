import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { SujetosService } from './sujetos.service';
import { CreateSujetoDto } from './dto/create-sujeto.dto';
import { SujetoResponseDto } from './dto/sujeto-response.dto';

/** Endpoints REST para /api/sujetos. */
@ApiTags('Sujetos')
@Controller('/api/sujetos')
export class SujetosController {
  constructor(private readonly sujetosService: SujetosService) {}

  /** Crea un sujeto. Retorna 422 si el CUIT no pasa módulo 11. */
  @Post()
  @ApiOperation({ summary: 'Crear un sujeto' })
  @ApiCreatedResponse({ type: SujetoResponseDto })
  create(@Body() dto: CreateSujetoDto): Promise<SujetoResponseDto> {
    return this.sujetosService.create(dto);
  }

  /** Busca un sujeto por CUIT exacto. Retorna 404 si no existe. */
  @Get('by-cuit')
  @ApiOperation({ summary: 'Buscar sujeto por CUIT' })
  @ApiQuery({ name: 'cuit', required: true, example: '20123456783' })
  findByCuit(@Query('cuit') cuit: string): Promise<SujetoResponseDto> {
    return this.sujetosService.findByCuit(cuit);
  }
}
