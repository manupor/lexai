"use client"

import { DocumentUpload } from "@/components/document-upload"

export default function DocumentsPage() {
    return (
        <div className="h-full p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Documentos Legales
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Sube y analiza tus documentos legales (Contratos, Sentencias, etc.)
                    </p>
                </div>
                <DocumentUpload />
            </div>
        </div>
    )
}
