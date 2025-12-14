#!/bin/bash

echo "🧪 Testing LexAI Production Deployment"
echo "========================================"
echo ""

# Test 1: Database connectivity
echo "1️⃣ Testing database connectivity..."
response=$(curl -s "https://www.lex-ai.dev/api/test-db")
if echo "$response" | grep -q '"success":true'; then
    echo "   ✅ Database connected"
else
    echo "   ❌ Database connection failed"
    echo "   Response: $response"
    exit 1
fi
echo ""

# Test 2: Check codes availability
echo "2️⃣ Checking legal codes..."
codes_count=$(echo "$response" | grep -o '"code":' | wc -l)
echo "   Found $codes_count codes"

if echo "$response" | grep -q 'codigo-comercio'; then
    echo "   ✅ Código de Comercio available"
else
    echo "   ❌ Código de Comercio NOT found"
fi

if echo "$response" | grep -q 'codigo-civil'; then
    echo "   ✅ Código Civil available"
else
    echo "   ❌ Código Civil NOT found"
fi

if echo "$response" | grep -q 'codigo-trabajo'; then
    echo "   ✅ Código de Trabajo available"
else
    echo "   ❌ Código de Trabajo NOT found"
fi
echo ""

# Test 3: Chat API with comerciante query
echo "3️⃣ Testing chat API with 'comerciante' query..."
chat_response=$(curl -s -X POST "https://www.lex-ai.dev/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cómo se define al comerciante en el Código de Comercio?",
    "messages": []
  }')

if echo "$chat_response" | grep -q "Artículo 1"; then
    echo "   ✅ Chat found Article 1"
else
    echo "   ⚠️  Chat did not mention Article 1"
fi

if echo "$chat_response" | grep -q "Son comerciantes"; then
    echo "   ✅ Chat cited correct text"
else
    echo "   ⚠️  Chat did not cite article text"
fi

if echo "$chat_response" | grep -q "No tengo acceso"; then
    echo "   ❌ Chat still saying 'no access' - CODE_MAP not updated"
else
    echo "   ✅ Chat has access to articles"
fi
echo ""

# Test 4: Check article 45 Código de Trabajo
echo "4️⃣ Testing Article 45 Código de Trabajo..."
if echo "$response" | grep -q '"found":true'; then
    echo "   ✅ Article 45 found in database"
else
    echo "   ❌ Article 45 NOT found"
fi
echo ""

echo "========================================"
echo "✅ Production tests completed"
echo ""
echo "🔗 Test the chat at: https://www.lex-ai.dev/dashboard"
echo ""
echo "Try asking:"
echo "  - ¿Cómo se define al comerciante?"
echo "  - ¿Qué dice el artículo 45 del Código de Trabajo?"
echo "  - ¿Qué es un contrato según el Código Civil?"
