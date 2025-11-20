import { Module } from '@nestjs/common';
import { OrdensServicoService } from './ordens-servico.service';
import { OrdensServicoController } from './ordens-servico.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [SupabaseModule],
  controllers: [OrdensServicoController],
  providers: [OrdensServicoService, JwtAuthGuard],
  exports: [OrdensServicoService],
})
export class OrdensServicoModule {}
