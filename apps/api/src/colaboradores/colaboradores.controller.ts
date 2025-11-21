import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards, Req } from '@nestjs/common';
import { ColaboradoresService } from './colaboradores.service';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Colaboradores')
@Controller('colaboradores')
export class ColaboradoresController {
  constructor(private readonly colaboradoresService: ColaboradoresService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os colaboradores' })
  @ApiQuery({ name: 'empresaId', required: false, type: String })
  @ApiQuery({ name: 'ativo', required: false, type: Boolean })
  async findAll(
    @Query('empresaId') empresaId?: string,
    @Query('ativo') ativo?: string,
    @Req() request?: any,
  ) {
    const ativoBoolean = ativo === 'true' ? true : ativo === 'false' ? false : undefined;
    const token = request?.user?.access_token
    return this.colaboradoresService.findAll(empresaId, ativoBoolean, token);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar colaborador por ID' })
  async findOne(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.colaboradoresService.findOne(id, token);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo colaborador' })
  async create(@Body() createColaboradorDto: CreateColaboradorDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.colaboradoresService.create(createColaboradorDto, token);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar colaborador' })
  async update(@Param('id') id: string, @Body() updateColaboradorDto: UpdateColaboradorDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.colaboradoresService.update(id, updateColaboradorDto, token);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar colaborador' })
  async remove(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.colaboradoresService.remove(id, token);
  }
}
