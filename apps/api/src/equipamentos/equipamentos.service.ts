import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EquipamentosService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(clienteId?: string, empresaId?: string, ativo?: boolean, page = 1, pageSize = 1000, search?: string, accessToken?: string) {
    try {
      console.log('[EquipamentosService] Buscando equipamentos com filtros:', { clienteId, empresaId, ativo, page, pageSize, search });
      
      const client = accessToken
        ? this.supabaseService.createUserClient(accessToken)
        : this.supabaseService.client

      let query = client
        .from('equipamentos')
        .select('*', { count: 'exact' });

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      if (typeof ativo === 'boolean') {
        query = query.eq('ativo', ativo);
      }

      if (search && search.trim()) {
        const like = `%${search.trim()}%`;
        query = query.or(
          `tipo.ilike.${like},fabricante.ilike.${like},modelo.ilike.${like},numero_serie.ilike.${like},nome.ilike.${like}`
        );
      }

      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error('[EquipamentosService] Erro ao buscar equipamentos:', error);
        throw error;
      }

      console.log('[EquipamentosService] Equipamentos encontrados:', data?.length || 0);

      return {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('[EquipamentosService] Erro ao buscar equipamentos:', error);
      throw error;
    }
  }

  async findOne(id: string, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('equipamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createEquipamentoDto: CreateEquipamentoDto, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('equipamentos')
      .insert([createEquipamentoDto])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateEquipamentoDto: UpdateEquipamentoDto, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('equipamentos')
      .update(updateEquipamentoDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { error } = await client
      .from('equipamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Equipamento removido com sucesso' };
  }
}
