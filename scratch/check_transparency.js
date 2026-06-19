const fs = require('fs');
const https = require('https');

const url = 'https://tourtravel.yber.in/uploads/categories/1717646549_a2cf31ec0016e788801d.png';
const file = fs.createWriteStream('scratch/luxury.png');

const options = {
  hostname: 'tourtravel.yber.in',
  port: 443,
  path: '/uploads/categories/1717646549_a2cf31ec0016e788801d.png',
  method: 'GET',
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'Mozilla/5.0'
  }
};

https.get(options, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close(() => {
      console.log('Download completed');
      const buffer = fs.readFileSync('scratch/luxury.png');
      console.log('File size:', buffer.length);
      console.log('Header bytes:', buffer.slice(0, 8));
    });
  });
}).on('error', (err) => {
  console.error('Error downloading:', err.message);
});
