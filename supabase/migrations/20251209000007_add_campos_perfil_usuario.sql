-- Migration: Adiciona campos de perfil em profiles
-- Date: 2025-12-09
-- Adiciona telefone e whatsapp_numero para cadastro de usuário

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS whatsapp_numero text;

COMMENT ON COLUMN public.profiles.telefone IS 'Telefone principal do usuário';
COMMENT ON COLUMN public.profiles.whatsapp_numero IS 'Número do WhatsApp do usuário';
