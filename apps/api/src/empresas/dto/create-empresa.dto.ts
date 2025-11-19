import { IsString, IsOptional, IsEmail, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty()
  @IsString()
  cnpj: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
