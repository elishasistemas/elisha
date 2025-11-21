import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
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
  async findAll(@Req() request: any) {
    const token = request.user?.access_token
    return this.empresasService.findAll(token);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  async findOne(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.empresasService.findOne(id, token);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar nova empresa' })
  async create(@Body() createEmpresaDto: CreateEmpresaDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.empresasService.create(createEmpresaDto, token);
  }
}
