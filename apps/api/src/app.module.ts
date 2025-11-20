import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SupabaseModule } from './supabase/supabase.module';
import { HealthModule } from './health/health.module';
import { ClientesModule } from './clientes/clientes.module';
import { EmpresasModule } from './empresas/empresas.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { EquipamentosModule } from './equipamentos/equipamentos.module';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local',
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    HealthModule,
    ClientesModule,
    EmpresasModule,
    ColaboradoresModule,
    EquipamentosModule,
    OrdensServicoModule,
  ],
})
export class AppModule {}