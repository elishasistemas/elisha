import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID } from 'class-validator';

export class CreateEquipamentoDto {
  @IsUUID()
  cliente_id: string;

  @IsUUID()
  empresa_id: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  tipo: string;

  @IsString()
  @IsOptional()
  fabricante?: string;

  @IsString()
  @IsOptional()
  modelo?: string;

  @IsString()
  @IsOptional()
  numero_serie?: string;

  @IsNumber()
  @IsOptional()
  ano_instalacao?: number;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  pavimentos?: string;

  @IsString()
  @IsOptional()
  capacidade?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
