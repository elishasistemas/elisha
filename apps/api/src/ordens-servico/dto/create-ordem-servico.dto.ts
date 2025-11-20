import { IsString, IsOptional, IsUUID, IsDateString, IsIn } from 'class-validator';

export class CreateOrdemServicoDto {
  @IsUUID()
  empresa_id: string;

  @IsUUID()
  cliente_id: string;

  @IsUUID()
  @IsOptional()
  equipamento_id?: string;

  @IsUUID()
  @IsOptional()
  tecnico_id?: string;

  @IsString()
  @IsIn(['chamado', 'preventiva', 'corretiva', 'instalacao'])
  tipo: string;

  @IsString()
  @IsIn(['baixa', 'media', 'alta', 'urgente'])
  @IsOptional()
  prioridade?: string;

  @IsString()
  @IsIn(['novo', 'agendado', 'em_andamento', 'pausado', 'concluido', 'cancelado'])
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  data_abertura?: string;

  @IsDateString()
  @IsOptional()
  data_programada?: string;

  @IsDateString()
  @IsOptional()
  data_inicio?: string;

  @IsDateString()
  @IsOptional()
  data_fim?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsString()
  @IsIn(['painel', 'whatsapp', 'telefone', 'email'])
  @IsOptional()
  origem?: string;

  @IsString()
  @IsOptional()
  numero_os?: string;
}
