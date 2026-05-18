import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Automotor } from './entities/automotor.entity';
import { ObjetoDeValor } from '../objetos-de-valor/entities/objeto-de-valor.entity';
import { VinculoSujetoObjeto } from '../vinculos/entities/vinculo-sujeto-objeto.entity';
import { Sujeto } from '../sujetos/entities/sujeto.entity';
import { CreateAutomotorDto } from './dto/create-automotor.dto';
import { UpdateAutomotorDto } from './dto/update-automotor.dto';
import { AutomotorResponseDto } from './dto/automotor-response.dto';
import { BusinessRuleViolationException } from '../../common/exceptions';
import {
  isValidDominio,
  isValidCUIT,
  isValidFechaFabricacion,
} from '../../common/validators';

@Injectable()
export class AutomotoresService {
  private readonly logger = new Logger(AutomotoresService.name);

  constructor(
    @InjectRepository(Automotor)
    private readonly automotorRepo: Repository<Automotor>,
    @InjectRepository(ObjetoDeValor)
    private readonly ovpRepo: Repository<ObjetoDeValor>,
    @InjectRepository(VinculoSujetoObjeto)
    private readonly vinculoRepo: Repository<VinculoSujetoObjeto>,
    @InjectRepository(Sujeto)
    private readonly sujetoRepo: Repository<Sujeto>,
    private readonly dataSource: DataSource,
  ) {}

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Finds the active owner (sujeto) of a vehicle.
   * Uses IsNull() so TypeORM emits `vso_fecha_fin IS NULL` in the WHERE clause,
   * guaranteeing only the currently active vínculo is returned.
   */
  private async findActiveOwner(ovpId: number): Promise<Sujeto | null> {
    const vinculo = await this.vinculoRepo.findOne({
      where: {
        vso_ovp_id: ovpId,
        vso_responsable: 'S',
        vso_tipo_vinculo: 'DUENO',
        vso_fecha_fin: IsNull(),
      },
      relations: ['sujeto'],
    });
    return vinculo ? vinculo.sujeto : null;
  }

  private toResponse(
    automotor: Automotor,
    dueno: Sujeto | null,
  ): AutomotorResponseDto {
    return {
      atr_id: automotor.atr_id,
      atr_dominio: automotor.atr_dominio,
      atr_numero_chasis: automotor.atr_numero_chasis ?? undefined,
      atr_numero_motor: automotor.atr_numero_motor ?? undefined,
      atr_color: automotor.atr_color ?? undefined,
      atr_fecha_fabricacion: automotor.atr_fecha_fabricacion,
      atr_fecha_alta_registro: automotor.atr_fecha_alta_registro,
      dueno_cuit: dueno?.spo_cuit,
      dueno_denominacion: dueno?.spo_denominacion,
    };
  }

  // -----------------------------------------------------------------------
  // FIND ALL
  // -----------------------------------------------------------------------

  async findAll(): Promise<AutomotorResponseDto[]> {
    const automotores = await this.automotorRepo.find({
      order: { atr_dominio: 'ASC' },
    });
    const results: AutomotorResponseDto[] = [];
    for (const atr of automotores) {
      const dueno = await this.findActiveOwner(atr.atr_ovp_id);
      results.push(this.toResponse(atr, dueno));
    }
    return results;
  }

  // -----------------------------------------------------------------------
  // FIND BY DOMINIO
  // -----------------------------------------------------------------------

  async findByDominio(dominio: string): Promise<AutomotorResponseDto> {
    const automotor = await this.automotorRepo.findOne({
      where: { atr_dominio: dominio },
    });
    if (!automotor) {
      throw new NotFoundException(`Automotor with domain ${dominio} not found`);
    }
    const dueno = await this.findActiveOwner(automotor.atr_ovp_id);
    return this.toResponse(automotor, dueno);
  }

  // -----------------------------------------------------------------------
  // CREATE
  // -----------------------------------------------------------------------

