-- Adiciona coluna user_id na tabela colaboradores para vincular com auth.users
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_id ON public.colaboradores(user_id);

COMMENT ON COLUMN public.colaboradores.user_id IS 'Vínculo com usuário autenticado (para técnicos que têm login)';

