import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjetoDeValor } from '../../objetos-de-valor/entities/objeto-de-valor.entity';
import { Sujeto } from '../../sujetos/entities/sujeto.entity';

/**
 * Vínculo entre un Sujeto y un Objeto_De_Valor.
 *
 * FK vso_ovp_id → Objeto_De_Valor ON DELETE CASCADE.
 * FK vso_spo_id → Sujeto ON DELETE RESTRICT.
 *
 * Índice parcial único: solo un dueño activo (responsable='S', fecha_fin IS NULL) por automotor.
 */
@Entity({ name: 'Vinculo_Sujeto_Objeto' })
@Index('uq_vso_owner_actual', ['vso_ovp_id'], {
  unique: true,
  where: `vso_responsable = 'S' AND vso_fecha_fin IS NULL AND vso_tipo_vinculo = 'DUENO'`,
})
export class VinculoSujetoObjeto {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  vso_id!: number;

  @Column({ type: 'bigint' })
  vso_ovp_id!: number;

  @Column({ type: 'bigint' })
  vso_spo_id!: number;

  @Column({ type: 'varchar', length: 30, default: 'DUENO' })
  vso_tipo_vinculo!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 100 })
  vso_porcentaje!: number;

  @Column({ type: 'char', length: 1, default: 'S' })
  vso_responsable!: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  vso_fecha_inicio!: string;

  @Column({ type: 'date', nullable: true })
  vso_fecha_fin?: string | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  created_at!: Date;

  @ManyToOne(() => ObjetoDeValor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vso_ovp_id' })
  objetoDeValor!: ObjetoDeValor;

  @ManyToOne(() => Sujeto, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vso_spo_id' })
  sujeto!: Sujeto;
}
