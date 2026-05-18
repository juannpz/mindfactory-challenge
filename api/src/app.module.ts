import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomotoresModule } from './modules/automotores/automotores.module';
import { SujetosModule } from './modules/sujetos/sujetos.module';
import { validateEnv } from './config/env.validation';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsRun: true,
        synchronize: false,
        logging: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    AutomotoresModule,
    SujetosModule,
  ],
})
export class AppModule {}
