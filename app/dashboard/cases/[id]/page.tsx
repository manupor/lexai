export default function CaseDetailPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Detalle del Caso: {params.id}</h1>
            <p className="text-slate-500">Próximamente: Vista completa del expediente con chats y documentos vinculados.</p>
        </div>
    )
}
