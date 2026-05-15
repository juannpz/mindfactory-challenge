import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { ObjetoDeValor } from '../../objetos-de-valor/entities/objeto-de-valor.entity';

/** Datos específicos del vehículo, vinculado 1:1 a un Objeto_De_Valor. */
@Entity({ name: 'Automotores' })
export class Automotor {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  atr_id!: number;

  @Column({ type: 'bigint' })
  atr_ovp_id!: number;

  @Column({ type: 'varchar', length: 8, unique: true })
  atr_dominio!: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  atr_numero_chasis?: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  atr_numero_motor?: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  atr_color?: string;

  @Check(
    'chk_atr_fecha_fabricacion',
    'atr_fecha_fabricacion BETWEEN 190001 AND 299912',
  )
  @Column({ type: 'integer' })
  atr_fecha_fabricacion!: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  atr_fecha_alta_registro!: Date;

  @OneToOne(() => ObjetoDeValor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atr_ovp_id' })
  objetoDeValor!: ObjetoDeValor;
}
