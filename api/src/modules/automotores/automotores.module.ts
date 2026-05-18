import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Automotor } from './entities/automotor.entity';
import { ObjetoDeValor } from '../objetos-de-valor/entities/objeto-de-valor.entity';
import { VinculoSujetoObjeto } from '../vinculos/entities/vinculo-sujeto-objeto.entity';
import { Sujeto } from '../sujetos/entities/sujeto.entity';
import { AutomotoresService } from './automotores.service';
import { AutomotoresController } from './automotores.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Automotor,
      ObjetoDeValor,
      VinculoSujetoObjeto,
      Sujeto,
    ]),
  ],
  controllers: [AutomotoresController],
  providers: [AutomotoresService],
})
export class AutomotoresModule {}
