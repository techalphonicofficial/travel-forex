const axios = require('axios');

async function check() {
  const url = 'https://tourtravel.yber.in/uploads/categories/cat-1781698483823-583028266.png';
  try {
    const response = await axios.get(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'http://localhost:3000/'
      }
    });
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data length:', response.data.length);
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Headers:', error.response.headers);
      console.log('Error Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

check();
