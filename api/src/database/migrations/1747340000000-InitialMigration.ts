import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración inicial — SQL exacto del challenge.
 *
 * Crea las 4 tablas (Sujeto, Objeto_De_Valor, Automotores, Vinculo_Sujeto_Objeto)
 * con constraints, foreign keys y el índice parcial único para dueño activo.
 *
 */
export class InitialMigration1747340000000 implements MigrationInterface {
  name = 'InitialMigration1747340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Sujeto" (
        spo_id           BIGSERIAL PRIMARY KEY,
        spo_cuit         VARCHAR(11)  NOT NULL UNIQUE,
        spo_denominacion VARCHAR(160) NOT NULL,
        created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Objeto_De_Valor" (
        ovp_id          BIGSERIAL PRIMARY KEY,
        ovp_tipo        VARCHAR(30)  NOT NULL DEFAULT 'AUTOMOTOR',
        ovp_codigo      VARCHAR(64)  NOT NULL UNIQUE,
        ovp_descripcion VARCHAR(240),
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Automotores" (
        atr_id                  BIGSERIAL   PRIMARY KEY,
        atr_ovp_id              BIGINT      NOT NULL REFERENCES "Objeto_De_Valor"(ovp_id) ON DELETE CASCADE,
        atr_dominio             VARCHAR(8)  NOT NULL UNIQUE,
        atr_numero_chasis       VARCHAR(25),
        atr_numero_motor        VARCHAR(25),
        atr_color               VARCHAR(40),
        atr_fecha_fabricacion   INTEGER     NOT NULL,
        atr_fecha_alta_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_atr_fecha_fabricacion CHECK (atr_fecha_fabricacion BETWEEN 190001 AND 299912)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Vinculo_Sujeto_Objeto" (
        vso_id           BIGSERIAL    PRIMARY KEY,
        vso_ovp_id       BIGINT       NOT NULL REFERENCES "Objeto_De_Valor"(ovp_id) ON DELETE CASCADE,
        vso_spo_id       BIGINT       NOT NULL REFERENCES "Sujeto"(spo_id) ON DELETE RESTRICT,
        vso_tipo_vinculo VARCHAR(30)  NOT NULL DEFAULT 'DUENO',
        vso_porcentaje   NUMERIC(5,2) NOT NULL DEFAULT 100,
        vso_responsable  CHAR(1)      NOT NULL DEFAULT 'S',
        vso_fecha_inicio DATE         NOT NULL DEFAULT CURRENT_DATE,
        vso_fecha_fin    DATE         NULL,
        created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_vso_owner_actual
        ON "Vinculo_Sujeto_Objeto"(vso_ovp_id)
        WHERE vso_responsable = 'S' AND vso_fecha_fin IS NULL AND vso_tipo_vinculo = 'DUENO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_vso_owner_actual`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Vinculo_Sujeto_Objeto"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Automotores"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Objeto_De_Valor"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Sujeto"`);
  }
}
