import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Objeto de valor genérico (en este dominio: vehículos). */
@Entity({ name: 'Objeto_De_Valor' })
export class ObjetoDeValor {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  ovp_id!: number;

  @Column({ type: 'varchar', length: 30, default: 'AUTOMOTOR' })
  ovp_tipo!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  ovp_codigo!: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  ovp_descripcion?: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  updated_at!: Date;
}
