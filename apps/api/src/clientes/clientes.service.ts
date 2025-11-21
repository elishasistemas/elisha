
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
    if (error) throw new NotFoundException('Erro ao criar cliente');
    return data;
  }
}
