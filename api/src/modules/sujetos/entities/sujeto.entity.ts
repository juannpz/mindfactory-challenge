import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Persona física o jurídica que puede ser dueña de vehículos. */
@Entity({ name: 'Sujeto' })
export class Sujeto {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  spo_id!: number;

  @Column({ type: 'varchar', length: 11, unique: true })
  spo_cuit!: string;

  @Column({ type: 'varchar', length: 160 })
  spo_denominacion!: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  updated_at!: Date;
}
