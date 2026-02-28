"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const MATERIAS = [
    { id: "penal", label: "Penal" },
    { id: "civil", label: "Civil" },
    { id: "comercial", label: "Comercial" },
    { id: "laboral", label: "Laboral" },
    { id: "administrativo", label: "Contencioso Admin." },
    { id: "constitucional", label: "Constitucional" },
]

export interface FiltroMateriasProps {
    selectedMaterias: string[]
    onChange: (materias: string[]) => void
}

export function FiltroMaterias({ selectedMaterias, onChange }: FiltroMateriasProps) {
    const toggleMateria = (materiaId: string) => {
        if (selectedMaterias.includes(materiaId)) {
            onChange(selectedMaterias.filter((id) => id !== materiaId))
        } else {
            onChange([...selectedMaterias, materiaId])
        }
    }

    return (
        <div className="space-y-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Filtrar Fuentes Normativas
                </h3>
                <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800">
                    {selectedMaterias.length === 0 ? "Todas las fuentes" : `${selectedMaterias.length} seleccionadas`}
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MATERIAS.map((materia) => (
                    <div key={materia.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`materia-${materia.id}`}
                            checked={selectedMaterias.includes(materia.id)}
                            onCheckedChange={() => toggleMateria(materia.id)}
                        />
                        <Label
                            htmlFor={`materia-${materia.id}`}
                            className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                            {materia.label}
                        </Label>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
                Selecciona las materias de interés. Si no seleccionas ninguna, el RAG buscará en todas por defecto.
            </p>
        </div>
    )
}
