
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmpresasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new NotFoundException('Erro ao buscar empresas');
    return data;
  }

  async findOne(id: string, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Empresa não encontrada');
    return data;
  }

  async create(dto: CreateEmpresaDto, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('empresas')
      .insert([{ ...dto }])
      .select('*')
      .single();
    if (error) {
      // Log detalhado do erro do Supabase
      console.error('[EmpresasService][create] Supabase error:', error);
      throw new NotFoundException(`Erro ao criar empresa: ${error.message || error}`);
    }
    return data;
  }
}
