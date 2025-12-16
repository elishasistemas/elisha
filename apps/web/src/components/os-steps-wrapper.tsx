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
          <TabsTrigger value="descricao">
            <FileText className="w-4 h-4" />
            Descrição
          </TabsTrigger>
          <TabsTrigger value="laudo">
            <Wrench className="w-4 h-4" />
            Laudo
          </TabsTrigger>
          <TabsTrigger value="concluir">
            <CheckCircle className="w-4 h-4" />
            Concluir
          </TabsTrigger>
          {step4 && (
            <TabsTrigger value="historico">
              <History className="w-4 h-4" />
              Histórico
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
