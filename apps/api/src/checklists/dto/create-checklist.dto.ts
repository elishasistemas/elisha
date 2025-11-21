import { IsString, IsUUID, IsArray, ValidateNested, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistItemDto } from './checklist-item.dto';

export class CreateChecklistDto {
  @IsUUID()
  empresa_id: string;

  @IsString()
  nome: string;

  @IsString()
  tipo_servico: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  itens: ChecklistItemDto[];

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  origem?: string;

  @IsOptional()
  @IsArray()
  abnt_refs?: string[];

  @IsOptional()
  @IsNumber()
  versao?: number;
}
