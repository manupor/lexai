
async function testChatApiGeneral() {
    const query = "dime lo que dice el artículo 23";
    console.log(`🚀 Probando API con consulta GENERAL: "${query}"...`);

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
        console.log(data.message);
    } catch (error) {
        console.error('❌ Error probando la API:', error);
    }
}

testChatApiGeneral();
