import { Module } from '@nestjs/common';
import { EquipamentosService } from './equipamentos.service';
import { EquipamentosController } from './equipamentos.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [SupabaseModule],
  controllers: [EquipamentosController],
  providers: [EquipamentosService, JwtAuthGuard],
  exports: [EquipamentosService],
})
export class EquipamentosModule {}
