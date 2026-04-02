// API Fetch Script

const API_SECRET = 'N7TXj9aQVXs66QGf57KkVdNdECkz1ioRZhajdzezImtELMe0ZRcthxDlDsO4DjhZsyNzPEGLPZF8WD9v';

async function run() {
  console.log('Fetching channels from PortOne V2...');
  
  try {
    const response = await fetch('https://api.portone.io/channels', {
      method: 'GET',
      headers: {
        'Authorization': `PortOne ${API_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    const text = await response.text();
    console.log('Raw Response:', text);
    
    if (!response.ok) {
        console.error('API Error Status:', response.status);
        return;
    }
    
    const data = JSON.parse(text);
    console.log('--- Channel List ---');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

run();
