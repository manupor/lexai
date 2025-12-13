"use client"

import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceModeToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
}

export function VoiceModeToggle({ enabled, onToggle, disabled = false }: VoiceModeToggleProps) {
  return (
    <Button
      type="button"
      variant={enabled ? "default" : "outline"}
      size="icon"
      onClick={() => onToggle(!enabled)}
      disabled={disabled}
      className={cn(
        "transition-all",
        enabled && "bg-green-600 hover:bg-green-700"
      )}
      title={enabled ? "Desactivar respuestas por voz" : "Activar respuestas por voz"}
    >
      {enabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
    </Button>
  )
}
