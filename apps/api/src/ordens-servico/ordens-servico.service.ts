import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';

@Injectable()
export class OrdensServicoService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Obtém o perfil do usuário a partir do token JWT
   */
  private async getUserProfile(accessToken: string) {
    const userClient = this.supabaseService.createUserClient(accessToken);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      throw new ForbiddenException('Token inválido ou expirado');
    }

    const { data: profile, error: profileError } = await this.supabaseService.client
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new ForbiddenException('Perfil não encontrado');
    }

    return { user, profile };
  }

  /**
   * Valida se o usuário tem permissão de admin
   */
  private isAdmin(profile: any): boolean {
    return profile.active_role === 'admin' || profile.is_elisha_admin === true;
  }

  /**
   * Obtém a empresa ativa do perfil (considera impersonation)
   */
  private getActiveEmpresaId(profile: any): string {
    if (profile.is_elisha_admin && profile.impersonating_empresa_id) {
      return profile.impersonating_empresa_id;
    }
    return profile.empresa_id;
  }

  async findAll(
    empresaId?: string,
    tecnicoId?: string,
    status?: string,
    prioridade?: string,
    orderBy?: 'status' | 'prioridade' | 'created_at',
    page = 1,
    pageSize = 10,
    search?: string,
    accessToken?: string,
  ) {
    try {

      // Usar view enriquecida se ordenar por status ou prioridade
      const fromTable = orderBy === 'status' || orderBy === 'prioridade'
        ? 'ordens_servico_enriquecida'
        : 'ordens_servico';

      const client = accessToken
        ? this.supabaseService.createUserClient(accessToken)
        : this.supabaseService.client

      let query = client
        .from(fromTable)
        .select('*', { count: 'exact' });

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      if (tecnicoId) {
        query = query.eq('tecnico_id', tecnicoId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (prioridade) {
        query = query.eq('prioridade', prioridade);
      }

      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase()
          .replace(/\s+/g, '_')  // "em andamento" -> "em_andamento"
          .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos
        
        const like = `%${searchTerm}%`;
        query = query.or(
          `numero_os.ilike.${like},tipo.ilike.${like},status.ilike.${like},observacoes.ilike.${like}`
        );
      }

      // Ordenação
      if (fromTable === 'ordens_servico_enriquecida') {
        if (orderBy === 'status') {
          query = query
            .order('peso_status', { ascending: true })
            .order('created_at', { ascending: false });
        } else {
          // prioridade
          query = query
            .order('peso_status', { ascending: true })
            .order('peso_prioridade', { ascending: true })
            .order('created_at', { ascending: false });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const { data, error, count } = await query.range(start, end);

      if (error) {
        console.error('[OrdensServicoService] Erro ao buscar OS:', error);
        throw error;
      }


      return {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('[OrdensServicoService] Erro ao buscar OS:', error);
      throw error;
    }
  }

  async findOne(id: string, accessToken?: string) {
    if (!accessToken) {
      throw new ForbiddenException('Token de autenticação não fornecido');
    }

    // Obter perfil do usuário
    const { profile } = await this.getUserProfile(accessToken);
    const empresaAtiva = this.getActiveEmpresaId(profile);

    // Buscar OS usando service role (bypassa RLS)
    const { data, error } = await this.supabaseService.client
      .from('ordens_servico')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    // Validar que a OS pertence à empresa do usuário
    if (data.empresa_id !== empresaAtiva) {
      throw new ForbiddenException('Você não tem permissão para visualizar esta OS');
    }

    return data;
  }

  async create(createOrdemServicoDto: CreateOrdemServicoDto, accessToken?: string) {
    try {
      
      if (!accessToken) {
        throw new ForbiddenException('Token de autenticação não fornecido');
      }

      // Obter perfil do usuário
      const { profile } = await this.getUserProfile(accessToken);
      const empresaAtiva = this.getActiveEmpresaId(profile);

      // Apenas admins podem criar OSs
      if (!this.isAdmin(profile)) {
        throw new ForbiddenException('Apenas administradores podem criar ordens de serviço');
      }

      // Validar que a empresa_id da OS corresponde à empresa ativa do usuário
      if (createOrdemServicoDto.empresa_id !== empresaAtiva) {
        throw new ForbiddenException('Você não pode criar OS para outra empresa');
      }

      // Gerar número automático da OS no formato OS-0001-2025
      const ano = new Date().getFullYear();
      
      // Buscar a última OS da empresa no ano atual (usando service role)
      const { data: ultimaOS, error: ultimaOSError } = await this.supabaseService.client
        .from('ordens_servico')
        .select('numero_os')
        .eq('empresa_id', createOrdemServicoDto.empresa_id)
        .like('numero_os', `OS-%-${ano}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ultimaOSError && ultimaOSError.code !== 'PGRST116') {
        console.error('[OrdensServicoService] Erro ao buscar última OS:', ultimaOSError);
        throw ultimaOSError;
      }

      let proximoNumero = 1;
      if (ultimaOS?.numero_os) {
        // Extrair o número do formato OS-0001-2025
        const match = ultimaOS.numero_os.match(/OS-(\d{4})-\d{4}/);
        if (match) {
          proximoNumero = parseInt(match[1], 10) + 1;
        }
      }

      // Formatar número com 4 dígitos
      const numeroFormatado = `OS-${proximoNumero.toString().padStart(4, '0')}-${ano}`;
      

      // Sobrescrever o numero_os com o valor gerado
      const ordemData = {
        ...createOrdemServicoDto,
        numero_os: numeroFormatado,
      };

      // Inserir usando service role (bypassa RLS)
      const { data, error } = await this.supabaseService.client
        .from('ordens_servico')
        .insert([ordemData])
        .select()
        .single();

      if (error) {
        console.error('[OrdensServicoService] Erro do Supabase:', error);
        // Erro de constraint de datas
        if (error.code === '23514' && error.message.includes('ordens_servico_datas_logicas')) {
          throw new Error('Datas inválidas: data_inicio deve ser >= data_abertura e data_fim deve ser >= data_inicio');
        }
        // Erro de constraint de status
        if (error.code === '23514' && error.message.includes('ordens_servico_status_check')) {
          throw new Error('Status inválido: status "agendado" requer data_programada, status "em_andamento" requer data_inicio, status "concluido" requer data_fim');
        }
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateOrdemServicoDto: UpdateOrdemServicoDto, accessToken?: string) {
    try {
      
      if (!accessToken) {
        throw new ForbiddenException('Token de autenticação não fornecido');
      }

      // Obter perfil do usuário
      const { profile } = await this.getUserProfile(accessToken);
      const empresaAtiva = this.getActiveEmpresaId(profile);

      // Buscar OS usando service role (bypassa RLS)
      const { data: os, error: osError } = await this.supabaseService.client
        .from('ordens_servico')
        .select('*')
        .eq('id', id)
        .single();

      if (osError || !os) {
        throw new NotFoundException('Ordem de serviço não encontrada');
      }

      // Validar que a OS pertence à empresa do usuário
      if (os.empresa_id !== empresaAtiva) {
        throw new ForbiddenException('Você não tem permissão para editar esta OS');
      }

      // Apenas admins podem editar OSs via UPDATE direto
      if (!this.isAdmin(profile)) {
        throw new ForbiddenException('Apenas administradores podem editar ordens de serviço. Técnicos devem usar os RPCs apropriados (os_accept, os_checkin, etc).');
      }

      // Remover numero_os se vier no payload (campo não é editável)
      const { numero_os, ...updateData } = updateOrdemServicoDto;
      
      if (numero_os) {
        console.warn('[OrdensServicoService] Tentativa de editar numero_os ignorada. Campo é auto-gerado.');
      }

      // Atualizar usando service role (bypassa RLS)
      const { data, error } = await this.supabaseService.client
        .from('ordens_servico')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[OrdensServicoService] Erro do Supabase:', error);
        // Erro de constraint de datas
        if (error.code === '23514' && error.message.includes('ordens_servico_datas_logicas')) {
          throw new Error('Datas inválidas: data_inicio deve ser >= data_abertura e data_fim deve ser >= data_inicio');
        }
        // Erro de constraint de status
        if (error.code === '23514' && error.message.includes('ordens_servico_status_check')) {
          throw new Error('Status inválido: status "agendado" requer data_programada, status "em_andamento" requer data_inicio, status "concluido" requer data_fim');
        }
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string, accessToken?: string) {
    if (!accessToken) {
      throw new ForbiddenException('Token de autenticação não fornecido');
    }

    // Obter perfil do usuário
    const { profile } = await this.getUserProfile(accessToken);
    const empresaAtiva = this.getActiveEmpresaId(profile);

    // Buscar OS usando service role (bypassa RLS)
    const { data: os, error: osError } = await this.supabaseService.client
      .from('ordens_servico')
      .select('*')
      .eq('id', id)
      .single();

    if (osError || !os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    // Validar que a OS pertence à empresa do usuário
    if (os.empresa_id !== empresaAtiva) {
      throw new ForbiddenException('Você não tem permissão para deletar esta OS');
    }

    // Apenas admins podem deletar OSs
    if (!this.isAdmin(profile)) {
      throw new ForbiddenException('Apenas administradores podem deletar ordens de serviço');
    }

    // Deletar usando service role (bypassa RLS)
    const { error } = await this.supabaseService.client
      .from('ordens_servico')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Ordem de serviço removida com sucesso' };
  }

  async finalize(
    id: string, 
    data: { 
      assinatura_cliente: string; 
      nome_cliente_assinatura: string; 
      email_cliente_assinatura?: string 
    }, 
    accessToken?: string
  ) {
    try {
      
      if (!accessToken) {
        throw new ForbiddenException('Token de autenticação não fornecido');
      }

      // Obter perfil do usuário
      const { profile } = await this.getUserProfile(accessToken);
      const empresaAtiva = this.getActiveEmpresaId(profile);

      // Buscar OS usando service role (bypassa RLS)
      const { data: os, error: osError } = await this.supabaseService.client
        .from('ordens_servico')
        .select('*')
        .eq('id', id)
        .single();

      if (osError || !os) {
        throw new NotFoundException('Ordem de serviço não encontrada');
      }

      // Validar que a OS pertence à empresa do usuário
      if (os.empresa_id !== empresaAtiva) {
        throw new ForbiddenException('Você não tem permissão para finalizar esta OS');
      }

      // Validar que a OS tem um técnico atribuído
      if (!os.tecnico_id) {
        throw new ForbiddenException('Esta OS não possui técnico atribuído. É necessário aceitar a OS antes de finalizá-la.');
      }

      // Validar que apenas técnicos com a OS atribuída ou admins podem finalizar
      if (!this.isAdmin(profile)) {
        // Se não for admin, deve ser técnico com a OS atribuída
        if (profile.active_role !== 'tecnico' || os.tecnico_id !== profile.tecnico_id) {
          throw new ForbiddenException('Apenas o técnico responsável pode finalizar esta OS');
        }
      }

      // Atualizar usando service role (bypassa RLS)
      const { data: updatedOS, error } = await this.supabaseService.client
        .from('ordens_servico')
        .update({
          status: 'concluido',
          data_fim: new Date().toISOString(),
          assinatura_cliente: data.assinatura_cliente,
          nome_cliente_assinatura: data.nome_cliente_assinatura,
          email_cliente_assinatura: data.email_cliente_assinatura || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedOS;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar laudo da ordem de serviço
   */
  async getLaudo(osId: string, accessToken: string) {
    try {
      const { profile } = await this.getUserProfile(accessToken);
      const empresaId = this.getActiveEmpresaId(profile);

      const { data, error } = await this.supabaseService.client
        .from('os_laudos')
        .select('*')
        .eq('os_id', osId)
        .eq('empresa_id', empresaId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      return data || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Criar laudo para ordem de serviço
   */
  async createLaudo(
    osId: string,
    data: { o_que_foi_feito?: string; observacao?: string; empresa_id: string },
    accessToken: string
  ) {
    try {
      const { profile } = await this.getUserProfile(accessToken);

      const { data: laudo, error } = await this.supabaseService.client
        .from('os_laudos')
        .insert({
          os_id: osId,
          empresa_id: data.empresa_id,
          o_que_foi_feito: data.o_que_foi_feito,
          observacao: data.observacao
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return laudo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar laudo da ordem de serviço
   */
  async updateLaudo(
    laudoId: string,
    data: { o_que_foi_feito?: string; observacao?: string },
    accessToken: string
  ) {
    try {
      const { profile } = await this.getUserProfile(accessToken);

      const { data: laudo, error } = await this.supabaseService.client
        .from('os_laudos')
        .update({
          o_que_foi_feito: data.o_que_foi_feito,
          observacao: data.observacao
        })
        .eq('id', laudoId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return laudo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar histórico de status da ordem de serviço
   */
  async getHistory(osId: string, accessToken: string) {
    try {
      const { profile } = await this.getUserProfile(accessToken);

      const { data, error } = await this.supabaseService.client
        .from('os_status_history')
        .select('*')
        .eq('os_id', osId)
        .order('changed_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }
}
