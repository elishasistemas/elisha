
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

  async uploadLogoToStorage(id: string, file: Express.Multer.File, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    // Gerar nome único para o arquivo
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${id}-logo-${Date.now()}.${fileExt}`;
    const filePath = `empresas/logos/${fileName}`;

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await client.storage
      .from('empresas')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true // Substituir se já existir
      });

    if (uploadError) {
      console.error('[EmpresasService][uploadLogoToStorage] Upload error:', uploadError);
      throw new NotFoundException(`Erro ao fazer upload do logo: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: urlData } = client.storage
      .from('empresas')
      .getPublicUrl(filePath);

    // Atualizar logo_url na tabela empresas
    const { data, error } = await client
      .from('empresas')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error || !data) {
      console.error('[EmpresasService][uploadLogoToStorage] Update error:', error);
      throw new NotFoundException(`Erro ao atualizar logo da empresa: ${error?.message || 'Empresa não encontrada'}`);
    }
    
    return data;
  }
}
