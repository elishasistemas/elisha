/**
 * Tradução de mensagens de erro do Supabase Auth para PT-BR
 */

interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export function translateAuthErrorMessage(error: AuthError | string): string {
  const message = typeof error === 'string' ? error : error.message;

  const translations: Record<string, string> = {
    // Auth errors
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada',
    'User already registered': 'Este email já está cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'User not found': 'Usuário não encontrado',
    'Invalid email': 'Email inválido',
    'Invalid password': 'Senha inválida',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos',
    'Invalid credentials': 'Credenciais inválidas',
    'User not authenticated': 'Usuário não autenticado',
    'Session expired': 'Sessão expirada. Faça login novamente',
    'Token expired': 'Token expirado',
    'Invalid token': 'Token inválido',
    'Signup requires a valid password': 'Cadastro requer uma senha válida',
    'Email link is invalid or has expired': 'Link de email inválido ou expirado',
    'Unable to validate email address: invalid format': 'Email em formato inválido',
    'Password is too weak': 'Senha muito fraca',
    'Email address is invalid': 'Endereço de email inválido',
    'Passwords do not match': 'As senhas não conferem',
    'New password should be different from the old password': 'A nova senha deve ser diferente da senha antiga',
    
    // Network errors
    'Failed to fetch': 'Erro de conexão. Verifique sua internet',
    'Network request failed': 'Falha na requisição. Tente novamente',
    
    // Invite errors
    'Invalid or already used token': 'Convite inválido ou já utilizado',
    'Invite expired': 'Convite expirado',
    'Invite not found': 'Convite não encontrado',
  };

  // Procurar tradução exata
  if (translations[message]) {
    return translations[message];
  }

  // Procurar por partes da mensagem
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Se não encontrar tradução, retornar mensagem original
  return message || 'Erro desconhecido';
}
