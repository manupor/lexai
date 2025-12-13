'use client'

import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage()
  
  const toggleLanguage = () => {
    setLocale(locale === 'es' ? 'en' : 'es')
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {locale === 'es' ? 'English' : 'Español'}
      </span>
    </Button>
  )
}
