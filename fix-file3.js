const fs = require('fs');
const path = 'components/InternationalDestinationSelector.js';
let content = fs.readFileSync(path, 'utf8');

// The file contains literally: \`
// which is a backslash followed by a backtick.
content = content.replace(/\\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(path, content);
console.log('Fixed escape characters in file (v3).');
