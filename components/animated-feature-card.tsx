'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface AnimatedFeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
}

export function AnimatedFeatureCard({ icon: Icon, title, description, delay = 0 }: AnimatedFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10, scale: 1.02 }}
    >
      <Card className="bg-slate-900/50 backdrop-blur-md border-white/10 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 h-full">
        <CardHeader>
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="mb-2 h-10 w-10 text-cyan-400" />
          </motion.div>
          <CardTitle className="text-white">{title}</CardTitle>
          <CardDescription className="text-gray-400">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  )
}
