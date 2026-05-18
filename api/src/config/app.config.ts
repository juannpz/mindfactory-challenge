/**
 * Centralised application configuration derived from validated environment
 * variables. Accessed by both the ConfigModule and TypeORM configuration.
 */
export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT!, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'mindfactory_challenge',
  },
});
