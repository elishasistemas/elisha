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
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';

@ApiTags('checklists')
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar checklist' })
  create(@Body() createChecklistDto: CreateChecklistDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.checklistsService.create(createChecklistDto, token);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar checklists' })
  @ApiQuery({ name: 'empresaId', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  findAll(
    @Query('empresaId') empresaId?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('order') order?: string,
    @Req() request?: any,
  ) {
    const off = offset ? parseInt(offset, 10) : 0;
    const lim = limit ? parseInt(limit, 10) : 10;
    const ord = order || 'created_at.desc';
    const token = request?.user?.access_token
    return this.checklistsService.findAll(empresaId, off, lim, ord, token);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar checklist por ID' })
  findOne(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.checklistsService.findOne(id, token);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar checklist' })
  update(@Param('id') id: string, @Body() updateChecklistDto: UpdateChecklistDto, @Req() request: any) {
    const token = request.user?.access_token
    return this.checklistsService.update(id, updateChecklistDto, token);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover checklist' })
  remove(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.checklistsService.remove(id, token);
  }
}
