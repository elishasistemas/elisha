import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
