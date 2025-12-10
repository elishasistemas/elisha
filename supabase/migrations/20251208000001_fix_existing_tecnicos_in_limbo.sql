-- Migration: Fix existing técnicos in limbo (tecnico_id NULL)
-- Date: 2025-12-08
-- Description: Vincula profiles com active_role='tecnico' aos seus colaboradores correspondentes

DO $$
DECLARE
  v_profile RECORD;
  v_colaborador_id uuid;
  v_fixed_count integer := 0;
BEGIN
  RAISE NOTICE 'Iniciando correção de técnicos no limbo...';

  -- Buscar todos os profiles com active_role='tecnico' mas tecnico_id NULL
  FOR v_profile IN 
    SELECT p.user_id, p.empresa_id, p.nome
    FROM profiles p
    WHERE p.active_role = 'tecnico' 
      AND p.tecnico_id IS NULL
  LOOP
    RAISE NOTICE 'Profile encontrado: user_id=%, empresa_id=%, nome=%', 
      v_profile.user_id, v_profile.empresa_id, v_profile.nome;

    -- Tentar encontrar colaborador correspondente
    SELECT id INTO v_colaborador_id
    FROM colaboradores
    WHERE empresa_id = v_profile.empresa_id
      AND user_id = v_profile.user_id
    LIMIT 1;

    IF v_colaborador_id IS NOT NULL THEN
      -- Colaborador existe, vincular
      UPDATE profiles
      SET tecnico_id = v_colaborador_id
      WHERE user_id = v_profile.user_id;

      v_fixed_count := v_fixed_count + 1;
      RAISE NOTICE '✅ Profile vinculado ao colaborador existente: %', v_colaborador_id;
    ELSE
      -- Colaborador não existe, criar
      INSERT INTO colaboradores (
        empresa_id,
        user_id,
        nome,
        whatsapp_numero,
        ativo,
        created_at
      )
      VALUES (
        v_profile.empresa_id,
        v_profile.user_id,
        COALESCE(v_profile.nome, 'Técnico'),
        NULL, -- WhatsApp será preenchido depois
        true,
        now()
      )
      RETURNING id INTO v_colaborador_id;

      -- Vincular
      UPDATE profiles
      SET tecnico_id = v_colaborador_id
      WHERE user_id = v_profile.user_id;

      v_fixed_count := v_fixed_count + 1;
      RAISE NOTICE '✅ Colaborador criado e profile vinculado: %', v_colaborador_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Correção concluída! Total de técnicos corrigidos: %', v_fixed_count;
END $$;
