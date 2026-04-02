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

// Find a row that is "업소회원"
for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols[1] === '업소회원') {
        console.log(`--- Row ${cols[0]} (${cols[2]}) ---`);
        cols.forEach((val, idx) => {
            if (val && val !== '""' && val !== '0' && val !== '1') {
                console.log(`${idx} (${headers[idx]}): ${val}`);
            }
        });
        break;
    }
}
