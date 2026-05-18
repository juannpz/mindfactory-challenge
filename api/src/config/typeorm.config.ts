import { DataSource } from 'typeorm';

/**
 * DataSource para TypeORM CLI (generar/ejecutar migraciones manualmente).
 * No se usa en runtime — la app NestJS usa la configuración en AppModule.
 */
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mindfactory_challenge',
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});

export default dataSource;
