'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { FileText, CheckCircle2, AlertCircle, History } from 'lucide-react'

interface OSStepsWrapperProps {
  step1: React.ReactNode
  step2: React.ReactNode
  step3: React.ReactNode
  step4?: React.ReactNode // Histórico (opcional)
}

export function OSStepsWrapper({ step1, step2, step3, step4 }: OSStepsWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('descricao')

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Evita hydration mismatch renderizando versão desktop no servidor
  if (!mounted) {
    return (
      <div className="space-y-6">
        {step1}
        {step2}
        {step3}
        {step4}
      </div>
    )
  }

  // Mobile: renderizar com tabs
  if (isMobile) {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="pt-0 h-[57px] overflow-hidden rounded-[20px]">
          <TabsList className={`grid w-full ${step4 ? 'grid-cols-4' : 'grid-cols-3'} h-[65px] p-1.5 pb-0 bg-[#EBEEF2] rounded-[20px]`}>
            <TabsTrigger
              value="descricao"
              className="flex flex-col items-center gap-1 py-2.5 pb-6 px-2 rounded-t-[15px] rounded-b-none border-b-0 data-[state=active]:!bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#6B7280] data-[state=active]:text-[#374151] transition-all"
            >
              <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">Checklist</span>
            </TabsTrigger>
            <TabsTrigger
              value="laudo"
              className="flex flex-col items-center gap-1 py-2.5 pb-6 px-2 rounded-t-[15px] rounded-b-none border-b-0 data-[state=active]:!bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#6B7280] data-[state=active]:text-[#374151] transition-all"
            >
              <FileText className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">Observação</span>
            </TabsTrigger>
            <TabsTrigger
              value="concluir"
              className="flex flex-col items-center gap-1 py-2.5 pb-6 px-2 rounded-t-[15px] rounded-b-none border-b-0 data-[state=active]:!bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#6B7280] data-[state=active]:text-[#374151] transition-all"
            >
              <AlertCircle className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">Concluir</span>
            </TabsTrigger>
            {step4 && (
              <TabsTrigger
                value="historico"
                className="flex flex-col items-center gap-1 py-2.5 pb-6 px-2 rounded-t-[15px] rounded-b-none border-b-0 data-[state=active]:!bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#6B7280] data-[state=active]:text-[#374151] transition-all"
              >
                <FileText className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-xs font-medium">Histórico</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="descricao" className="mt-4 overflow-x-hidden">
          {step1}
        </TabsContent>

        <TabsContent value="laudo" className="mt-4 overflow-x-hidden">
          {step2}
        </TabsContent>

        <TabsContent value="concluir" className="mt-4 overflow-x-hidden">
          {step3}
        </TabsContent>

        {step4 && (
          <TabsContent value="historico" className="mt-4 overflow-x-hidden">
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
