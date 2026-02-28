
async function testChatApi() {
    const query = "dime lo que dice el artículo 41 del Código Penal";
    console.log(`🚀 Probando API con consulta: "${query}"...`);

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: query,
                messages: []
            }),
        });

        const data = await response.json();
        console.log('\n📥 RESPUESTA RECIBIDA:');
        console.log('--------------------------------------------------');
        console.log(data.message);
        console.log('--------------------------------------------------');
        console.log(`Tokens usados: ${data.tokensUsed}`);
    } catch (error) {
        console.error('❌ Error probando la API:', error);
    }
}

testChatApi();
