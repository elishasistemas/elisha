import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Injectable()
export class ChecklistsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(
    empresaId?: string,
    offset = 0,
    limit = 10,
    order = 'created_at.desc',
  ) {
    const [orderField, orderDir] = order.split('.');
    const ascending = orderDir !== 'desc';

    let query = this.supabaseService.client
      .from('checklists')
      .select('*');

    if (empresaId) query = query.eq('empresa_id', empresaId);

    query = query.order(orderField, { ascending });

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw new NotFoundException('Erro ao buscar checklists');
    return { data, count };
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('checklists')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Checklist não encontrado');
    return data;
  }

  async create(dto: CreateChecklistDto) {
    const { data, error } = await this.supabaseService.client
      .from('checklists')
      .insert([{ ...dto }])
      .select('*')
      .single();
    if (error) throw new NotFoundException('Erro ao criar checklist');
    return data;
  }

  async update(id: string, dto: UpdateChecklistDto) {
    const { data, error } = await this.supabaseService.client
      .from('checklists')
      .update({ ...dto })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new NotFoundException('Erro ao atualizar checklist');
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('checklists')
      .delete()
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new NotFoundException('Erro ao remover checklist');
    return data;
  }
}
