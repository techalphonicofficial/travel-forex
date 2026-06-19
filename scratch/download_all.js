const axios = require('axios');
const fs = require('fs');

const images = {
  couple: 'https://tourtravel.yber.in/uploads/categories/cat-1781698445024-38041031.png',
  luxury: 'https://tourtravel.yber.in/uploads/categories/cat-1781698483823-583028266.png',
  honeymoon: 'https://tourtravel.yber.in/uploads/categories/cat-1781698501084-836193355.png',
  trending: 'https://tourtravel.yber.in/uploads/categories/cat-1781698517102-658029977.png',
  budget: 'https://tourtravel.yber.in/uploads/categories/cat-1781698529309-588346177.png'
};

async function downloadAll() {
  for (const [name, url] of Object.entries(images)) {
    const path = `scratch/${name}.png`;
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      const writer = fs.createWriteStream(path);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      console.log(`Downloaded ${name}`);
    } catch (err) {
      console.error(`Failed ${name}:`, err.message);
    }
  }
}

downloadAll();
