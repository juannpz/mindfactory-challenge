import { DataSource } from 'typeorm';
import { Sujeto } from '../../modules/sujetos/entities/sujeto.entity';
import { ObjetoDeValor } from '../../modules/objetos-de-valor/entities/objeto-de-valor.entity';
import { Automotor } from '../../modules/automotores/entities/automotor.entity';
import { VinculoSujetoObjeto } from '../../modules/vinculos/entities/vinculo-sujeto-objeto.entity';

/**
 * Seeds mínimos con datos de ejemplo (bonus del challenge).
 *
 * Se ejecuta con: npm run seed:run
 * Requiere que la DB esté corriendo y las migraciones aplicadas.
 */
async function seed(): Promise<void> {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'mindfactory_challenge',
    entities: [Sujeto, ObjetoDeValor, Automotor, VinculoSujetoObjeto],
    synchronize: false,
  });

  await ds.initialize();
  console.log('📦 Connected to database, seeding...');

  const sujetoRepo = ds.getRepository(Sujeto);
  const ovpRepo = ds.getRepository(ObjetoDeValor);
  const automotorRepo = ds.getRepository(Automotor);
  const vinculoRepo = ds.getRepository(VinculoSujetoObjeto);

  // Crear sujetos de ejemplo
  const juan = await sujetoRepo.save(
    sujetoRepo.create({
      spo_cuit: '20123456786',
      spo_denominacion: 'Juan Pérez',
    }),
  );
  console.log(`✅ Sujeto: ${juan.spo_denominacion} (${juan.spo_cuit})`);

  const empresa = await sujetoRepo.save(
    sujetoRepo.create({
      spo_cuit: '30531471179',
      spo_denominacion: 'Transportes S.A.',
    }),
  );
  console.log(`✅ Sujeto: ${empresa.spo_denominacion} (${empresa.spo_cuit})`);

  // Crear Objeto_De_Valor + Automotor + Vínculo para Juan
  const ovp1 = await ovpRepo.save(
    ovpRepo.create({
      ovp_tipo: 'AUTOMOTOR',
      ovp_codigo: 'ABC123',
      ovp_descripcion: 'Automotor dominio ABC123',
    }),
  );

  await automotorRepo.save(
    automotorRepo.create({
      atr_ovp_id: ovp1.ovp_id,
      atr_dominio: 'ABC123',
      atr_numero_chasis: '1HGCM82633A123456',
      atr_numero_motor: 'K24A-1234567',
      atr_color: 'Rojo',
      atr_fecha_fabricacion: 202103,
    }),
  );

  await vinculoRepo.save(
    vinculoRepo.create({
      vso_ovp_id: ovp1.ovp_id,
      vso_spo_id: juan.spo_id,
      vso_tipo_vinculo: 'DUENO',
      vso_porcentaje: 100,
      vso_responsable: 'S',
      vso_fecha_inicio: '2024-01-15',
    }),
  );
  console.log('✅ Automotor ABC123 asignado a Juan Pérez');

  // Crear Objeto_De_Valor + Automotor + Vínculo para Empresa
  const ovp2 = await ovpRepo.save(
    ovpRepo.create({
      ovp_tipo: 'AUTOMOTOR',
      ovp_codigo: 'AB123CD',
      ovp_descripcion: 'Automotor dominio AB123CD',
    }),
  );

  await automotorRepo.save(
    automotorRepo.create({
      atr_ovp_id: ovp2.ovp_id,
      atr_dominio: 'AB123CD',
      atr_color: 'Blanco',
      atr_fecha_fabricacion: 202211,
    }),
  );

  await vinculoRepo.save(
    vinculoRepo.create({
      vso_ovp_id: ovp2.ovp_id,
      vso_spo_id: empresa.spo_id,
      vso_tipo_vinculo: 'DUENO',
      vso_porcentaje: 100,
      vso_responsable: 'S',
      vso_fecha_inicio: '2024-06-01',
    }),
  );
  console.log('✅ Automotor AB123CD asignado a Transportes S.A.');

  await ds.destroy();
  console.log('🎉 Seeds completed!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
