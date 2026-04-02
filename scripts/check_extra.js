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

const lines = fs.readFileSync('test_users_final_fixed.csv', 'utf8').split('\n');
const headers = parseLine(lines[0]);

for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols[1] === '업소회원') {
        const nonZeroExtra = [];
        for (let j = 35; j <= 59; j++) {
            if (cols[j] && cols[j] !== '0') {
                nonZeroExtra.push(`${headers[j]}: ${cols[j]}`);
            }
        }
        if (nonZeroExtra.length > 0) {
            console.log(`Row ${cols[0]} extra values: ${nonZeroExtra.join(', ')}`);
        }
    }
}
