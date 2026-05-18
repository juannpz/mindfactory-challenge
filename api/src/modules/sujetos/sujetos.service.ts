import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sujeto } from './entities/sujeto.entity';
import { CreateSujetoDto } from './dto/create-sujeto.dto';
import { BusinessRuleViolationException } from '../../common/exceptions';
import { isValidCUIT } from '../../common/validators';

@Injectable()
export class SujetosService {
  private readonly logger = new Logger(SujetosService.name);

  constructor(
    @InjectRepository(Sujeto)
    private readonly sujetoRepo: Repository<Sujeto>,
  ) {}

  async create(dto: CreateSujetoDto): Promise<Sujeto> {
    if (!isValidCUIT(dto.spo_cuit)) {
      throw new BusinessRuleViolationException(
        'Invalid CUIT: fails modulo 11 verification',
      );
    }

    /*
     * Si el CUIT ya existe, PostgreSQL lanza error 23505 (unique_violation).
     * El TypeOrmExceptionFilter global lo convierte en 422 automáticamente:
     *   → "Duplicate value: spo_cuit "XXXXXXXXXXX" already exists"
     */
    const sujeto = this.sujetoRepo.create({
      spo_cuit: dto.spo_cuit,
      spo_denominacion: dto.spo_denominacion,
    });

    return this.sujetoRepo.save(sujeto);
  }

  async findByCuit(cuit: string): Promise<Sujeto> {
    const sujeto = await this.sujetoRepo.findOne({ where: { spo_cuit: cuit } });
    if (!sujeto) {
      throw new NotFoundException(`Subject with CUIT ${cuit} not found`);
    }
    return sujeto;
  }
}