  async create(dto: CreateAutomotorDto): Promise<AutomotorResponseDto> {
    this.logger.log(
      `Creating automotor: dominio=${dto.atr_dominio} cuit=${dto.cuit_dueno}`,
    );

    if (!isValidDominio(dto.atr_dominio)) {
      throw new BusinessRuleViolationException(
        `Invalid domain "${dto.atr_dominio}". Expected AAA999 or AA999AA`,
      );
    }
    if (!isValidCUIT(dto.cuit_dueno)) {
      throw new BusinessRuleViolationException(
        `Invalid CUIT "${dto.cuit_dueno}"`,
      );
    }
    if (!isValidFechaFabricacion(dto.atr_fecha_fabricacion)) {
      throw new BusinessRuleViolationException(
        `Invalid fabrication date "${dto.atr_fecha_fabricacion}"`,
      );
    }

    const sujeto = await this.sujetoRepo.findOne({
      where: { spo_cuit: dto.cuit_dueno },
    });
    if (!sujeto) {
      throw new BusinessRuleViolationException(
        `Subject with CUIT "${dto.cuit_dueno}" does not exist. Create it first via POST /api/sujetos`,
      );
    }

    /*
     * Si el dominio ya existe, el constraint UNIQUE en Automotor.atr_dominio
     * lanza error 23505 (unique_violation). El TypeOrmExceptionFilter global
     * lo convierte en 422 automáticamente con el mensaje del constraint.
     */

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let ovp = await queryRunner.manager.findOne(ObjetoDeValor, {
        where: { ovp_codigo: dto.atr_dominio },
      });
      if (!ovp) {
        ovp = queryRunner.manager.create(ObjetoDeValor, {
          ovp_tipo: 'AUTOMOTOR',
          ovp_codigo: dto.atr_dominio,
          ovp_descripcion: `Automotor dominio ${dto.atr_dominio}`,
        });
        ovp = await queryRunner.manager.save(ovp);
      }

      // Cerrar vínculo activo previo
      await queryRunner.manager
        .createQueryBuilder()
        .update(VinculoSujetoObjeto)
        .set({ vso_fecha_fin: this.today() })
        .where('vso_ovp_id = :ovpId', { ovpId: ovp.ovp_id })
        .andWhere('vso_fecha_fin IS NULL')
        .andWhere('vso_responsable = :resp', { resp: 'S' })
        .andWhere('vso_tipo_vinculo = :tipo', { tipo: 'DUENO' })
        .execute();

      const automotor = queryRunner.manager.create(Automotor, {
        atr_ovp_id: ovp.ovp_id,
        atr_dominio: dto.atr_dominio,
        atr_numero_chasis: dto.atr_numero_chasis,
        atr_numero_motor: dto.atr_numero_motor,
        atr_color: dto.atr_color,
        atr_fecha_fabricacion: dto.atr_fecha_fabricacion,
      });
      const saved = await queryRunner.manager.save(automotor);

      const vinculo = queryRunner.manager.create(VinculoSujetoObjeto, {
        vso_ovp_id: ovp.ovp_id,
        vso_spo_id: sujeto.spo_id,
        vso_tipo_vinculo: 'DUENO',
        vso_porcentaje: 100,
        vso_responsable: 'S',
        vso_fecha_inicio: this.today(),
      });
      await queryRunner.manager.save(vinculo);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Automotor created: id=${saved.atr_id} dominio=${saved.atr_dominio}`,
      );
      return this.toResponse(saved, sujeto);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create automotor: dominio=${dto.atr_dominio}`,
        (err as Error).stack,
      );
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // -----------------------------------------------------------------------
  // UPDATE
  // -----------------------------------------------------------------------

