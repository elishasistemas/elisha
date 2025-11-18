/**
 * Configurações de internacionalização para português brasileiro (pt-BR)
 * Este arquivo centraliza todas as strings da interface para garantir consistência
 */

export const locale = 'pt-BR' as const

export const ui = {
  // Navegação e Layout
  app: {
    title: 'Elisha - Sistema de Gestão',
    description: 'Sistema de gestão completo para empresas brasileiras',
    tagline: 'Desenvolvido especificamente para o mercado brasileiro',
  },

  // Autenticação
  auth: {
    login: {
      title: 'Entrar na Elisha',
      description: 'Acesse sua conta usando',
      emailPassword: 'email e senha',
      magicLink: 'link mágico por email',
      switchToEmailPassword: 'Usar email e senha',
      switchToMagicLink: 'Usar link mágico por email',
    },
    signIn: {
      emailLabel: 'Email',
      passwordLabel: 'Senha',
      buttonLabel: 'Entrar',
      loadingButtonLabel: 'Entrando...',
      socialProviderText: 'Entrar com {{provider}}',
      linkText: 'Já tem uma conta? Entrar',
      emailPlaceholder: 'Digite seu email',
      passwordPlaceholder: 'Digite sua senha',
    },
    signUp: {
      emailLabel: 'Email',
      passwordLabel: 'Senha',
      buttonLabel: 'Criar conta',
      loadingButtonLabel: 'Criando conta...',
      socialProviderText: 'Criar conta com {{provider}}',
      linkText: 'Não tem uma conta? Criar conta',
      emailPlaceholder: 'Digite seu email',
      passwordPlaceholder: 'Digite sua senha',
      confirmPasswordLabel: 'Confirmar senha',
      confirmPasswordPlaceholder: 'Confirme sua senha',
    },
    magicLink: {
      emailLabel: 'Email',
      buttonLabel: 'Enviar link mágico',
      loadingButtonLabel: 'Enviando link...',
      linkText: 'Enviar link mágico por email',
      emailPlaceholder: 'Digite seu email',
    },
    forgotPassword: {
      emailLabel: 'Email',
      buttonLabel: 'Enviar instruções',
      loadingButtonLabel: 'Enviando instruções...',
      linkText: 'Esqueceu sua senha?',
      emailPlaceholder: 'Digite seu email',
    },
    updatePassword: {
      passwordLabel: 'Nova senha',
      passwordPlaceholder: 'Digite sua nova senha',
      buttonLabel: 'Atualizar senha',
      loadingButtonLabel: 'Atualizando senha...',
      confirmPasswordLabel: 'Confirmar nova senha',
      confirmPasswordPlaceholder: 'Confirme sua nova senha',
    },
  },

  // Página inicial
  home: {
    welcome: 'Bem-vindo ao',
    description: 'Sistema de gestão completo para empresas brasileiras. Gerencie clientes, equipamentos, ordens de serviço e muito mais.',
    features: {
      clients: {
        title: 'Clientes',
        description: 'Gerencie informações de clientes e contratos',
        details: 'Cadastre clientes, mantenha dados atualizados e acompanhe contratos.',
      },
      equipment: {
        title: 'Equipamentos',
        description: 'Controle de equipamentos e inventário',
        details: 'Registre equipamentos, histórico de manutenção e status operacional.',
      },
      serviceOrders: {
        title: 'Ordens de Serviço',
        description: 'Gestão completa de serviços técnicos',
        details: 'Crie, acompanhe e finalize ordens de serviço com checklists personalizados.',
      },
      collaborators: {
        title: 'Colaboradores',
        description: 'Gestão de equipe técnica',
        details: 'Organize sua equipe, defina funções e acompanhe performance.',
      },
      reports: {
        title: 'Relatórios',
        description: 'Relatórios e análises detalhadas',
        details: 'Gere relatórios PDF, acompanhe métricas e tome decisões baseadas em dados.',
      },
      feedback: {
        title: 'Feedbacks',
        description: 'Avaliação de serviços',
        details: 'Colete feedbacks dos clientes e melhore continuamente seus serviços.',
      },
    },
    actions: {
      enterSystem: 'Entrar no Sistema',
      learnMore: 'Saiba Mais',
    },
  },

  // Botões e ações comuns
  actions: {
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
    create: 'Criar',
    update: 'Atualizar',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    print: 'Imprimir',
    download: 'Baixar',
    upload: 'Enviar',
    confirm: 'Confirmar',
    close: 'Fechar',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
    submit: 'Enviar',
    reset: 'Limpar',
    loading: 'Carregando...',
    processing: 'Processando...',
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Aviso',
    info: 'Informação',
  },

  // Mensagens comuns
  messages: {
    success: {
      saved: 'Salvo com sucesso!',
      updated: 'Atualizado com sucesso!',
      deleted: 'Excluído com sucesso!',
      created: 'Criado com sucesso!',
    },
    error: {
      generic: 'Ocorreu um erro inesperado',
      network: 'Erro de conexão',
      validation: 'Dados inválidos',
      unauthorized: 'Acesso não autorizado',
      forbidden: 'Acesso negado',
      notFound: 'Não encontrado',
    },
    validation: {
      required: 'Este campo é obrigatório',
      email: 'Digite um email válido',
      minLength: 'Mínimo de {{min}} caracteres',
      maxLength: 'Máximo de {{max}} caracteres',
      phone: 'Digite um telefone válido',
      cnpj: 'Digite um CNPJ válido',
      cpf: 'Digite um CPF válido',
    },
  },

  // Formatação de data e hora
  dateTime: {
    format: 'DD/MM/YYYY',
    formatWithTime: 'DD/MM/YYYY HH:mm',
    months: [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ],
    monthsShort: [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ],
    weekdays: [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ],
    weekdaysShort: [
      'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'
    ],
  },

  // Moeda brasileira
  currency: {
    symbol: 'R$',
    code: 'BRL',
    format: 'currency',
  },

  // Dashboard e Sidebar
  dashboard: {
    title: 'Dashboard',
    overview: 'Visão Geral',
    loading: 'Carregando...',
    stats: {
      osAbertas: 'OS Abertas',
      emAndamento: 'Em Andamento',
      concluidas: 'Concluídas',
      osAbertasDescription: 'Ordens de serviço novas',
      emAndamentoDescription: 'Ordens em execução',
      concluidasDescription: 'Ordens finalizadas',
    },
    recentOrders: 'Ordens de Serviço Recentes',
    recentOrdersDescription: 'Últimas ordens de serviço criadas no sistema',
    table: {
      id: 'ID',
      cliente: 'Cliente',
      tecnico: 'Técnico',
      status: 'Status',
      createdAt: 'Criada em',
    },
    status: {
      novo: 'Nova',
      emAndamento: 'Em Andamento',
      concluido: 'Concluída',
      cancelado: 'Cancelada',
    },
  },

  // Sidebar
  sidebar: {
    appName: 'Elisha',
    appDescription: 'Sistema de Gestão',
    dashboard: {
      title: 'Dashboard',
      description: 'Dashboard principal',
    },
    management: {
      title: 'Gestão',
      clients: {
        title: 'Clientes',
        description: 'Gerenciar clientes',
      },
      equipment: {
        title: 'Equipamentos',
        description: 'Controle de inventário',
      },
      collaborators: {
        title: 'Colaboradores',
        description: 'Equipe técnica',
      },
    },
    serviceOrders: {
      title: 'Ordens de Serviço',
      all: {
        title: 'Todas as OS',
        description: 'Lista completa',
      },
      open: {
        title: 'OS Abertas',
        description: 'Novas ordens',
      },
      inProgress: {
        title: 'Em Andamento',
        description: 'Em execução',
      },
    },
    reports: {
      title: 'Relatórios',
      reports: {
        title: 'Relatórios',
        description: 'Análises e métricas',
      },
      feedback: {
        title: 'Feedbacks',
        description: 'Avaliações',
      },
    },
    newOrder: 'Nova OS',
  },

  // Header
  header: {
    breadcrumb: {
      dashboard: 'Dashboard',
      overview: 'Visão Geral',
    },
  },
} as const

export type UIKeys = typeof ui
