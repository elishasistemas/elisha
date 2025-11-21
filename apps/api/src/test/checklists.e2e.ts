import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { SupabaseService } from '../supabase/supabase.service';

describe('Checklists (e2e)', () => {
  let app: INestApplication;
  let supabaseService: SupabaseService;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    supabaseService = moduleRef.get<SupabaseService>(SupabaseService);

    // Login via Supabase using anon key and credentials from env
    const email = process.env.TEST_SUPABASE_EMAIL || 'fpsjunior87@gmail.com';
    const password = process.env.TEST_SUPABASE_PASSWORD || 'Fernando,^^13';
    const { data, error } = await supabaseService.client.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw new Error('Falha ao autenticar no Supabase para rodar e2e: ' + String(error?.message));
    }
    token = data.session.access_token as string;
  });

  it('/api/v1/checklists (GET) should return data and count (200)', async () => {
    const swagger = await request(app.getHttpServer()).get('/api/v1/docs');
    console.log('[e2e] swagger status', swagger.status);

    const res = await request(app.getHttpServer())
      .get('/checklists')
      .query({ empresaId: '6a28d5c5-bce1-4729-a87e-1844ab48b727', limit: 10, offset: 0 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('count');
  });

  it('/checklists without prefix (GET) should return 200 when auth provided', async () => {
    const res = await request(app.getHttpServer())
      .get('/checklists')
      .query({ empresaId: '6a28d5c5-bce1-4729-a87e-1844ab48b727' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('count');
  });

  afterAll(async () => {
    await app.close();
  });
});
