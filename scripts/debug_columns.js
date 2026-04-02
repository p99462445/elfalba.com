const fs = require('fs');

function parseLine(line) {
    if (!line) return [];
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result.map(s => s.replace(/^"|"$/g, ''));
}

const csvFile = 'test_users_final_fixed.csv';
const fileContent = fs.readFileSync(csvFile, 'utf8');
const lines = fileContent.split('\n');
const headers = parseLine(lines[0]);

headers.forEach((h, i) => console.log(`${i}: ${h}`));
