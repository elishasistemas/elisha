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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrdensServicoService } from './ordens-servico.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ordens-servico')
@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly ordensServicoService: OrdensServicoService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar nova ordem de serviço' })
  create(@Body() createOrdemServicoDto: CreateOrdemServicoDto) {
    console.log('[OrdensServicoController] POST /ordens-servico - Criando OS:', createOrdemServicoDto);
    return this.ordensServicoService.create(createOrdemServicoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as ordens de serviço' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Filtrar por ID da empresa' })
  @ApiQuery({ name: 'tecnicoId', required: false, description: 'Filtrar por ID do técnico' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'prioridade', required: false, description: 'Filtrar por prioridade' })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Ordenar por: status, prioridade ou created_at' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página', type: Number })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Itens por página', type: Number })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por número OS, tipo, status ou observações' })
  findAll(
    @Query('empresaId') empresaId?: string,
    @Query('tecnicoId') tecnicoId?: string,
    @Query('status') status?: string,
    @Query('prioridade') prioridade?: string,
    @Query('orderBy') orderBy?: 'status' | 'prioridade' | 'created_at',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;

    return this.ordensServicoService.findAll(
      empresaId,
      tecnicoId,
      status,
      prioridade,
      orderBy,
      pageNum,
      pageSizeNum,
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar ordem de serviço por ID' })
  findOne(@Param('id') id: string) {
    return this.ordensServicoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar ordem de serviço' })
  update(@Param('id') id: string, @Body() updateOrdemServicoDto: UpdateOrdemServicoDto) {
    return this.ordensServicoService.update(id, updateOrdemServicoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover ordem de serviço' })
  remove(@Param('id') id: string) {
    return this.ordensServicoService.remove(id);
  }
}
