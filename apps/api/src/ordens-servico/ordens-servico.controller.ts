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
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrdensServicoService } from './ordens-servico.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ordens-servico')
@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly ordensServicoService: OrdensServicoService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar nova ordem de serviço' })
  create(@Body() createOrdemServicoDto: CreateOrdemServicoDto, @Req() request: any) {
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
  async finalize(
    @Param('id') id: string,
    @Body() data: {
      assinatura_cliente: string;
      nome_cliente_assinatura: string;
      email_cliente_assinatura?: string;
      estado_equipamento?: string;
    },
    @Req() request: any
  ) {
    try {
      const token = request.user?.access_token

      if (!token) {
        throw new HttpException('Token de autenticação não fornecido', HttpStatus.UNAUTHORIZED);
      }

      console.log('[finalize] Iniciando finalização da OS:', id);
      console.log('[finalize] Dados recebidos:', {
        tem_assinatura: !!data.assinatura_cliente,
        nome: data.nome_cliente_assinatura,
        estado_equipamento: data.estado_equipamento
      });

      const result = await this.ordensServicoService.finalize(id, data, token);

      console.log('[finalize] OS finalizada com sucesso');
      return result;
    } catch (error) {
      console.error('[finalize] Erro ao finalizar OS:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Erro desconhecido ao finalizar OS';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/laudo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar laudo da ordem de serviço' })
  async getLaudo(@Param('id') id: string, @Req() request: any, @Res() res: any) {
    const token = request.user?.access_token
    const laudo = await this.ordensServicoService.getLaudo(id, token);
    if (!laudo) {
      return res.status(404).json({ message: 'Laudo não encontrado' });
    }
    return res.json(laudo);
  }

  @Post(':id/laudo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar laudo para ordem de serviço' })
  async createLaudo(
    @Param('id') id: string,
    @Body() data: { o_que_foi_feito?: string; observacao?: string; empresa_id: string },
    @Req() request: any
  ) {
    const token = request.user?.access_token
    return this.ordensServicoService.createLaudo(id, data, token);
  }

  @Patch(':id/laudo/:laudoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar laudo da ordem de serviço' })
  async updateLaudo(
    @Param('id') id: string,
    @Param('laudoId') laudoId: string,
    @Body() data: { o_que_foi_feito?: string; observacao?: string },
    @Req() request: any
  ) {
    const token = request.user?.access_token
    return this.ordensServicoService.updateLaudo(laudoId, data, token);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar histórico de status da ordem de serviço' })
  async getHistory(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.ordensServicoService.getHistory(id, token);
  }

  // =====================================================
  // Endpoints para Checklist Items
  // =====================================================

  @Get(':id/checklist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar itens do checklist da ordem de serviço' })
  async getChecklistItems(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.ordensServicoService.getChecklistItems(id, token);
  }

  @Patch(':id/checklist/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar item do checklist' })
  async updateChecklistItem(
    @Param('id') osId: string,
    @Param('itemId') itemId: string,
    @Body() data: {
      descricao?: string;
      status?: 'conforme' | 'nao_conforme' | 'na';
      ordem?: number;
    },
    @Req() request: any
  ) {
    const token = request.user?.access_token
    return this.ordensServicoService.updateChecklistItem(osId, itemId, data, token);
  }

  @Post(':id/checklist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar item do checklist' })
  async createChecklistItem(
    @Param('id') osId: string,
    @Body() data: {
      descricao: string;
      status?: 'conforme' | 'nao_conforme' | 'na';
      ordem?: number;
    },
    @Req() request: any
  ) {
    const token = request.user?.access_token
    return this.ordensServicoService.createChecklistItem(osId, data, token);
  }
}