  async update(
    dominio: string,
    dto: UpdateAutomotorDto,
  ): Promise<AutomotorResponseDto> {
    const automotor = await this.automotorRepo.findOne({
      where: { atr_dominio: dominio },
      relations: ['objetoDeValor'],
    });
    this.logger.log(`Updating automotor: dominio=${dominio}`);

    if (!automotor) {
      throw new NotFoundException(`Automotor with domain ${dominio} not found`);
    }

    if (
      dto.atr_fecha_fabricacion !== undefined &&
      !isValidFechaFabricacion(dto.atr_fecha_fabricacion)
    ) {
      throw new BusinessRuleViolationException(
        `Invalid fabrication date "${dto.atr_fecha_fabricacion}"`,
      );
    }
    if (
      dto.atr_dominio !== undefined &&
      dto.atr_dominio !== dominio &&
      !isValidDominio(dto.atr_dominio)
    ) {
      throw new BusinessRuleViolationException(
        `Invalid domain "${dto.atr_dominio}"`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.atr_numero_chasis !== undefined)
        automotor.atr_numero_chasis = dto.atr_numero_chasis;
      if (dto.atr_numero_motor !== undefined)
        automotor.atr_numero_motor = dto.atr_numero_motor;
      if (dto.atr_color !== undefined) automotor.atr_color = dto.atr_color;
      if (dto.atr_fecha_fabricacion !== undefined)
        automotor.atr_fecha_fabricacion = dto.atr_fecha_fabricacion;
      if (dto.atr_dominio !== undefined && dto.atr_dominio !== dominio) {
        automotor.atr_dominio = dto.atr_dominio;
        automotor.objetoDeValor.ovp_codigo = dto.atr_dominio;
        automotor.objetoDeValor.ovp_descripcion = `Automotor dominio ${dto.atr_dominio}`;
        await queryRunner.manager.save(automotor.objetoDeValor);
      }

      const saved = await queryRunner.manager.save(automotor);

      if (dto.cuit_dueno !== undefined) {
        if (!isValidCUIT(dto.cuit_dueno)) {
          throw new BusinessRuleViolationException(
            `Invalid CUIT "${dto.cuit_dueno}"`,
          );
        }
        const sujeto = await queryRunner.manager.findOne(Sujeto, {
          where: { spo_cuit: dto.cuit_dueno },
        });
        if (!sujeto) {
          throw new BusinessRuleViolationException(
            `Subject with CUIT "${dto.cuit_dueno}" does not exist`,
          );
        }

        await queryRunner.manager
          .createQueryBuilder()
          .update(VinculoSujetoObjeto)
          .set({ vso_fecha_fin: this.today() })
          .where('vso_ovp_id = :ovpId', { ovpId: automotor.atr_ovp_id })
          .andWhere('vso_fecha_fin IS NULL')
          .andWhere('vso_responsable = :resp', { resp: 'S' })
          .andWhere('vso_tipo_vinculo = :tipo', { tipo: 'DUENO' })
          .execute();

        const vinculo = queryRunner.manager.create(VinculoSujetoObjeto, {
          vso_ovp_id: automotor.atr_ovp_id,
          vso_spo_id: sujeto.spo_id,
          vso_tipo_vinculo: 'DUENO',
          vso_porcentaje: 100,
          vso_responsable: 'S',
          vso_fecha_inicio: this.today(),
        });
        await queryRunner.manager.save(vinculo);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Automotor updated: dominio=${saved.atr_dominio}`);
      const dueno = await this.findActiveOwner(saved.atr_ovp_id);
      return this.toResponse(saved, dueno);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to update automotor: dominio=${dominio}`,
        (err as Error).stack,
      );
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // -----------------------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------------------

  async remove(dominio: string): Promise<void> {
    this.logger.log(`Deleting automotor: dominio=${dominio}`);

    const automotor = await this.automotorRepo.findOne({
      where: { atr_dominio: dominio },
    });
    if (!automotor) {
      throw new NotFoundException(`Automotor with domain ${dominio} not found`);
    }
    await this.ovpRepo.delete(automotor.atr_ovp_id);
    this.logger.log(`Automotor deleted: dominio=${dominio}`);
  }
}
