import es from '@/messages/es.json'
import en from '@/messages/en.json'

export type Locale = 'es' | 'en'

const messages = {
  es,
  en
}

export function getMessages(locale: Locale) {
  return messages[locale] || messages.es
}

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith('/en')) {
    return 'en'
  }
  return 'es'
}
