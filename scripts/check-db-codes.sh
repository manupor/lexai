#!/bin/bash

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo "🔍 Verificando códigos en la base de datos..."
echo ""

# Query using psql
psql "$DATABASE_URL" << 'EOF'
\echo '📚 Códigos disponibles:'
\echo ''
SELECT 
  code,
  title,
  category,
  (SELECT COUNT(*) FROM "Article" WHERE "legalCodeId" = "LegalCode".id) as articles
FROM "LegalCode"
ORDER BY code;

\echo ''
\echo '🔎 Artículos de ejemplo:'
\echo ''
SELECT 
  lc.title,
  a.number,
  LEFT(a.content, 100) || '...' as preview
FROM "Article" a
JOIN "LegalCode" lc ON a."legalCodeId" = lc.id
WHERE 
  (lc.code = 'codigo-civil' AND a.number = '1')
  OR (lc.code = 'codigo-comercio' AND a.number = '1')
  OR (lc.code = 'codigo-trabajo' AND a.number = '45')
ORDER BY lc.code, a.number;
EOF
