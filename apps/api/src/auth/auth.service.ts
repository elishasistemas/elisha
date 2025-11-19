import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async login(email: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      return {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: data.user,
      };
    } catch (error) {
      throw new UnauthorizedException('Erro ao fazer login');
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const { data, error } = await this.supabaseService.client.auth.signUp({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: {
            full_name: registerDto.fullName,
          },
        },
      });

      if (error) {
        // Retorna a mensagem original do Supabase para facilitar diagnóstico
        throw new BadRequestException({ message: error.message, details: error });
      }

      return {
        user: data.user,
        message: 'Usuário criado com sucesso. Verifique seu email.',
      };
    } catch (error) {
      // Se for BadRequestException, repassa o erro original
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({ message: 'Erro ao criar usuário', details: error });
    }
  }

  async getProfile(userId: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new BadRequestException('Perfil não encontrado');
      }

      return data;
    } catch (error) {
      throw new BadRequestException('Erro ao buscar perfil');
    }
  }

  async logout(accessToken: string) {
    try {
      const userClient = this.supabaseService.createUserClient(accessToken);
      const { error } = await userClient.auth.signOut();

      if (error) {
        throw new BadRequestException('Erro ao fazer logout');
      }

      return { message: 'Logout realizado com sucesso' };
    } catch (error) {
      throw new BadRequestException('Erro ao fazer logout');
    }
  }
}