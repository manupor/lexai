'use client'

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Scale, FileText, MessageSquare, Shield, Sparkles, Users } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/hooks/use-language";

export default function Home() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">LexAI Costa Rica</span>
          </div>
          <nav className="flex items-center gap-4">
            <LanguageToggle />
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">{t.dashboard.title}</Button>
                </Link>
                <Link href="/dashboard">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {getInitials(session.user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">{t.home.cta}</Button>
                </Link>
                <Link href="/login">
                  <Button>{t.home.cta}</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900">
              <Sparkles className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 dark:text-white md:text-6xl">
            {t.home.title}
          </h1>
          <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
            {t.home.subtitle}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg" asChild>
                <Link href="/login">{t.home.cta}</Link>
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg">
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
          {t.home.features.title}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <MessageSquare className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>{t.home.features.chat.title}</CardTitle>
              <CardDescription>
                {t.home.features.chat.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>{t.home.features.analysis.title}</CardTitle>
              <CardDescription>
                {t.home.features.analysis.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>Generación de Apelaciones</CardTitle>
              <CardDescription>
                Crea apelaciones y opiniones legales fundamentadas en la legislación vigente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Scale className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>Base Legal Completa</CardTitle>
              <CardDescription>
                Acceso a todas las leyes de Costa Rica: Civil, Penal, Tránsito, Laboral y más
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>Para Abogados y Clientes</CardTitle>
              <CardDescription>
                Interfaz adaptada tanto para profesionales del derecho como para clientes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>Sistema de Tokens</CardTitle>
              <CardDescription>
                Planes flexibles con tokens para acceder a las funcionalidades según tus necesidades
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Planes y Precios
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Gratis</CardTitle>
              <CardDescription>Para probar la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold">100</span>
                <span className="text-gray-600"> tokens/mes</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Consultas básicas</li>
                <li>✓ Búsqueda en leyes</li>
                <li>✓ 5 análisis de documentos</li>
              </ul>
              <Link href="/login" className="block">
                <Button className="mt-6 w-full" variant="outline">Comenzar</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-600 border-2">
            <CardHeader>
              <CardTitle>Profesional</CardTitle>
              <CardDescription>Para abogados independientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-600">/mes</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ 5,000 tokens/mes</li>
                <li>✓ Análisis ilimitados</li>
                <li>✓ Generación de documentos</li>
                <li>✓ Soporte prioritario</li>
              </ul>
              <Link href="/login" className="block">
                <Button className="mt-6 w-full">Suscribirse</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empresa</CardTitle>
              <CardDescription>Para bufetes y equipos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-gray-600">/mes</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ 25,000 tokens/mes</li>
                <li>✓ Usuarios ilimitados</li>
                <li>✓ API personalizada</li>
                <li>✓ Soporte dedicado</li>
              </ul>
              <Link href="/login" className="block">
                <Button className="mt-6 w-full" variant="outline">Contactar</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 LexAI Costa Rica. Todos los derechos reservados.</p>
          <p className="mt-2 text-sm">
            Diseñado por{' '}
            <a 
              href="https://manuportuguez.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Manu Portuguez
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
