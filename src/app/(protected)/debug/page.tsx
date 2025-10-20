import DebugLayout from '../debug-layout'

export default function DebugPage() {
  return (
    <DebugLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug - Autenticação</h1>
          <p className="text-muted-foreground">
            Página para debug da autenticação
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800">✅ Autenticado!</h2>
          <p className="text-green-700">
            Se você está vendo esta página, a autenticação está funcionando.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800">🔧 Informações</h2>
          <p className="text-blue-700">
            Esta página usa um layout de debug que mostra informações detalhadas sobre o processo de autenticação.
          </p>
        </div>
      </div>
    </DebugLayout>
  )
}
