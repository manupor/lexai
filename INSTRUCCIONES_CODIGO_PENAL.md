# Cómo habilitar el Código Procesal Penal

El soporte para el **Código Procesal Penal (Ley N° 7594)** ya está implementado en el código base.

## Pasos Requeridos

Debido a restricciones de descarga automática en sitios gubernamentales, debes agregar el archivo PDF manualmente:

1.  **Descarga el PDF**:
    *   Puedes obtenerlo de [PGR Web](http://www.pgrweb.go.cr/scij/) o [Corte IDH](https://www.corteidh.or.cr/docs/legislacion/Codigo_Procesal_Penal_Costa_Rica.pdf).
    *   Asegúrate de que sea la Ley N° 7594.

2.  **Guardar Archivo**:
    *   Guarda el archivo en: `data/pdfs/codigo-procesal-penal.pdf`

3.  **Procesar y Cargar (Comandos)**:
    Ejecuta estos comandos en tu terminal:

    ```bash
    # 1. Extraer texto del PDF (Python)
    python3 scripts/python/process_docs.py

    # 2. Cargar a la Base de Datos
    npx tsx scripts/load-all-codes.ts
    ```

4.  **Verificar**:
    ```bash
    npx tsx scripts/verify-codes.ts
    ```

Una vez hecho esto, el chatbot responderá preguntas sobre el Código Procesal Penal automáticamente.
