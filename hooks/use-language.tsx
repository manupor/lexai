'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import es from '@/messages/es.json'
import en from '@/messages/en.json'

type Locale = 'es' | 'en'

interface LanguageStore {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: any
}

const messages = { es, en }

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      locale: 'es',
      setLocale: (locale: Locale) => set({ locale }),
      get t() {
        const locale = get().locale
        return messages[locale]
      }
    }),
    {
      name: 'language-storage',
    }
  )
)
