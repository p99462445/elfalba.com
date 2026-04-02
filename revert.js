const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir(path.join(__dirname, 'src'));
let changedFilesCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // Revert "바달바" back to "악녀알바"
    let newContent = content.replace(/바달바/g, '악녀알바');

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Reverted: ${file}`);
        changedFilesCount++;
    }
}

console.log(`\nSuccessfully reverted ${changedFilesCount} files back to 악녀알바.`);
