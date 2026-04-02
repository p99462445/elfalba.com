const API_SECRET = 'N7TXj9aQVXs66QGf57KkVdNdECkz1ioRZhajdzezImtELMe0ZRcthxDlDsO4DjhZsyNzPEGLPZF8WD9v';

async function run() {
  console.log('Checking PortOne Store Info...');
  
  try {
    // Try to get store info (if there's such an endpoint, or just check the token validity)
    // Actually, listing channels is the best way to see the store's channels.
    // I'll try the /channels endpoint again with detailed logging.
    
    const response = await fetch('https://api.portone.io/channels', {
      method: 'GET',
      headers: {
        'Authorization': `PortOne ${API_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    const text = await response.text();
    console.log('HTTP Status:', response.status);
    console.log('Raw Response:', text);
    
    if (response.ok) {
        const data = JSON.parse(text);
        console.log('--- Channels Found ---');
        data.items.forEach(ch => {
            console.log(`- Name: ${ch.name}, Key: ${ch.key}, Type: ${ch.type}, PG: ${ch.pgProvider}`);
        });
    }
    
  } catch (err) {
    console.error('Execution Error:', err);
  }
}

run();
