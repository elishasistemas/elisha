import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as empresas' })
  async findAll() {
    return this.empresasService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  async findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar nova empresa' })
  async create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresasService.create(createEmpresaDto);
  }
}
