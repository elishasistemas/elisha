import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
    async getUserRoles(userId: string, accessToken?: string) {
      try {
        const client = accessToken
          ? this.supabaseService.createUserClient(accessToken)
          : this.supabaseService.client

        const { data, error } = await client
          .from('profiles')
          .select('active_role,roles')
          .eq('user_id', userId)
          .single();

        if (error) {
          throw new NotFoundException('Usuário não encontrado');
        }

        return data;
      } catch (error) {
        throw new NotFoundException('Erro ao buscar roles do usuário');
      }
    }
  constructor(private readonly supabaseService: SupabaseService) {}

  async getCurrentUser(userId: string, accessToken?: string) {
    try {
      const client = accessToken
        ? this.supabaseService.createUserClient(accessToken)
        : this.supabaseService.client

      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return data;
    } catch (error) {
      throw new NotFoundException('Erro ao buscar usuário');
    }
  }

  async getUser(userId: string, accessToken?: string) {
    try {
      const client = accessToken
        ? this.supabaseService.createUserClient(accessToken)
        : this.supabaseService.client

      const { data, error } = await client
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return data;
    } catch (error) {
      throw new NotFoundException('Erro ao buscar usuário');
    }
  }

  async getAllUsers(accessToken?: string) {
    try {
      const client = accessToken
        ? this.supabaseService.createUserClient(accessToken)
        : this.supabaseService.client

      const { data, error } = await client
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Erro ao buscar usuários');
      }

      return data;
    } catch (error) {
      throw new Error('Erro ao buscar usuários');
    }
  }
}