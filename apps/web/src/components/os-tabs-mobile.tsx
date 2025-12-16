'use client'

import { useState, useEffect } from 'react'
import { FileText, Wrench, CheckCircle } from 'lucide-react'

interface OSTabsWrapperProps {
  children: React.ReactNode
  sections: Array<{
    title: string
    icon: any
    content: React.ReactNode
  }>
}

export function OSTabsWrapper({ sections }: OSTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile: renderizar tabs
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex border-b bg-background sticky top-0 z-10 shadow-sm">
          {sections.map((section, index) => {
            const Icon = section.icon
            const isActive = activeTab === index
            return (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{section.title}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sections[activeTab].content}
        </div>
      </div>
    )
  }

  // Desktop: renderizar timeline vertical (todas as seções)
  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <div key={index}>
          {section.content}
        </div>
      ))}
    </div>
  )
}
