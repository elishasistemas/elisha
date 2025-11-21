import { IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class ChecklistItemDto {
  @IsString()
  tipo: string;

  @IsNumber()
  ordem: number;

  @IsString()
  secao: string;

  @IsBoolean()
  critico: boolean;

  @IsArray()
  abnt_refs: string[];

  @IsString()
  descricao: string;

  @IsBoolean()
  obrigatorio: boolean;
}
