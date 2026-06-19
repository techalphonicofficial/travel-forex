const axios = require('axios');
const fs = require('fs');

async function download() {
  const url = 'https://tourtravel.yber.in/uploads/categories/cat-1781698483823-583028266.png';
  const path = 'scratch/luxury.png';
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'http://localhost:3000/'
      }
    });

    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Download failed:', error.message);
  }
}

download().then(() => {
  console.log('Download complete');
  const stats = fs.statSync('scratch/luxury.png');
  console.log('File size:', stats.size);
}).catch(console.error);
