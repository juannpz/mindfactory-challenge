import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sujeto } from './entities/sujeto.entity';
import { SujetosService } from './sujetos.service';
import { SujetosController } from './sujetos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sujeto])],
  controllers: [SujetosController],
  providers: [SujetosService],
  exports: [SujetosService],
})
export class SujetosModule {}
