const fs = require('fs');
const path = require('path');

const OLD_URL = 'tourtravel.yber.in';
const NEW_URL = 'tourtravel.yber.in';

function replaceInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(OLD_URL)) {
            content = content.split(OLD_URL).join(NEW_URL);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Replaced in ${filePath}`);
        }
    } catch (err) {
        console.error(`Error processing ${filePath}: ${err.message}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === '.next') {
            continue;
        }
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (stat.isFile()) {
            if (file.endsWith('.js') || file.endsWith('.mjs') || file === '.env') {
                replaceInFile(fullPath);
            }
        }
    }
}

walkDir(__dirname);
