
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ClientesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new NotFoundException('Erro ao buscar clientes');
    return data;
  }

  async findOne(id: string, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Cliente não encontrado');
    return data;
  }

  async create(dto: CreateClienteDto, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('clientes')
      .insert([{ ...dto }])
      .select('*')
      .single();
    if (error) {
      console.error('[ClientesService] Erro ao criar cliente:', error);
      throw new NotFoundException(`Erro ao criar cliente: ${error.message || error.code}`);
    }
    return data;
  }

  async update(id: string, dto: Partial<CreateClienteDto>, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    // Primeiro verificar se o cliente existe e o usuário tem acesso
    const { data: existing, error: findError } = await client
      .from('clientes')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    
    if (findError) {
      console.error('[ClientesService] Erro ao buscar cliente para update:', findError);
      throw new NotFoundException(`Cliente não encontrado: ${findError.message}`);
    }
    
    if (!existing) {
      throw new NotFoundException('Cliente não encontrado ou sem permissão de acesso');
    }

    const { data, error } = await client
      .from('clientes')
      .update(dto)
      .eq('id', id)
      .select('*');
    
    if (error) {
      console.error('[ClientesService] Erro ao atualizar cliente:', error);
      throw new NotFoundException(`Erro ao atualizar cliente: ${error.message || error.code}`);
    }
    
    if (!data || data.length === 0) {
      throw new NotFoundException('Erro ao atualizar: nenhum registro afetado');
    }
    
    return data[0];
  }
}
