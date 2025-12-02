import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getProfileByUserId(userId: string, token?: string) {
    const client = token 
      ? this.supabaseService.createUserClient(token)
      : this.supabaseService.client;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateProfile(userId: string, updates: any, token?: string) {
    const client = token 
      ? this.supabaseService.createUserClient(token)
      : this.supabaseService.client;
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async listProfiles(empresaId?: string, token?: string) {
    const client = token 
      ? this.supabaseService.createUserClient(token)
      : this.supabaseService.client;
    let query = client.from('profiles').select('*');
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }
}
