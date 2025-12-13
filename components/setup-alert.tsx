"use client"

import { AlertCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SetupAlert() {
  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div>
            <CardTitle className="text-yellow-900 dark:text-yellow-100">
              Configuración Requerida
            </CardTitle>
            <CardDescription className="text-yellow-800 dark:text-yellow-200">
              Para usar el chat, necesitas configurar tu API key de OpenAI
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-yellow-900 dark:text-yellow-100">
          <p className="font-semibold">Pasos rápidos:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Obtén tu API key en OpenAI</li>
            <li>Edita el archivo <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">.env</code></li>
            <li>Agrega tu key en <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">OPENAI_API_KEY</code></li>
            <li>Reinicia el servidor</li>
          </ol>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Obtener API Key
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Abrir el archivo de configuración en el IDE (si es posible)
              alert('Edita el archivo .env en la raíz del proyecto y agrega tu OPENAI_API_KEY')
            }}
          >
            Ver Instrucciones
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
