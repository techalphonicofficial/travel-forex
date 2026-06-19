const axios = require('axios');

async function test() {
  try {
    const response = await axios.get('https://tourtravel.yber.in/api/v1/packages');
    const packages = response.data?.data || [];
    console.log(`Fetched ${packages.length} packages.`);
    if (packages.length > 0) {
      console.log('Sample package:', JSON.stringify(packages[0], null, 2));
      console.log('\nAll packages destination structures:');
      packages.forEach(pkg => {
        console.log(`- ID: ${pkg.id}, Name: "${pkg.name}"`);
        console.log(`  destinations:`, JSON.stringify(pkg.destinations, null, 2));
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
