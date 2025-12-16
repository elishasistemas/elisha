'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { FileText, Wrench, CheckCircle, History } from 'lucide-react'

interface OSStepsWrapperProps {
  step1: React.ReactNode
  step2: React.ReactNode
  step3: React.ReactNode
  step4?: React.ReactNode // Histórico (opcional)
}

export function OSStepsWrapper({ step1, step2, step3, step4 }: OSStepsWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile: renderizar com tabs
  if (isMobile) {
    return (
      <Tabs defaultValue="descricao" className="w-full">
        <TabsList className={`grid w-full ${step4 ? 'grid-cols-4' : 'grid-cols-3'} sticky top-0 z-10 bg-background`}>
          <TabsTrigger value="descricao" className="flex flex-col items-center gap-1 text-xs">
            <FileText className="w-4 h-4" />
            <span>Descrição</span>
          </TabsTrigger>
          <TabsTrigger value="laudo" className="flex flex-col items-center gap-1 text-xs">
            <Wrench className="w-4 h-4" />
            <span>Laudo</span>
          </TabsTrigger>
          <TabsTrigger value="concluir" className="flex flex-col items-center gap-1 text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Concluir</span>
          </TabsTrigger>
          {step4 && (
            <TabsTrigger value="historico" className="flex flex-col items-center gap-1 text-xs">
              <History className="w-4 h-4" />
              <span>Histórico</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="descricao" className="mt-4">
          {step1}
        </TabsContent>

        <TabsContent value="laudo" className="mt-4">
          {step2}
        </TabsContent>

        <TabsContent value="concluir" className="mt-4">
          {step3}
        </TabsContent>

        {step4 && (
          <TabsContent value="historico" className="mt-4">
            {step4}
          </TabsContent>
        )}
      </Tabs>
    )
  }

  // Desktop: renderizar timeline vertical (todas as seções visíveis)
  return (
    <div className="space-y-6">
      {step1}
      {step2}
      {step3}
      {step4}
    </div>
  )
}
