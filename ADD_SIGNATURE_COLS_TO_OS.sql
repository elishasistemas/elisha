-- Adicionar colunas de assinatura e e-mail na tabela ordens_servico
ALTER TABLE ordens_servico
ADD COLUMN IF NOT EXISTS assinatura_cliente text,
ADD COLUMN IF NOT EXISTS nome_cliente_assinatura text,
ADD COLUMN IF NOT EXISTS email_cliente_assinatura text;

-- Adicionar comentários para documentação (opcional)
COMMENT ON COLUMN ordens_servico.assinatura_cliente IS 'URL ou Base64 da assinatura do cliente';
COMMENT ON COLUMN ordens_servico.nome_cliente_assinatura IS 'Nome legível do responsável que assinou';
COMMENT ON COLUMN ordens_servico.email_cliente_assinatura IS 'E-mail do responsável para envio do comprovante';
