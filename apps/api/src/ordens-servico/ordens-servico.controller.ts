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
  create(@Body() createOrdemServicoDto: CreateOrdemServicoDto, @Req() request: any) {
    console.log('[OrdensServicoController] POST /ordens-servico - Criando OS:', createOrdemServicoDto);
    const token = request.user?.access_token
    return this.ordensServicoService.create(createOrdemServicoDto, token);
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
    @Req() request?: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;

    const token = request?.user?.access_token
    return this.ordensServicoService.findAll(
      empresaId,
      tecnicoId,
      status,
      prioridade,
      orderBy,
      pageNum,
      pageSizeNum,
      search,
      token,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar ordem de serviço por ID' })
  findOne(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.ordensServicoService.findOne(id, token);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar ordem de serviço' })
  update(@Param('id') id: string, @Body() updateOrdemServicoDto: UpdateOrdemServicoDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.ordensServicoService.update(id, updateOrdemServicoDto, token);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover ordem de serviço' })
  remove(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.ordensServicoService.remove(id, token);
  }

  @Post(':id/finalize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Finalizar ordem de serviço com assinatura do cliente' })
  finalize(
    @Param('id') id: string, 
    @Body() data: { 
      assinatura_cliente: string; 
      nome_cliente_assinatura: string; 
      email_cliente_assinatura?: string 
    }, 
    @Req() request: any
  ) {
    const token = request.user?.access_token
    return this.ordensServicoService.finalize(id, data, token);
  }
}
