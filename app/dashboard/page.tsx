"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat/chat-interface"

export default function DashboardPage() {
  // En el nuevo layout, el sidebar maneja la navegación.
  // Si venimos de "Nueva Consulta", conversationId es undefined.
  // TODO: Si queremos soportar /dashboard/chat/[id], este componente debería leer params.
  // Por ahora mantenemos la funcionalidad básica de chat "home".

  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  )
}
