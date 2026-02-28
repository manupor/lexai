#!/bin/bash
# Se espera que estas variables estén en el entorno o en el .env raíz
# export DATABASE_URL="..."
# export OPENAI_API_KEY="..."
export PYTHONPATH=.pylib

echo "Ingesting Ley General de la Administracion Publica..."
python3 ingest.py --file "docs/Ley General de la Administracion Publica.pdf" --fuente "Ley General de la Administración Pública" --materia "administrativo"

echo "Ingesting Ley Resolucion Alternativa Conflictos..."
python3 ingest.py --file "docs/Ley_resolucion_alternativa_conflictos.pdf" --fuente "Ley RAC" --materia "civil"

echo "Ingesting Ley de Transito..."
python3 ingest.py --file "docs/LEY-DE-TRÁNSITO-POR-VÍAS-PÚBLICAS-9078-2022.pdf" --fuente "Ley de Tránsito" --materia "transito"

echo "Ingesting Codigo Civil PDF..."
python3 ingest.py --file "docs/codigo-civil.pdf" --fuente "Código Civil" --materia "civil"

echo "Ingesting Codigo Comercio PDF..."
python3 ingest.py --file "docs/codigo-comercio.pdf" --fuente "Código de Comercio" --materia "comercial"

echo "Ingesting Codigo Procesal Penal TXT..."
python3 ingest.py --file "docs/codigo-procesal-penal.txt" --fuente "Código Procesal Penal" --materia "penal"

echo "Ingesting Codigo Penal TXT..."
python3 ingest.py --file "docs/codigo-penal.txt" --fuente "Código Penal" --materia "penal"

echo "Ingesting Codigo Civil TXT..."
python3 ingest.py --file "docs/código civil.txt" --fuente "Código Civil" --materia "civil"

echo "Ingesting Codigo Procesal Penal PDF..."
python3 ingest.py --file "docs/codigo_procesal_penal_actualizado23-03-06.pdf" --fuente "Código Procesal Penal" --materia "penal"

echo "Done all ingests!"
python3 validate_ingest.py
