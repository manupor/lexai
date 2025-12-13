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
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Scale className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">LexAI Costa Rica</span>
          </motion.div>
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
          <motion.div 
            className="mb-6 flex justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 1, delay: 0.3 }}
          >
            <div className="rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 backdrop-blur-sm border border-blue-400/30 shadow-lg shadow-blue-500/50">
              <Sparkles className="h-12 w-12 text-cyan-400" />
            </div>
          </motion.div>
          <motion.h1 
            className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t.home.title}
          </motion.h1>
          <motion.p 
            className="mb-8 text-xl text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {t.home.subtitle}
          </motion.p>
          <motion.div 
            className="flex justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/50">
                  {t.home.cta}
                </Button>
              </motion.div>
            </Link>
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="border-blue-400/50 text-white hover:bg-blue-500/10">
                  {t.home.demo}
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="container mx-auto px-4 py-20 relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2 
          className="mb-12 text-center text-3xl font-bold text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {t.home.features.title}
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -10, scale: 1.02 }}
          >
            <Card className="bg-slate-900/50 backdrop-blur-md border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
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
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        className="container mx-auto px-4 py-20 relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2 
          className="mb-12 text-center text-3xl font-bold text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {t.home.pricing.title}
        </motion.h2>
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
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>&copy; 2024 LexAI Costa Rica. {t.home.footer.rights}</p>
          <p className="mt-2 text-sm">
            {t.home.footer.designedBy}{' '}
            <a 
              href="https://manuportuguez.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Manu Portuguez
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
