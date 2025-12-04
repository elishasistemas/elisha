import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';

@Injectable()
export class OrdensServicoService {
  constructor(private readonly supabaseService: SupabaseService) {}

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
      console.log('[OrdensServicoService] Buscando OS com filtros:', {
        empresaId,
        tecnicoId,
        status,
        prioridade,
        orderBy,
        page,
        pageSize,
        search,
      });

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

      console.log('[OrdensServicoService] OS encontradas:', data?.length || 0);

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
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { data, error } = await client
      .from('ordens_servico')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createOrdemServicoDto: CreateOrdemServicoDto, accessToken?: string) {
    try {
      console.log('[OrdensServicoService] Criando OS:', createOrdemServicoDto);
      const client = accessToken
        ? this.supabaseService.createUserClient(accessToken)
        : this.supabaseService.client

      // Gerar número automático da OS no formato OS-0001-2025
      const ano = new Date().getFullYear();
      
      // Buscar a última OS da empresa no ano atual
      const { data: ultimaOS, error: ultimaOSError } = await client
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
      
      console.log('[OrdensServicoService] Número gerado:', numeroFormatado);

      // Sobrescrever o numero_os com o valor gerado
      const ordemData = {
        ...createOrdemServicoDto,
        numero_os: numeroFormatado,
      };

      const { data, error } = await client
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
      console.log('[OrdensServicoService] OS criada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('[OrdensServicoService] Erro ao criar OS:', error);
      throw error;
    }
  }

  async update(id: string, updateOrdemServicoDto: UpdateOrdemServicoDto, accessToken?: string) {
    try {
      console.log('[OrdensServicoService] Atualizando OS:', id, updateOrdemServicoDto);
      const client = accessToken
        ? this.supabaseService.createUserClient(accessToken)
        : this.supabaseService.client

      // Remover numero_os se vier no payload (campo não é editável)
      const { numero_os, ...updateData } = updateOrdemServicoDto;
      
      if (numero_os) {
        console.warn('[OrdensServicoService] Tentativa de editar numero_os ignorada. Campo é auto-gerado.');
      }

      const { data, error } = await client
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
      console.log('[OrdensServicoService] OS atualizada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('[OrdensServicoService] Erro ao atualizar OS:', error);
      throw error;
    }
  }

  async remove(id: string, accessToken?: string) {
    const client = accessToken
      ? this.supabaseService.createUserClient(accessToken)
      : this.supabaseService.client

    const { error } = await client
      .from('ordens_servico')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Ordem de serviço removida com sucesso' };
  }
}
