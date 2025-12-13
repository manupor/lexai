'use client'

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Scale, FileText, MessageSquare, Shield, Sparkles, Users } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/hooks/use-language";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const [scrollY, setScrollY] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="border-b border-white/10 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="container mx-auto px-4 py-20 text-center relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
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
                {t.home.demo}
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
              <CardTitle>{t.home.features.appeals.title}</CardTitle>
              <CardDescription>
                {t.home.features.appeals.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Scale className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>{t.home.features.complete.title}</CardTitle>
              <CardDescription>
                {t.home.features.complete.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>{t.home.features.clients.title}</CardTitle>
              <CardDescription>
                {t.home.features.clients.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="mb-2 h-10 w-10 text-blue-600" />
              <CardTitle>{t.home.features.tokens.title}</CardTitle>
              <CardDescription>
                {t.home.features.tokens.description}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
          {t.home.pricing.title}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t.home.pricing.free.title}</CardTitle>
              <CardDescription>{t.home.pricing.free.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold">100</span>
                <span className="text-gray-600"> {t.home.pricing.free.tokens}</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ {t.home.pricing.free.feature1}</li>
                <li>✓ {t.home.pricing.free.feature2}</li>
                <li>✓ 5 {t.home.pricing.free.feature3}</li>
              </ul>
              <Link href="/login" className="block">
                <Button className="mt-6 w-full" variant="outline">{t.home.pricing.free.cta}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-600 border-2">
            <CardHeader>
              <CardTitle>{t.home.pricing.professional.title}</CardTitle>
              <CardDescription>{t.home.pricing.professional.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-600">{t.home.pricing.professional.price}</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ 5,000 {t.home.pricing.professional.feature1}</li>
                <li>✓ {t.home.pricing.professional.feature2}</li>
                <li>✓ {t.home.pricing.professional.feature3}</li>
                <li>✓ {t.home.pricing.professional.feature4}</li>
              </ul>
              <Link href="/login" className="block">
                <Button className="mt-6 w-full">{t.home.pricing.professional.cta}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.home.pricing.enterprise.title}</CardTitle>
              <CardDescription>{t.home.pricing.enterprise.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-gray-600">{t.home.pricing.enterprise.price}</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ 25,000 {t.home.pricing.enterprise.feature1}</li>
                <li>✓ {t.home.pricing.enterprise.feature2}</li>
                <li>✓ {t.home.pricing.enterprise.feature3}</li>
                <li>✓ {t.home.pricing.enterprise.feature4}</li>
              </ul>
              <Link href="/login" className="block">
                <Button className="mt-6 w-full" variant="outline">{t.home.pricing.enterprise.cta}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 LexAI Costa Rica. {t.home.footer.rights}</p>
          <p className="mt-2 text-sm">
            {t.home.footer.designedBy}{' '}
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
