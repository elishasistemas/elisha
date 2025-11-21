import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  async findAll(@Req() request: any) {
    const token = request.user?.access_token
    return this.clientesService.findAll(token);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  async findOne(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.clientesService.findOne(id, token);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo cliente' })
  async create(@Body() createClienteDto: CreateClienteDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.clientesService.create(createClienteDto, token);
  }
}
