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
  
  if (content.includes('useRouter(') && !content.includes('import { useRouter }') && !content.match(/import\s+\{.*useRouter.*\}\s+from\s+['"]next\/navigation['"]/)) {
     console.log('Missing useRouter import in:', file);
     content = content.replace(/(import .*?;[\r\n]+)/, "$1import { useRouter } from 'next/navigation';\n");
     fs.writeFileSync(file, content);
     count++;
  }
}
console.log('Total useRouter fixed:', count);
