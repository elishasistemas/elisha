import { IsString, IsOptional, IsEmail, IsDateString, IsUUID, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty()
  @IsUUID()
  empresa_id: string;

  @ApiProperty()
  @IsString()
  nome_local: string;

  @ApiProperty()
  @IsString()
  cnpj: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endereco_completo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responsavel_nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responsavel_telefone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  responsavel_email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  data_inicio_contrato?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  data_fim_contrato?: string;

  @ApiProperty({ required: false, enum: ['ativo', 'em_renovacao', 'encerrado'], default: 'ativo' })
  @IsOptional()
  @IsString()
  @IsIn(['ativo', 'em_renovacao', 'encerrado'])
  status_contrato?: string = 'ativo';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  valor_mensal_contrato?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numero_art?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  zona_id?: string;
}
