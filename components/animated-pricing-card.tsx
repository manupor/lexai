'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AnimatedPricingCardProps {
  title: string
  description: string
  price: string | number
  priceLabel: string
  features: string[]
  ctaText: string
  featured?: boolean
  delay?: number
}

export function AnimatedPricingCard({ 
  title, 
  description, 
  price, 
  priceLabel,
  features, 
  ctaText, 
  featured = false,
  delay = 0 
}: AnimatedPricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10, scale: 1.02 }}
    >
      <Card className={`bg-slate-900/50 backdrop-blur-md border-white/10 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 h-full ${
        featured ? 'border-cyan-400/50 shadow-lg shadow-cyan-500/30' : ''
      }`}>
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
          <CardDescription className="text-gray-400">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <span className="text-4xl font-bold text-white">{price}</span>
            <span className="text-gray-400">{priceLabel}</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-300 mb-6">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: delay + (index * 0.1) }}
              >
                ✓ {feature}
              </motion.li>
            ))}
          </ul>
          <Link href="/login" className="block">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                className={`mt-6 w-full ${
                  featured 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/50' 
                    : 'bg-slate-800 hover:bg-slate-700 border-white/10'
                }`}
                variant={featured ? 'default' : 'outline'}
              >
                {ctaText}
              </Button>
            </motion.div>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
