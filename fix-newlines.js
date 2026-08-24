const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
};

const allFiles = walkSync(path.join(process.cwd(), 'app'));
allFiles.push(...walkSync(path.join(process.cwd(), 'components')));

let count = 0;
for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(/\{\\n\s+const router/)) {
    content = content.replace(/\{\\n\s+const router/g, '{\n  const router');
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
    count++;
  }
}
console.log('Total fixed:', count);
