import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ColaboradoresService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(empresaId?: string, ativo?: boolean, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    let query = client
      .from('colaboradores')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('[ColaboradoresService][findAll] Filtros:', { empresaId, ativo });

    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo);
    }

    const { data, error } = await query;
    console.log('[ColaboradoresService][findAll] Resultado:', { count: data?.length, error });
    if (error) {
      console.error('[ColaboradoresService][findAll] Supabase error:', error);
      throw new NotFoundException(`Erro ao buscar colaboradores: ${error.message}`);
    }
    return data;
  }

  async findOne(id: string, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('colaboradores')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      throw new NotFoundException('Colaborador não encontrado');
    }
    return data;
  }

  async create(dto: CreateColaboradorDto, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('colaboradores')
      .insert([{ ...dto }])
      .select('*')
      .single();
    
    if (error) {
      console.error('[ColaboradoresService][create] Supabase error:', error);
      throw new NotFoundException(`Erro ao criar colaborador: ${error.message}`);
    }
    return data;
  }

  async update(id: string, dto: UpdateColaboradorDto, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('colaboradores')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('[ColaboradoresService][update] Supabase error:', error);
      throw new NotFoundException(`Erro ao atualizar colaborador: ${error.message}`);
    }
    return data;
  }

  async remove(id: string, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { error } = await client
      .from('colaboradores')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[ColaboradoresService][remove] Supabase error:', error);
      throw new NotFoundException(`Erro ao deletar colaborador: ${error.message}`);
    }
    return { message: 'Colaborador deletado com sucesso' };
  }
}
