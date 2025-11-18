export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground">Verifique a URL ou volte ao painel.</p>
        <a href="/dashboard" className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm mt-2">
          Ir para o Dashboard
        </a>
      </div>
    </div>
  )
}

