import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EquipamentosService } from './equipamentos.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('equipamentos')
@Controller('equipamentos')
export class EquipamentosController {
  constructor(private readonly equipamentosService: EquipamentosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo equipamento' })
  create(@Body() createEquipamentoDto: CreateEquipamentoDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.equipamentosService.create(createEquipamentoDto, token);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os equipamentos' })
  @ApiQuery({ name: 'clienteId', required: false, description: 'Filtrar por ID do cliente' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Filtrar por ID da empresa' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo (true/false)' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página', type: Number })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Itens por página', type: Number })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por tipo, fabricante, modelo, série ou nome' })
  findAll(
    @Query('clienteId') clienteId?: string,
    @Query('empresaId') empresaId?: string,
    @Query('ativo') ativo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Req() request?: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 1000;
    const ativoBoolean = ativo === 'true' ? true : ativo === 'false' ? false : undefined;

    const token = (request as any)?.user?.access_token
    return this.equipamentosService.findAll(
      clienteId,
      empresaId,
      ativoBoolean,
      pageNum,
      pageSizeNum,
      search,
      token,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar equipamento por ID' })
  findOne(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.equipamentosService.findOne(id, token);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar equipamento' })
  update(@Param('id') id: string, @Body() updateEquipamentoDto: UpdateEquipamentoDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.equipamentosService.update(id, updateEquipamentoDto, token);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover equipamento' })
  remove(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.equipamentosService.remove(id, token);
  }
}
