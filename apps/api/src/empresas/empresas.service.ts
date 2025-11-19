
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmpresasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new NotFoundException('Erro ao buscar empresas');
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Empresa não encontrada');
    return data;
  }

  async create(dto: CreateEmpresaDto) {
    const { data, error } = await this.supabaseService.client
      .from('empresas')
      .insert([{ ...dto }])
      .select('*')
      .single();
    if (error) throw new NotFoundException('Erro ao criar empresa');
    return data;
  }
}
