'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import es from '@/messages/es.json'
import en from '@/messages/en.json'
import { useEffect, useState } from 'react'

type Locale = 'es' | 'en'

interface LanguageStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const messages = { es, en }

const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale: Locale) => set({ locale }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Hook que maneja la hidratación correctamente
export const useLanguage = () => {
  const locale = useLanguageStore((state) => state.locale)
  const setLocale = useLanguageStore((state) => state.setLocale)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mientras no esté montado, usar español por defecto
  const currentLocale = mounted ? locale : 'es'
  
  return {
    locale: currentLocale,
    setLocale,
    t: messages[currentLocale]
  }
}
