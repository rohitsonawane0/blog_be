import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: "postgresql://postgres:SuperUser@33@db.izusqhwkbzjmflsldrrj.supabase.co:5432/postgres",
    ssl: {
        rejectUnauthorized: false,
    },
    autoLoadEntities: true,
    synchronize: true,
    // logging: ['error', 'warn'],
    extra: {
        max: 5,
    },
});
//