'use client'

export default function SettingsSimplePage() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full py-16 ">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações - Teste</h1>
        <p className="text-muted-foreground">
          Página de teste para verificar se o roteamento está funcionando
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800">✅ Página Funcionando!</h2>
        <p className="text-green-700">
          Se você está vendo esta página, o roteamento está funcionando corretamente.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800">🔧 Próximos Passos</h2>
        <ul className="text-blue-700 list-disc list-inside space-y-1">
          <li>Verificar se o usuário está autenticado</li>
          <li>Carregar dados da empresa</li>
          <li>Implementar upload de logo</li>
        </ul>
      </div>
    </div>
  )
}
