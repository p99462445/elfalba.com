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
const jobIndex = headers.indexOf('직업');
const categoryIndex = headers.indexOf('업종'); // Check if it actually exists in a way I missed

console.log(`Job Index: ${jobIndex}, Category Index: ${categoryIndex}`);

lines.slice(1, 20).forEach(line => {
    const cols = parseLine(line);
    if (cols[jobIndex]) console.log(`Row ${cols[0]} Job: ${cols[jobIndex]}`);
    if (categoryIndex !== -1 && cols[categoryIndex]) console.log(`Row ${cols[0]} Category: ${cols[categoryIndex]}`);
});
