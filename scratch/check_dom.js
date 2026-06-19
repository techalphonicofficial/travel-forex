const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Find img tags inside class="traveller-photo-wrap"
    console.log('Page loaded, length:', data.length);
    const regex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log('Found Image:', match[1]);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching page:', err.message);
});
